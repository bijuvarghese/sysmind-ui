"use client";

import { useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { Box, LinearProgress, Paper, Typography } from "@mui/material";
import "katex/dist/katex.min.css";
import ChatHeader from "./ChatHeader";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";
import { formatToolFailure, formatToolResultForUser, toolLabel, toolNameFromResult } from "../lib/tool-formatters";
import type { ChatEvent, LLMModel, Message } from "./types";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<LLMModel[] | null>(null);
  const [modelsChecked, setModelsChecked] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const requestInFlightRef = useRef(false);

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
    if (!prompt || loading || requestInFlightRef.current) return;

    requestInFlightRef.current = true;
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
      let responseFinished = false;

      const renderAssistant = () => {
        const sections = [
          answer.trim(),
          !responseFinished && !answer.trim() ? details.join("\n\n").trim() : "",
          !responseFinished && activity.length > 0 ? `> Activity: ${activity.join(" · ")}` : "",
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
          responseFinished = true;
          updateAssistant();
          return;
        }

        if (type === "error") {
          throw new Error(typeof streamEvent.message === "string" ? streamEvent.message : "Agent stream failed.");
        }
      });
      responseFinished = true;
      updateAssistant();
    } catch (error) {
      setMessages((current) =>
        updateLastAssistantMessage(
          current,
          error instanceof Error ? error.message : "Sorry, I couldn't reach the SysMind agent.",
        ),
      );
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;
  const connected = modelsChecked && Boolean(models?.length);

  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        minHeight: "100vh",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(120deg, transparent 0%, rgba(0, 229, 255, 0.12) 22%, transparent 38%, rgba(255, 61, 242, 0.1) 62%, transparent 78%)",
          opacity: 0.85,
          animation: "scanFlow 12s linear infinite",
        },
        "@keyframes scanFlow": {
          "0%": { transform: "translateX(-35%)" },
          "100%": { transform: "translateX(35%)" },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
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
            position: "relative",
            overflow: "hidden",
            border: "1px solid",
            borderColor: "rgba(0, 229, 255, 0.24)",
            background:
              "linear-gradient(180deg, rgba(7, 17, 31, 0.9) 0%, rgba(2, 3, 10, 0.92) 100%)",
            boxShadow: "0 30px 90px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            display: "flex",
            flexDirection: "column",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(90deg, rgba(0, 229, 255, 0.1) 0 1px, transparent 1px 100%), linear-gradient(180deg, rgba(255, 255, 255, 0.045) 0 1px, transparent 1px 100%)",
              backgroundSize: "58px 58px",
              maskImage: "linear-gradient(180deg, black, transparent 85%)",
            },
          }}
        >
          {loading ? (
            <LinearProgress
              sx={{
                height: 3,
                bgcolor: "rgba(0, 229, 255, 0.08)",
                "& .MuiLinearProgress-bar": {
                  background:
                    "linear-gradient(90deg, #00e5ff, #9dff4f, #ff3df2)",
                  boxShadow: "0 0 22px rgba(0, 229, 255, 0.9)",
                },
              }}
            />
          ) : null}

          <Box
            sx={{
              position: "relative",
              px: { xs: 2, sm: 2.5 },
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "rgba(0, 229, 255, 0.16)",
              background:
                "linear-gradient(90deg, rgba(0, 229, 255, 0.11), rgba(255, 61, 242, 0.08), transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700 }}>
              {hasMessages ? `${messages.length} message${messages.length === 1 ? "" : "s"}` : "No messages yet"}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }} aria-hidden="true">
              {[0, 1, 2, 3, 4].map((bar) => (
                <Box
                  key={bar}
                  sx={{
                    width: 4,
                    height: 12 + bar * 2,
                    bgcolor: bar % 2 === 0 ? "primary.main" : "secondary.main",
                    opacity: loading ? 1 : 0.42,
                    boxShadow: loading ? "0 0 14px currentColor" : "none",
                    animation: loading ? "levelBounce 0.9s ease-in-out infinite" : "none",
                    animationDelay: `${bar * 0.08}s`,
                    "@keyframes levelBounce": {
                      "0%, 100%": { transform: "scaleY(0.45)" },
                      "50%": { transform: "scaleY(1.15)" },
                    },
                  }}
                />
              ))}
            </Box>
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
