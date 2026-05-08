export type AgentStep = {
  type?: unknown;
  message?: unknown;
  toolCall?: {
    toolName?: unknown;
    arguments?: unknown;
  } | null;
  toolResult?: ToolResult | null;
};

export type ToolResult = {
  toolName?: unknown;
  content?: unknown;
  error?: unknown;
  errorMessage?: unknown;
};

export function formatToolSummaryFromSteps(steps: AgentStep[]): string {
  const lines = steps.flatMap((step) => {
    if (step.type === "tool_result" && step.toolResult?.error === true) {
      return [formatToolFailure(step.toolResult)];
    }

    if (step.type === "tool_result" && step.toolResult && step.toolResult.error !== true) {
      return [formatToolResultForUser(toolNameFromResult(step.toolResult), step.toolResult.content)];
    }

    return [];
  });

  return lines.length > 0 ? `\n\n---\n\n${lines.join("\n\n")}` : "";
}

export function toolLabel(toolName: string): string {
  if (toolName === "tool") return "Tool";
  if (toolName === "system_usage") return "System usage";
  return labelFromKey(toolName);
}

export function toolNameFromResult(toolResult: ToolResult): string {
  return typeof toolResult.toolName === "string" ? toolResult.toolName : "tool";
}

export function formatToolFailure(toolResult: ToolResult): string {
  const toolName = toolNameFromResult(toolResult);
  const errorMessage =
    typeof toolResult.errorMessage === "string" && toolResult.errorMessage.trim()
      ? toolResult.errorMessage.trim()
      : "The tool returned an error.";

  return `**${toolLabel(toolName)}**\n- **Status:** Failed\n- **Reason:** ${errorMessage}`;
}

export function formatToolResultForUser(toolName: string, content: unknown): string {
  const normalized = normalizeToolContent(content);
  const inferredToolName = inferToolName(toolName, normalized);

  if (normalized == null) {
    return `**${toolLabel(inferredToolName)}**\n\nNo details were returned.`;
  }

  if (inferredToolName === "machine_status" && isRecord(normalized)) {
    return formatMachineStatus(normalized);
  }

  if (inferredToolName === "chroma_status" && isRecord(normalized)) {
    return formatChromaStatus(normalized);
  }

  if (inferredToolName === "latest_news" && isRecord(normalized)) {
    return formatNewsResult(normalized);
  }

  if (typeof normalized === "string") {
    return `**${toolLabel(inferredToolName)}**\n\n${normalized}`;
  }

  if (isRecord(normalized)) {
    return formatGenericRecord(toolLabel(inferredToolName), normalized);
  }

  if (Array.isArray(normalized)) {
    return formatGenericList(toolLabel(inferredToolName), normalized);
  }

  return `**${toolLabel(inferredToolName)}**\n\n${String(normalized)}`;
}

function formatMachineStatus(status: Record<string, unknown>): string {
  const cpu = recordAt(status, "processorDetails");
  const memory = recordAt(status, "memoryDetails");
  const storage = recordAt(status, "storageDetails");
  const runtime = recordAt(status, "systemStatus");
  const system = recordAt(status, "systemDetails");
  const power = recordAt(status, "powerDetails");

  return [
    "**Machine status**",
    bullet("Computer", textAt(status, "computerName")),
    bullet("OS", textAt(status, "operatingSystem")),
    bullet("Machine type", textAt(status, "machineType")),
    bullet("Processor", textAt(status, "processor")),
    bullet("CPU", textAt(cpu, "coreSummary") ?? cpuCoreSummary(cpu)),
    bullet("CPU load", loadSummary(cpu)),
    bullet("RAM", memorySummary(memory)),
    bullet("Swap", swapSummary(memory)),
    bullet("Storage", storageSummary(storage)),
    bullet("Uptime", textAt(runtime, "runningFor") ?? secondsAt(runtime, "uptimeSeconds")),
    bullet("Boot time", textAt(runtime, "lastStarted")),
    bullet("Power", powerSummary(power)),
    bullet("User", textAt(system, "loggedInUser")),
    bullet("Generated", textAt(status, "generatedAt")),
  ]
    .filter(Boolean)
    .join("\n");
}

function formatChromaStatus(status: Record<string, unknown>): string {
  const healthy = booleanAt(status, "healthy");

  return [
    healthy === true ? "**Chroma is healthy**" : healthy === false ? "**Chroma needs attention**" : "**Chroma status**",
    bullet("URL", textAt(status, "url")),
    bullet("Tenant", textAt(status, "tenant")),
    bullet("Database", textAt(status, "database")),
    bullet("Collection", textAt(status, "collection")),
    bullet("Version", textAt(status, "version")),
    bullet("Health check", textAt(status, "healthcheck")),
    bullet("Error", textAt(status, "error")),
  ]
    .filter(Boolean)
    .join("\n");
}

function formatNewsResult(result: Record<string, unknown>): string {
  const articles = Array.isArray(result.articles) ? result.articles.filter(isRecord) : [];
  const fetchedAt = formatReadableDateTime(textAt(result, "fetchedAt"));
  const lines = [
    "**Latest news**",
    fetchedAt ? `> Updated ${fetchedAt}` : null,
    bullet("Error", textAt(result, "error")),
  ].filter(Boolean);

  for (const article of articles.slice(0, 8)) {
    const title = textAt(article, "title");
    const source = textAt(article, "source");
    const publishedAt = formatReadableDateTime(textAt(article, "publishedAt"));
    const url = textAt(article, "url");
    const details = [source, publishedAt].filter(Boolean).join(" - ");

    if (title && url) {
      lines.push(`- [${escapeMarkdown(title)}](${url})${details ? ` (${details})` : ""}`);
    } else if (title) {
      lines.push(`- **${escapeMarkdown(title)}**${details ? ` (${details})` : ""}`);
    }
  }

  return lines.join("\n");
}

function formatGenericRecord(title: string, record: Record<string, unknown>): string {
  const lines = [`**${title}**`];

  for (const [key, value] of Object.entries(record)) {
    const formatted = formatGenericValue(value);
    if (formatted) {
      lines.push(bullet(labelFromKey(key), formatted));
    }
  }

  return lines.length > 1 ? lines.join("\n") : `**${title}**\n\nNo displayable details were returned.`;
}

function formatGenericList(title: string, values: unknown[]): string {
  const lines = [`**${title}**`];

  for (const value of values.slice(0, 20)) {
    const formatted = formatGenericValue(value);
    if (formatted) {
      lines.push(`- ${formatted}`);
    }
  }

  return lines.length > 1 ? lines.join("\n") : `**${title}**\n\nNo displayable details were returned.`;
}

function formatGenericValue(value: unknown): string | null {
  const normalized = normalizeToolContent(value);

  if (normalized == null || normalized === "") return null;
  if (typeof normalized === "boolean") return normalized ? "Yes" : "No";
  if (typeof normalized === "number") return formatNumber(normalized);
  if (typeof normalized === "string") return normalized;

  if (Array.isArray(normalized)) {
    return normalized.map(formatGenericValue).filter(Boolean).join(", ") || null;
  }

  if (isRecord(normalized)) {
    return Object.entries(normalized)
      .map(([key, nested]) => {
        const formatted = formatGenericValue(nested);
        return formatted ? `${labelFromKey(key)}: ${formatted}` : null;
      })
      .filter(Boolean)
      .join("; ");
  }

  return String(normalized);
}

function normalizeToolContent(value: unknown): unknown {
  if (typeof value === "string") {
    return parseJsonString(value) ?? value;
  }

  if (Array.isArray(value)) {
    const textItems = value
      .map((item) => (isRecord(item) && typeof item.text === "string" ? item.text : null))
      .filter((text): text is string => Boolean(text?.trim()));

    if (textItems.length === value.length && textItems.length > 0) {
      const combined = textItems.join("\n\n");
      return parseJsonString(combined) ?? combined;
    }

    return value.map(normalizeToolContent);
  }

  if (isRecord(value)) {
    if ("structuredContent" in value) return normalizeToolContent(value.structuredContent);
    if ("result" in value) return normalizeToolContent(value.result);
    if ("content" in value && Array.isArray(value.content)) return normalizeToolContent(value.content);
  }

  return value;
}

function parseJsonString(value: string): unknown | null {
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function inferToolName(toolName: string, content: unknown): string {
  if (toolName !== "tool") return toolName;
  if (!isRecord(content)) return toolName;

  if ("processorDetails" in content || "memoryDetails" in content || "systemStatus" in content) return "machine_status";
  if ("healthy" in content && ("tenant" in content || "collection" in content)) return "chroma_status";
  if ("articles" in content || "feedUrl" in content) return "latest_news";
  if ("free" in content && "total" in content && "used" in content) return "system_usage";

  return toolName;
}

function bullet(label: string, value: string | null): string {
  return value ? `- **${label}:** ${value}` : "";
}

function cpuCoreSummary(cpu: Record<string, unknown> | null): string | null {
  const physicalCores = numberAt(cpu, "physicalCpuCores");
  const logicalCores = numberAt(cpu, "logicalCpuCores");
  const totalCores = numberAt(cpu, "totalCpuCores");
  if (physicalCores != null && logicalCores != null) return `${physicalCores} physical / ${logicalCores} logical cores`;
  return totalCores == null ? null : `${totalCores} cores`;
}

function loadSummary(cpu: Record<string, unknown> | null): string | null {
  const usage = numberAt(cpu, "currentCpuUsagePercent");
  const values = [
    numberAt(cpu, "loadAverageOneMinute"),
    numberAt(cpu, "loadAverageFiveMinutes"),
    numberAt(cpu, "loadAverageFifteenMinutes"),
  ].filter((value): value is number => value != null);

  if (usage != null && values.length > 0) return `${formatPercent(usage)} used; load averages ${values.map(formatNumber).join(", ")}`;
  if (usage != null) return `${formatPercent(usage)} used`;
  if (values.length > 0) return `Load averages ${values.map(formatNumber).join(", ")}`;
  return null;
}

function memorySummary(memory: Record<string, unknown> | null): string | null {
  const used = numberAt(memory, "usedGb");
  const total = numberAt(memory, "totalGb");
  const available = numberAt(memory, "availableGb");
  const usage = numberAt(memory, "usagePercent");
  const status = textAt(memory, "status");
  return [
    used != null && total != null ? `${formatNumber(used)} GB used of ${formatNumber(total)} GB` : null,
    total != null && used == null ? `${formatNumber(total)} GB total` : null,
    available == null ? null : `${formatNumber(available)} GB available`,
    usage == null ? null : `${formatPercent(usage)} used`,
    status,
  ]
    .filter(Boolean)
    .join("; ");
}

function swapSummary(memory: Record<string, unknown> | null): string | null {
  const used = numberAt(memory, "swapPageFileUsedGb");
  const total = numberAt(memory, "swapPageFileTotalGb");
  const usage = numberAt(memory, "swapPageFileUsagePercent");
  return [
    used != null && total != null ? `${formatNumber(used)} GB used of ${formatNumber(total)} GB` : null,
    usage == null ? null : `${formatPercent(usage)} used`,
  ]
    .filter(Boolean)
    .join("; ");
}

function storageSummary(storage: Record<string, unknown> | null): string | null {
  const used = numberAt(storage, "usedGb");
  const total = numberAt(storage, "totalGb");
  const free = numberAt(storage, "freeGb");
  const usage = numberAt(storage, "usagePercent");
  const status = textAt(storage, "status");
  return [
    used != null && total != null ? `${formatNumber(used)} GB used of ${formatNumber(total)} GB` : null,
    total != null && used == null ? `${formatNumber(total)} GB total` : null,
    free == null ? null : `${formatNumber(free)} GB free`,
    usage == null ? null : `${formatPercent(usage)} used`,
    status,
  ]
    .filter(Boolean)
    .join("; ");
}

function powerSummary(power: Record<string, unknown> | null): string | null {
  const battery = numberAt(power, "batteryPercent");
  const source = textAt(power, "powerSource");
  const charging = booleanAt(power, "charging");
  const health = textAt(power, "health") ?? textAt(power, "condition") ?? textAt(power, "status");
  return [
    battery == null ? null : `${formatPercent(battery)} battery`,
    source,
    charging == null ? null : charging ? "charging" : "not charging",
    health,
  ]
    .filter(Boolean)
    .join("; ");
}

function recordAt(record: Record<string, unknown> | null, key: string): Record<string, unknown> | null {
  if (!record) return null;
  const value = record[key];
  return isRecord(value) ? value : null;
}

function textAt(record: Record<string, unknown> | null, key: string): string | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberAt(record: Record<string, unknown> | null, key: string): number | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanAt(record: Record<string, unknown> | null, key: string): boolean | null {
  if (!record) return null;
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function secondsAt(record: Record<string, unknown> | null, key: string): string | null {
  const seconds = numberAt(record, key);
  if (seconds == null) return null;

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [
    days > 0 ? `${days}d` : null,
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : `${Math.floor(seconds)}s`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value: number): string {
  return `${formatNumber(value)}%`;
}

function labelFromKey(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key;
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\[\]])/g, "\\$1");
}

function formatReadableDateTime(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
