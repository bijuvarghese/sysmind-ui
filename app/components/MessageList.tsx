import type { RefObject } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import MarkdownMessage from "./MarkdownMessage";
import type { Message } from "./types";

type MessageListProps = {
  messages: Message[];
  loading: boolean;
  endRef: RefObject<HTMLDivElement | null>;
};

export default function MessageList({ messages, loading, endRef }: MessageListProps) {
  const hasMessages = messages.length > 0;

  return (
    <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 3 }, py: 2.5 }}>
      <Stack spacing={2.25} sx={{ minHeight: "100%" }}>
        {!hasMessages ? <EmptyState /> : null}

        {messages.map((message, index) => (
          <MessageBubble key={`${message.role}-${index}`} message={message} />
        ))}

        {loading ? <ThinkingIndicator /> : null}
        <Box ref={endRef} />
      </Stack>
    </Box>
  );
}

function EmptyState() {
  return (
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
          Call an MCP tool
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Select a tool, enter JSON arguments, and the result will appear here.
        </Typography>
      </Paper>
    </Box>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: message.role === "user" ? "flex-end" : "flex-start",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: { xs: "92%", sm: "78%" },
          px: 2,
          py: 1.75,
          border: "1px solid",
          borderColor: message.role === "user" ? "rgba(124, 58, 237, 0.35)" : "rgba(148, 163, 184, 0.18)",
          bgcolor: message.role === "user" ? "rgba(124, 58, 237, 0.22)" : "rgba(15, 23, 42, 0.85)",
          "& .markdown-body": {
            color: "text.primary",
            fontSize: "0.875rem",
            lineHeight: 1.8,
            "& > *:first-of-type": { mt: 0 },
            "& > *:last-of-type": { mb: 0 },
          },
        }}
      >
        {message.role === "assistant" ? (
          <MarkdownMessage content={message.content} />
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {message.content}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

function ThinkingIndicator() {
  return (
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
  );
}
