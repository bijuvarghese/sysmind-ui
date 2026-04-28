"use client";

import { Fragment, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
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
} from "@mui/material";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ListItem = {
  content: string;
  ordered: boolean;
};

const tableDividerPattern = /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/;
const orderedListPattern = /^\s*\d+\.\s+/;
const unorderedListPattern = /^\s*[-*+]\s+/;
const headingPattern = /^(#{1,6})\s+(.*)$/;

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Box
          key={index}
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
        >
          {part.slice(1, -1)}
        </Box>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Box key={index} component="strong" sx={{ fontWeight: 700, color: "text.primary" }}>
          {part.slice(2, -2)}
        </Box>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <Box key={index} component="em" sx={{ fontStyle: "italic" }}>
          {part.slice(1, -1)}
        </Box>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <MuiLink
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          sx={{
            color: "secondary.light",
            textDecorationColor: "rgba(34, 197, 94, 0.55)",
          }}
        >
          {linkMatch[1]}
        </MuiLink>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

function renderParagraph(text: string, key: string) {
  return (
    <Typography key={key} variant="body2" sx={{ lineHeight: 1.8, color: "text.primary" }}>
      {renderInline(text)}
    </Typography>
  );
}

function renderMarkdown(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(
        <Paper
          key={`code-${blocks.length}`}
          variant="outlined"
          sx={{
            overflow: "hidden",
            borderColor: "rgba(148, 163, 184, 0.2)",
            bgcolor: "rgba(2, 6, 23, 0.85)",
          }}
        >
          {language ? (
            <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" sx={{ letterSpacing: 1.2, color: "text.secondary" }}>
                {language}
              </Typography>
            </Box>
          ) : null}
          <Box component="pre" sx={{ m: 0, px: 2, py: 1.75, overflowX: "auto" }}>
            <Box
              component="code"
              sx={{ display: "block", fontSize: "0.8rem", lineHeight: 1.7, color: "text.primary" }}
            >
              {codeLines.join("\n")}
            </Box>
          </Box>
        </Paper>,
      );
      continue;
    }

    const headingMatch = line.match(headingPattern);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();
      const variant = level === 1 ? "h6" : level === 2 ? "subtitle1" : "body1";

      blocks.push(
        <Typography
          key={`heading-${blocks.length}`}
          variant={variant}
          sx={{ fontWeight: 700, color: "text.primary" }}
        >
          {renderInline(heading)}
        </Typography>,
      );
      index += 1;
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed.replace(/\s+/g, ""))) {
      blocks.push(<Divider key={`hr-${blocks.length}`} sx={{ borderColor: "divider" }} />);
      index += 1;
      continue;
    }

    if (index + 1 < lines.length && line.includes("|") && tableDividerPattern.test(lines[index + 1])) {
      const header = parseTableRow(line);
      index += 2;
      const rows: string[][] = [];

      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }

      blocks.push(
        <Paper
          key={`table-${blocks.length}`}
          variant="outlined"
          sx={{ overflowX: "auto", borderColor: "rgba(148, 163, 184, 0.2)" }}
        >
          <Box component="table" sx={{ minWidth: "100%", borderCollapse: "collapse" }}>
            <Box component="thead" sx={{ bgcolor: "rgba(15, 23, 42, 0.8)" }}>
              <Box component="tr">
                {header.map((cell, cellIndex) => (
                  <Box
                    key={cellIndex}
                    component="th"
                    sx={{
                      px: 1.5,
                      py: 1,
                      textAlign: "left",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    {renderInline(cell)}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {rows.map((row, rowIndex) => (
                <Box key={rowIndex} component="tr">
                  {row.map((cell, cellIndex) => (
                    <Box
                      key={cellIndex}
                      component="td"
                      sx={{
                        px: 1.5,
                        py: 1,
                        verticalAlign: "top",
                        borderTop: "1px solid",
                        borderColor: "divider",
                        color: "text.secondary",
                      }}
                    >
                      {renderInline(cell)}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>,
      );
      continue;
    }

    if (orderedListPattern.test(line) || unorderedListPattern.test(line)) {
      const items: ListItem[] = [];

      while (index < lines.length) {
        const currentLine = lines[index];
        if (orderedListPattern.test(currentLine)) {
          items.push({
            ordered: true,
            content: currentLine.replace(orderedListPattern, "").trim(),
          });
          index += 1;
          continue;
        }

        if (unorderedListPattern.test(currentLine)) {
          items.push({
            ordered: false,
            content: currentLine.replace(unorderedListPattern, "").trim(),
          });
          index += 1;
          continue;
        }

        break;
      }

      const ordered = items[0]?.ordered ?? false;
      const ListTag = ordered ? "ol" : "ul";

      blocks.push(
        <Box
          key={`list-${blocks.length}`}
          component={ListTag}
          sx={{
            ml: 3,
            my: 0,
            display: "grid",
            gap: 1,
            color: "text.primary",
          }}
        >
          {items.map((item, itemIndex) => (
            <Box key={itemIndex} component="li" sx={{ lineHeight: 1.7 }}>
              {renderInline(item.content)}
            </Box>
          ))}
        </Box>,
      );
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index];
      const nextTrimmed = nextLine.trim();

      if (
        !nextTrimmed ||
        nextTrimmed.startsWith("```") ||
        headingPattern.test(nextLine) ||
        /^[-*_]{3,}$/.test(nextTrimmed.replace(/\s+/g, "")) ||
        orderedListPattern.test(nextLine) ||
        unorderedListPattern.test(nextLine) ||
        (index + 1 < lines.length && nextLine.includes("|") && tableDividerPattern.test(lines[index + 1]))
      ) {
        break;
      }

      paragraphLines.push(nextTrimmed);
      index += 1;
    }

    blocks.push(renderParagraph(paragraphLines.join(" "), `paragraph-${blocks.length}`));
  }

  return <Stack spacing={2}>{blocks}</Stack>;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
        body: JSON.stringify({ prompt }),
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
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label="Connected" color="secondary" variant="outlined" />
              <Chip label="MUI" variant="filled" color="primary" />
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
                    }}
                  >
                    {msg.role === "assistant" ? (
                      renderMarkdown(msg.content)
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
              Responses are rendered with light Markdown support, including headings, lists, tables, links,
              and code blocks.
            </Alert>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
