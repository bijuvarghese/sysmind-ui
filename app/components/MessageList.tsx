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
    <Box
      sx={{
        position: "relative",
        flex: 1,
        overflowY: "auto",
        px: { xs: 2, sm: 3 },
        py: 2.5,
      }}
    >
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
          width: "min(480px, 100%)",
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          borderColor: "rgba(89, 105, 128, 0.18)",
          bgcolor: "#ffffff",
        }}
      >
        <Typography variant="h6" component="p" sx={{ mb: 0.5, fontWeight: 700 }}>
          SysMind is ready
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Choose a tool or type a message.
        </Typography>
      </Paper>
    </Box>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: { xs: "92%", sm: "78%" },
          px: 2,
          py: 1.75,
          border: "1px solid",
          borderColor: isUser ? "rgba(166, 23, 142, 0.32)" : "rgba(89, 105, 128, 0.16)",
          bgcolor: isUser ? "rgba(166, 23, 142, 0.08)" : "#ffffff",
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
          borderColor: "rgba(89, 105, 128, 0.16)",
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "primary.main",
          }}
        />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Thinking...
        </Typography>
      </Paper>
    </Box>
  );
}
