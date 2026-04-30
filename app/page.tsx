"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type LLMModel = { id: string };

type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

export default function Home() {
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

  const sendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();

    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
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
          : "The agent replied, but I could not find a text response in the payload.";

      setMessages((current) => [
        ...current,
        { role: "assistant", content: assistantContent },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Sorry, I couldn't reach the agent endpoint.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ mx: "auto", display: "flex", minHeight: "calc(100vh - 32px)", maxWidth: 1220, flexDirection: "column", gap: 2.5 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            border: "1px solid",
            borderColor: "rgba(148, 163, 184, 0.18)",
            background:
              "linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.7) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h4" component="h1">
                SysMind MCP
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
                Material UI chat interface for the SysMind agent.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              {modelsChecked && models && models.length > 0 ? (
                <>
                  <Chip label="Connected" color="secondary" variant="outlined" size="small" sx={{ mr: 1 }} />
                  <Select
                    size="small"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as string)}
                    sx={{
                      minWidth: 200,
                      height: 32,
                      fontSize: "0.875rem",
                      bgcolor: "rgba(15, 23, 42, 0.4)",
                      "& .MuiSelect-select": { py: 0.5 }
                    }}
                  >
                    {models.map((m) => (
                      <MenuItem key={m.id} value={m.id} sx={{ fontSize: "0.875rem" }}>
                        {m.id}
                      </MenuItem>
                    ))}
                  </Select>
                </>
              ) : modelsChecked ? (
                <Chip label="Disconnected" variant="outlined" size="small"
                  sx={{ borderColor: "rgba(148,163,184,0.3)", color: "text.disabled" }} />
              ) : null}
            </Box>
          </Box>
        </Paper>

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

          <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 3 }, py: 2.5 }}>
            <Stack spacing={2.25} sx={{ minHeight: "100%" }}>
              {!hasMessages ? (
                <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      maxWidth: 520,
                      p: 3,
                      textAlign: "center",
                      borderStyle: "dashed",
                      borderColor: "rgba(148, 163, 184, 0.25)",
                      bgcolor: "rgba(15, 23, 42, 0.45)",
                    }}
                  >
                    <Typography variant="h6" component="p" sx={{ mb: 1 }}>
                      Start a conversation
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Ask about system health, agent state, or anything you want to check. Messages will
                      appear here.
                    </Typography>
                  </Paper>
                </Box>
              ) : null}

              {messages.map((msg, i) => (
                <Box
                  key={`${msg.role}-${i}`}
                  sx={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      maxWidth: { xs: "92%", sm: "78%" },
                      px: 2,
                      py: 1.75,
                      border: "1px solid",
                      borderColor:
                        msg.role === "user" ? "rgba(124, 58, 237, 0.35)" : "rgba(148, 163, 184, 0.18)",
                      bgcolor:
                        msg.role === "user" ? "rgba(124, 58, 237, 0.22)" : "rgba(15, 23, 42, 0.85)",
                      "& .markdown-body": {
                        color: "text.primary",
                        fontSize: "0.875rem",
                        lineHeight: 1.8,
                        "& > *:first-of-type": { mt: 0 },
                        "& > *:last-of-type": { mb: 0 },
                      }
                    }}
                  >
                    {msg.role === "assistant" ? (
                      <Box className="markdown-body">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ children }) => (
                              <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.8, color: "text.primary" }}>
                                {children}
                              </Typography>
                            ),
                            h1: ({ children }) => <Typography variant="h5" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>{children}</Typography>,
                            h2: ({ children }) => <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>{children}</Typography>,
                            h3: ({ children }) => <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>{children}</Typography>,
                            code({ inline, className, children, ...props }: MarkdownCodeProps) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline ? (
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    overflow: "hidden",
                                    borderColor: "rgba(148, 163, 184, 0.2)",
                                    bgcolor: "rgba(2, 6, 23, 0.85)",
                                    mb: 2
                                  }}
                                >
                                  {match ? (
                                    <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                                      <Typography variant="caption" sx={{ letterSpacing: 1.2, color: "text.secondary" }}>
                                        {match[1]}
                                      </Typography>
                                    </Box>
                                  ) : null}
                                  <Box component="pre" sx={{ m: 0, px: 2, py: 1.75, overflowX: "auto" }}>
                                    <Box component="code" sx={{ display: "block", fontSize: "0.8rem", lineHeight: 1.7, color: "text.primary" }} {...props}>
                                      {children}
                                    </Box>
                                  </Box>
                                </Paper>
                              ) : (
                                <Box
                                  component="code"
                                  sx={{
                                    px: 0.75,
                                    py: 0.25,
                                    borderRadius: 1,
                                    bgcolor: "rgba(124, 58, 237, 0.16)",
                                    color: "primary.light",
                                    fontFamily: "monospace",
                                    fontSize: "0.92em",
                                  }}
                                  {...props}
                                >
                                  {children}
                                </Box>
                              );
                            },
                            a: ({ children, href }) => (
                              <MuiLink href={href} target="_blank" rel="noreferrer" sx={{ color: "secondary.light", textDecorationColor: "rgba(34, 197, 94, 0.55)" }}>
                                {children}
                              </MuiLink>
                            ),
                            ul: ({ children }) => <Box component="ul" sx={{ ml: 3, my: 2, display: "grid", gap: 1, color: "text.primary" }}>{children}</Box>,
                            ol: ({ children }) => <Box component="ol" sx={{ ml: 3, my: 2, display: "grid", gap: 1, color: "text.primary" }}>{children}</Box>,
                            li: ({ children }) => <Box component="li" sx={{ lineHeight: 1.7 }}>{children}</Box>,
                            table: ({ children }) => (
                              <Paper variant="outlined" sx={{ overflowX: "auto", borderColor: "rgba(148, 163, 184, 0.2)", mb: 2 }}>
                                <Box component="table" sx={{ minWidth: "100%", borderCollapse: "collapse" }}>{children}</Box>
                              </Paper>
                            ),
                            thead: ({ children }) => <Box component="thead" sx={{ bgcolor: "rgba(15, 23, 42, 0.8)" }}>{children}</Box>,
                            tbody: ({ children }) => <Box component="tbody">{children}</Box>,
                            tr: ({ children }) => <Box component="tr">{children}</Box>,
                            th: ({ children }) => (
                              <Box component="th" sx={{ px: 1.5, py: 1, textAlign: "left", borderBottom: "1px solid", borderColor: "divider", fontWeight: 600, color: "text.primary" }}>
                                {children}
                              </Box>
                            ),
                            td: ({ children }) => (
                              <Box component="td" sx={{ px: 1.5, py: 1, verticalAlign: "top", borderTop: "1px solid", borderColor: "divider", color: "text.secondary" }}>
                                {children}
                              </Box>
                            ),
                            hr: () => <Divider sx={{ my: 2, borderColor: "divider" }} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                        {msg.content}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              ))}

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                  <Paper
                    elevation={0}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 1.5,
                      border: "1px solid",
                      borderColor: "rgba(148, 163, 184, 0.18)",
                      bgcolor: "rgba(15, 23, 42, 0.85)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "text.secondary",
                        animation: "pulse 1s ease-in-out infinite",
                        "@keyframes pulse": {
                          "0%, 100%": { opacity: 0.35, transform: "scale(0.9)" },
                          "50%": { opacity: 1, transform: "scale(1.15)" },
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Thinking...
                    </Typography>
                  </Paper>
                </Box>
              ) : null}
              <Box ref={endRef} />
            </Stack>
          </Box>

          <Box
            component="form"
            onSubmit={sendMessage}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "rgba(2, 6, 23, 0.48)",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={5}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && input.trim()) {
                      sendMessage();
                    }
                  }
                }}
                placeholder="Ask about system health..."
                aria-label="Message input"
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !input.trim()}
                sx={{ minWidth: { xs: "100%", sm: 132 }, py: 1.5 }}
              >
                Send
              </Button>
            </Stack>
            <Alert severity="info" sx={{ mt: 1.5, bgcolor: "rgba(2, 132, 199, 0.12)" }}>
              Responses are rendered with full Markdown and LaTeX math support!
            </Alert>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
