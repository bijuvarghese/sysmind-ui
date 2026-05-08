"use client";

import { useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { Box, LinearProgress, Paper, Typography } from "@mui/material";
import "katex/dist/katex.min.css";
import ChatHeader from "./ChatHeader";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";
import type { ChatEvent, LLMModel, Message, ToolResult } from "./types";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<LLMModel[] | null>(null);
  const [modelsChecked, setModelsChecked] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const list = Array.isArray(data?.data) ? (data.data as LLMModel[]) : [];
        setModels(list);
      })
      .catch(() => setModels(null))
      .finally(() => setModelsChecked(true));
  }, []);

  const sendMessage = async (event?: SyntheticEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();

    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((current) => [...current, userMessage, { role: "assistant", content: "Starting response..." }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tool-call/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const fallback = (() => {
          if (!data || typeof data !== "object") {
            return `Request failed with status ${res.status}.`;
          }

          const error = "error" in data && typeof data.error === "string" ? data.error : null;
          const preview = "preview" in data && typeof data.preview === "string" ? data.preview : null;

          if (error && preview) {
            return `${error}\n\n${preview}`;
          }

          return error ?? `Request failed with status ${res.status}.`;
        })();

        throw new Error(fallback);
      }

      if (!res.body) {
        throw new Error("The SysMind agent stream did not include a response body.");
      }

      let answer = "";
      const activity: string[] = [];
      const details: string[] = [];
      const displayedToolDetails = new Set<string>();

      const renderAssistant = () => {
        const sections = [
          answer.trim(),
          details.join("\n\n").trim(),
          activity.length > 0 ? `---\n\n**Activity**\n${activity.map((item) => `- ${item}`).join("\n")}` : "",
        ].filter(Boolean);

        return sections.join("\n\n") || "Starting response...";
      };

      const updateAssistant = () => {
        const content = renderAssistant();
        setMessages((current) => updateLastAssistantMessage(current, content));
      };

      await readAgentStream(res, (streamEvent) => {
        const type = typeof streamEvent.type === "string" ? streamEvent.type : "";

        if (type === "message.started") {
          activity.push("Started response");
          updateAssistant();
          return;
        }

        if (type === "tool.started") {
          const toolName = toolNameFromEvent(streamEvent);
          activity.push(`Checking ${toolLabel(toolName)}`);
          updateAssistant();
          return;
        }

        if (type === "tool.finished" && streamEvent.toolResult) {
          const toolName = toolNameFromResult(streamEvent.toolResult);
          const failed = streamEvent.toolResult.error === true;
          activity.push(`${toolLabel(toolName)} ${failed ? "failed" : "finished"}`);

          const formatted = failed
            ? formatToolFailure(streamEvent.toolResult)
            : formatToolResultForUser(toolName, streamEvent.toolResult.content);
          if (formatted && !displayedToolDetails.has(toolName)) {
            details.push(formatted);
            displayedToolDetails.add(toolName);
          }

          updateAssistant();
          return;
        }

        if (type === "message.delta" && typeof streamEvent.message === "string") {
          answer += streamEvent.message;
          updateAssistant();
          return;
        }

        if (type === "message.finished") {
          if (!answer.trim() && typeof streamEvent.message === "string") {
            answer = streamEvent.message;
          }
          updateAssistant();
          return;
        }

        if (type === "error") {
          throw new Error(typeof streamEvent.message === "string" ? streamEvent.message : "Agent stream failed.");
        }
      });
    } catch (error) {
      setMessages((current) =>
        updateLastAssistantMessage(
          current,
          error instanceof Error ? error.message : "Sorry, I couldn't reach the SysMind agent.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;
  const connected = modelsChecked && Boolean(models?.length);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          mx: "auto",
          display: "flex",
          minHeight: "calc(100vh - 32px)",
          maxWidth: 1220,
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        <ChatHeader />

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "rgba(148, 163, 184, 0.18)",
            backgroundColor: "rgba(8, 15, 30, 0.82)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {loading ? <LinearProgress color="secondary" /> : null}

          <Box
            sx={{
              px: { xs: 2, sm: 2.5 },
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {hasMessages ? `${messages.length} message${messages.length === 1 ? "" : "s"}` : "No messages yet"}
            </Typography>
          </Box>

          <MessageList messages={messages} loading={loading} endRef={endRef} />
          <MessageComposer
            input={input}
            loading={loading}
            connected={connected}
            onInputChange={setInput}
            onSubmit={sendMessage}
          />
        </Paper>
      </Box>
    </Box>
  );
}

function updateLastAssistantMessage(messages: Message[], content: string): Message[] {
  const next = [...messages];
  for (let index = next.length - 1; index >= 0; index -= 1) {
    if (next[index].role === "assistant") {
      next[index] = { ...next[index], content };
      return next;
    }
  }
  return [...next, { role: "assistant", content }];
}

async function readAgentStream(response: Response, onEvent: (event: ChatEvent) => void) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("The SysMind agent stream could not be read.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const event = parseSseFrame(frame);
      if (event) onEvent(event);
    }
  }

  buffer += decoder.decode();
  const finalEvent = parseSseFrame(buffer);
  if (finalEvent) onEvent(finalEvent);
}

function parseSseFrame(frame: string): ChatEvent | null {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n")
    .trim();

  if (!data || data === "[DONE]") return null;
  return JSON.parse(data) as ChatEvent;
}

function toolNameFromEvent(event: ChatEvent): string {
  return typeof event.toolCall?.toolName === "string" ? event.toolCall.toolName : "tool";
}

function toolNameFromResult(toolResult: ToolResult): string {
  return typeof toolResult.toolName === "string" ? toolResult.toolName : "tool";
}

function formatToolFailure(toolResult: ToolResult): string {
  const toolName = toolNameFromResult(toolResult);
  const errorMessage =
    typeof toolResult.errorMessage === "string" && toolResult.errorMessage.trim()
      ? toolResult.errorMessage.trim()
      : "The tool returned an error.";

  return `**${toolLabel(toolName)}**\n- **Status:** Failed\n- **Reason:** ${errorMessage}`;
}

function formatToolResultForUser(toolName: string, content: unknown): string {
  const normalized = normalizeToolContent(content);
  const inferredToolName = inferToolName(toolName, normalized);

  if (inferredToolName === "machine_status" && isRecord(normalized)) {
    return formatMachineStatus(normalized);
  }

  if (inferredToolName === "ram_usage" && isRecord(normalized)) {
    return formatUsageStatus("RAM status", normalized);
  }

  if (inferredToolName === "disk_usage" && isRecord(normalized)) {
    return formatUsageStatus("Disk status", normalized);
  }

  if (inferredToolName === "chroma_status" && isRecord(normalized)) {
    return formatChromaStatus(normalized);
  }

  if (inferredToolName === "latest_news" && isRecord(normalized)) {
    return formatNewsResult(normalized);
  }

  if (isRecord(normalized)) {
    return formatGenericRecord(toolLabel(inferredToolName), normalized);
  }

  if (Array.isArray(normalized)) {
    return `**${toolLabel(inferredToolName)}**\n${normalized.map((value) => `- ${formatGenericValue(value)}`).join("\n")}`;
  }

  return `**${toolLabel(inferredToolName)}**\n${String(normalized ?? "No details were returned.")}`;
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

function formatUsageStatus(title: string, usage: Record<string, unknown>): string {
  const free = numberAt(usage, "free");
  const total = numberAt(usage, "total");
  const used = numberAt(usage, "used");
  const usagePercent = total && used != null ? (used / total) * 100 : null;

  return [
    `**${title}**`,
    bullet("Used", used != null && total != null ? `${formatBytes(used)} of ${formatBytes(total)}` : formatMaybeBytes(used)),
    bullet("Free", formatMaybeBytes(free)),
    bullet("Usage", usagePercent == null ? null : formatPercent(usagePercent)),
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
  const lines = [
    "**Latest news**",
    bullet("Fetched", textAt(result, "fetchedAt")),
    bullet("Feed", textAt(result, "feedUrl")),
    bullet("Error", textAt(result, "error")),
  ].filter(Boolean);

  for (const article of articles.slice(0, 8)) {
    const title = textAt(article, "title");
    const source = textAt(article, "source");
    const publishedAt = textAt(article, "publishedAt");
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
    lines.push(bullet(labelFromKey(key), formatGenericValue(value)));
  }
  return lines.filter(Boolean).join("\n");
}

function formatGenericValue(value: unknown): string | null {
  const normalized = normalizeToolContent(value);
  if (normalized == null || normalized === "") return null;
  if (typeof normalized === "boolean") return normalized ? "Yes" : "No";
  if (typeof normalized === "number") return formatNumber(normalized);
  if (typeof normalized === "string") return normalized;
  if (Array.isArray(normalized)) return normalized.map(formatGenericValue).filter(Boolean).join(", ") || null;
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
  return [
    days > 0 ? `${days}d` : null,
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatMaybeBytes(value: number | null): string | null {
  return value == null ? null : formatBytes(value);
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Math.max(0, bytes);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${formatNumber(value)} ${units[unitIndex]}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value: number): string {
  return `${formatNumber(value)}%`;
}

function toolLabel(toolName: string): string {
  if (toolName === "tool") return "Tool";
  return labelFromKey(toolName);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
