"use client";

import { useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { Box, LinearProgress, Paper, Typography } from "@mui/material";
import "katex/dist/katex.min.css";
import ChatHeader from "./ChatHeader";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";
import type { LLMModel, Message } from "./types";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<LLMModel[] | null>(null);
  const [modelsChecked, setModelsChecked] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
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
        if (list.length > 0) {
          setSelectedModel((current) => current || list[0].id);
        }
      })
      .catch(() => setModels(null))
      .finally(() => setModelsChecked(true));
  }, []);

  const sendMessage = async (event?: SyntheticEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();

    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tool-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, model: selectedModel }),
      });

      const data = await res.json();

      if (!res.ok) {
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

      const assistantContent =
        data && typeof data === "object" && "response" in data && typeof data.response === "string"
          ? data.response
          : "The MCP tool replied, but I could not find a text response in the payload.";

      setMessages((current) => [...current, { role: "assistant", content: assistantContent }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Sorry, I couldn't reach the MCP tool endpoint.",
        },
      ]);
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
              {hasMessages ? `${messages.length} message${messages.length === 1 ? "" : "s"}` : "No tool calls yet"}
            </Typography>
          </Box>

          <MessageList messages={messages} loading={loading} endRef={endRef} />
          <MessageComposer
            input={input}
            loading={loading}
            connected={connected}
            models={models}
            modelsChecked={modelsChecked}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onInputChange={setInput}
            onSubmit={sendMessage}
          />
        </Paper>
      </Box>
    </Box>
  );
}
