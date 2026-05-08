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
          position: "relative",
          width: "min(520px, 100%)",
          overflow: "hidden",
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          borderColor: "rgba(0, 229, 255, 0.3)",
          bgcolor: "rgba(7, 17, 31, 0.7)",
          boxShadow: "0 20px 70px rgba(0, 0, 0, 0.35), inset 0 0 35px rgba(0, 229, 255, 0.08)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, transparent 0%, rgba(157, 255, 79, 0.16) 48%, transparent 60%)",
            transform: "translateX(-100%)",
            animation: "emptySweep 3.8s ease-in-out infinite",
          },
          "@keyframes emptySweep": {
            "0%, 35%": { transform: "translateX(-100%)" },
            "75%, 100%": { transform: "translateX(100%)" },
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            mx: "auto",
            mb: 2,
            width: 84,
            height: 84,
            border: "1px solid rgba(0, 229, 255, 0.45)",
            display: "grid",
            placeItems: "center",
            background:
              "linear-gradient(135deg, rgba(0, 229, 255, 0.14), rgba(255, 61, 242, 0.14))",
            boxShadow: "0 0 34px rgba(0, 229, 255, 0.18)",
          }}
          aria-hidden="true"
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              border: "2px solid rgba(157, 255, 79, 0.7)",
              borderTopColor: "secondary.main",
              borderRadius: "50%",
              animation: "spinDial 2.6s linear infinite",
              "@keyframes spinDial": {
                to: { transform: "rotate(360deg)" },
              },
            }}
          />
        </Box>
        <Typography variant="h6" component="p" sx={{ position: "relative", mb: 0.5, fontWeight: 800 }}>
          SysMind is ready
        </Typography>
        <Typography variant="body2" sx={{ position: "relative", color: "text.secondary" }}>
          Awaiting signal
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
          position: "relative",
          overflow: "hidden",
          px: 2,
          py: 1.75,
          border: "1px solid",
          borderColor: message.role === "user" ? "rgba(255, 61, 242, 0.42)" : "rgba(0, 229, 255, 0.26)",
          bgcolor: message.role === "user" ? "rgba(255, 61, 242, 0.16)" : "rgba(7, 17, 31, 0.88)",
          background:
            message.role === "user"
              ? "linear-gradient(135deg, rgba(255, 61, 242, 0.24), rgba(255, 209, 102, 0.13))"
              : "linear-gradient(135deg, rgba(0, 229, 255, 0.13), rgba(7, 17, 31, 0.9) 58%, rgba(157, 255, 79, 0.08))",
          boxShadow:
            message.role === "user"
              ? "0 12px 34px rgba(255, 61, 242, 0.14)"
              : "0 12px 34px rgba(0, 229, 255, 0.1)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderTop: "1px solid rgba(255, 255, 255, 0.16)",
          },
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
          borderColor: "rgba(0, 229, 255, 0.28)",
          bgcolor: "rgba(7, 17, 31, 0.88)",
          boxShadow: "0 0 28px rgba(0, 229, 255, 0.12)",
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "primary.main",
            boxShadow: "0 0 14px rgba(0, 229, 255, 0.85)",
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
