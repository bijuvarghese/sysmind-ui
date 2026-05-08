type AgentStep = {
  type?: unknown;
  message?: unknown;
  toolCall?: {
    toolName?: unknown;
    arguments?: unknown;
  } | null;
  toolResult?: {
    toolName?: unknown;
    content?: unknown;
    error?: unknown;
    errorMessage?: unknown;
  } | null;
};

type AgentResponse = {
  answer?: unknown;
  steps?: unknown;
};

function formatSteps(steps: AgentStep[]): string {
  const lines = steps.flatMap((step) => {
    if (step.type === "tool_result" && step.toolResult?.error === true) {
      const errorMessage =
        typeof step.toolResult.errorMessage === "string" ? ` (${step.toolResult.errorMessage})` : "";
      return [`Tool result: failed${errorMessage}`];
    }

    if (step.type === "tool_result" && step.toolResult && step.toolResult.error !== true) {
      return formatToolResult(step.toolResult);
    }

    return [];
  });

  return lines.length > 0 ? `\n\n---\n\n${lines.join("\n\n")}` : "";
}

function formatToolResult(toolResult: NonNullable<AgentStep["toolResult"]>): string[] {
  const toolName = typeof toolResult.toolName === "string" ? toolResult.toolName : "tool";
  const content = normalizeToolContent(toolResult.content);
  const displayName = inferToolName(toolName, content);

  if (content == null) {
    return [`**${formatToolTitle(displayName)}**\n\nNo details were returned.`];
  }

  if (displayName === "machine_status" && isRecord(content)) {
    return [formatMachineStatus(content)];
  }

  if (displayName === "chroma_status" && isRecord(content)) {
    return [formatChromaStatus(content)];
  }

  if (displayName === "latest_news" && isRecord(content)) {
    return [formatNewsResult(content)];
  }

  if (typeof content === "string") {
    return [`**${formatToolTitle(displayName)}**\n\n${content}`];
  }

  if (isRecord(content)) {
    return [formatGenericRecord(formatToolTitle(displayName), content)];
  }

  if (Array.isArray(content)) {
    return [formatGenericList(formatToolTitle(displayName), content)];
  }

  return [`**${formatToolTitle(displayName)}**\n\n${String(content)}`];
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
    bullet("CPU", cpuSummary(cpu)),
    bullet("CPU load", loadSummary(cpu)),
    bullet("RAM", memorySummary(memory)),
    bullet("Swap", swapSummary(memory)),
    bullet("Storage", storageSummary(storage)),
    bullet("Uptime", uptimeSummary(runtime)),
    bullet("Boot time", textAt(runtime, "lastStarted")),
    bullet("Power", powerSummary(power)),
    bullet("User", textAt(system, "loggedInUser")),
    bullet("Generated", textAt(status, "generatedAt")),
  ]
    .filter(Boolean)
    .join("\n");
}

function bullet(label: string, value: string | null): string {
  return value ? `- **${label}:** ${value}` : "";
}

function cpuSummary(cpu: Record<string, unknown> | null): string | null {
  if (!cpu) return null;

  const coreSummary = textAt(cpu, "coreSummary");
  const totalCores = numberAt(cpu, "totalCpuCores");
  const physicalCores = numberAt(cpu, "physicalCpuCores");
  const logicalCores = numberAt(cpu, "logicalCpuCores");

  if (coreSummary) return coreSummary;
  if (physicalCores != null && logicalCores != null) {
    return `${physicalCores} physical / ${logicalCores} logical cores`;
  }
  if (totalCores != null) return `${totalCores} cores`;
  return null;
}

function loadSummary(cpu: Record<string, unknown> | null): string | null {
  if (!cpu) return null;

  const usage = numberAt(cpu, "currentCpuUsagePercent");
  const one = numberAt(cpu, "loadAverageOneMinute");
  const five = numberAt(cpu, "loadAverageFiveMinutes");
  const fifteen = numberAt(cpu, "loadAverageFifteenMinutes");
  const values = [one, five, fifteen].filter((value): value is number => value != null);

  if (usage != null && values.length > 0) {
    return `${formatPercent(usage)} used; load averages ${values.map(formatNumber).join(", ")}`;
  }
  if (usage != null) return `${formatPercent(usage)} used`;
  if (values.length > 0) return `Load averages ${values.map(formatNumber).join(", ")}`;
  return null;
}

function memorySummary(memory: Record<string, unknown> | null): string | null {
  if (!memory) return null;

  const used = numberAt(memory, "usedGb");
  const total = numberAt(memory, "totalGb");
  const available = numberAt(memory, "availableGb");
  const usage = numberAt(memory, "usagePercent");
  const status = textAt(memory, "status");
  const parts: string[] = [];

  if (used != null && total != null) {
    parts.push(`${formatNumber(used)} GB used of ${formatNumber(total)} GB`);
  } else if (total != null) {
    parts.push(`${formatNumber(total)} GB total`);
  }
  if (available != null) parts.push(`${formatNumber(available)} GB available`);
  if (usage != null) parts.push(`${formatPercent(usage)} used`);
  if (status) parts.push(status);

  return parts.length > 0 ? parts.join("; ") : null;
}

function swapSummary(memory: Record<string, unknown> | null): string | null {
  if (!memory) return null;

  const used = numberAt(memory, "swapPageFileUsedGb");
  const total = numberAt(memory, "swapPageFileTotalGb");
  const usage = numberAt(memory, "swapPageFileUsagePercent");
  const parts: string[] = [];

  if (used != null && total != null) parts.push(`${formatNumber(used)} GB used of ${formatNumber(total)} GB`);
  if (usage != null) parts.push(`${formatPercent(usage)} used`);

  return parts.length > 0 ? parts.join("; ") : null;
}

function storageSummary(storage: Record<string, unknown> | null): string | null {
  if (!storage) return null;

  const used = numberAt(storage, "usedGb");
  const total = numberAt(storage, "totalGb");
  const free = numberAt(storage, "freeGb");
  const usage = numberAt(storage, "usagePercent");
  const status = textAt(storage, "status");
  const parts: string[] = [];

  if (used != null && total != null) {
    parts.push(`${formatNumber(used)} GB used of ${formatNumber(total)} GB`);
  } else if (total != null) {
    parts.push(`${formatNumber(total)} GB total`);
  }
  if (free != null) parts.push(`${formatNumber(free)} GB free`);
  if (usage != null) parts.push(`${formatPercent(usage)} used`);
  if (status) parts.push(status);

  return parts.length > 0 ? parts.join("; ") : null;
}

function uptimeSummary(runtime: Record<string, unknown> | null): string | null {
  if (!runtime) return null;
  return textAt(runtime, "runningFor") ?? secondsAt(runtime, "uptimeSeconds");
}

function powerSummary(power: Record<string, unknown> | null): string | null {
  if (!power) return null;

  const battery = numberAt(power, "batteryPercent");
  const source = textAt(power, "powerSource");
  const charging = booleanAt(power, "charging");
  const health = textAt(power, "health") ?? textAt(power, "condition") ?? textAt(power, "status");
  const parts: string[] = [];

  if (battery != null) parts.push(`${formatPercent(battery)} battery`);
  if (source) parts.push(source);
  if (charging != null) parts.push(charging ? "charging" : "not charging");
  if (health) parts.push(health);

  return parts.length > 0 ? parts.join("; ") : null;
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
      lines.push(`- **${title}**${details ? ` (${details})` : ""}`);
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
      .filter((text): text is string => text != null && text.trim().length > 0);

    if (textItems.length === value.length && textItems.length > 0) {
      const combined = textItems.join("\n\n");
      return parseJsonString(combined) ?? combined;
    }

    return value.map(normalizeToolContent);
  }

  if (isRecord(value)) {
    if ("structuredContent" in value) {
      return normalizeToolContent(value.structuredContent);
    }
    if ("result" in value) {
      return normalizeToolContent(value.result);
    }
    if ("content" in value && Array.isArray(value.content)) {
      return normalizeToolContent(value.content);
    }
  }

  return value;
}

function parseJsonString(value: string): unknown | null {
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return null;
  }

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

function formatToolTitle(toolName: string): string {
  if (toolName === "tool") return "Tool details";
  if (toolName === "system_usage") return "System usage";
  return labelFromKey(toolName);
}

function labelFromKey(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key;
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

export async function POST(req: Request) {
  const body = await req.json();
  const prompt = typeof body?.prompt === "string" ? body.prompt : "";

  if (!prompt.trim()) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const agentBaseUrl = process.env.AGENT_BACKEND_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${agentBaseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ message: prompt }),
    });

    const data = (await response.json().catch(() => null)) as AgentResponse | null;

    if (!response.ok) {
      return Response.json(
        {
          error: "Agent chat request failed.",
          status: response.status,
          data,
        },
        { status: response.status },
      );
    }

    const answer = typeof data?.answer === "string" ? data.answer : null;
    const steps = Array.isArray(data?.steps) ? (data.steps as AgentStep[]) : [];

    if (!answer) {
      return Response.json(
        {
          error: "Agent response did not include an answer.",
          data,
        },
        { status: 502 },
      );
    }

    return Response.json({
      response: `${answer}${formatSteps(steps)}`,
      steps,
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to reach SysMind agent.",
        detail: error instanceof Error ? error.message : "Unknown upstream error.",
      },
      { status: 502 },
    );
  }
}
