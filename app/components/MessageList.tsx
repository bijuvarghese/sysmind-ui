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
          Start a conversation
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Ask about system health, agent state, or anything you want to check. Messages will appear here.
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
          <>
            <MarkdownMessage content={message.content} />
            <UsageSummary usage={message.usage} />
          </>
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {message.content}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

function UsageSummary({ usage }: { usage: Message["usage"] }) {
  if (!usage) {
    return null;
  }

  const stats = [
    ["Total tokens", usage.totalTokens],
    ["Input tokens", usage.promptTokens],
    ["Response tokens", usage.completionTokens],
    ["Reasoning tokens", usage.reasoningTokens],
  ].filter((stat): stat is [string, number] => typeof stat[1] === "number");

  if (stats.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.75,
        mt: 1.5,
        pt: 1.25,
        borderTop: "1px solid",
        borderColor: "rgba(148, 163, 184, 0.14)",
      }}
    >
      {stats.map(([label, value]) => (
        <Box
          key={label}
          sx={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 0.5,
            px: 1,
            py: 0.35,
            border: "1px solid",
            borderColor: "rgba(148, 163, 184, 0.16)",
            borderRadius: 1,
            bgcolor: "rgba(2, 6, 23, 0.24)",
          }}
        >
          <Typography component="span" variant="caption" sx={{ color: "text.secondary", lineHeight: 1 }}>
            {label}
          </Typography>
          <Typography component="span" variant="caption" sx={{ color: "text.primary", fontWeight: 700, lineHeight: 1 }}>
            {value.toLocaleString()}
          </Typography>
        </Box>
      ))}
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
