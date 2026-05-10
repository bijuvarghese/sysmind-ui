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
  const greetingTiming = getGreetingTiming();

  return (
    <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
      <Paper
        variant="outlined"
        sx={{
          position: "relative",
          overflow: "hidden",
          width: "min(480px, 100%)",
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          borderColor: "rgba(89, 105, 128, 0.18)",
          bgcolor: "#ffffff",
        }}
      >
        <AnimatedGreetingCloud timing={greetingTiming} />
        <Typography variant="h6" component="p" sx={{ mb: 0.5, fontWeight: 700 }}>
          {greetingTiming.greeting}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Choose a tool or type a message.
        </Typography>
      </Paper>
    </Box>
  );
}

type GreetingTiming = {
  greeting: string;
  sky: string;
  sun: string;
  sunOpacity: number;
  cloud: string;
  shadow: string;
  highlight: string;
  driftSeconds: number;
  bobSeconds: number;
};

function AnimatedGreetingCloud({ timing }: { timing: GreetingTiming }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "relative",
        mx: "auto",
        mb: 2,
        width: 148,
        height: 72,
        borderRadius: 1,
        background: timing.sky,
        overflow: "hidden",
        "@keyframes cloudDrift": {
          "0%": { transform: "translateX(-8px)" },
          "100%": { transform: "translateX(8px)" },
        },
        "@keyframes cloudBob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: 18,
          top: 12,
          width: 22,
          height: 22,
          borderRadius: "50%",
          bgcolor: timing.sun,
          opacity: timing.sunOpacity,
          boxShadow: `0 0 18px ${timing.sun}`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: 16,
          bottom: 10,
          width: 112,
          height: 48,
          animation: `cloudDrift ${timing.driftSeconds}s ease-in-out infinite alternate`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            animation: `cloudBob ${timing.bobSeconds}s ease-in-out infinite`,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 15,
              bottom: 8,
              width: 82,
              height: 26,
              borderRadius: "999px",
              bgcolor: timing.cloud,
              boxShadow: `0 7px 0 ${timing.shadow}`,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: 31,
              bottom: 18,
              width: 35,
              height: 35,
              borderRadius: "50%",
              bgcolor: timing.cloud,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: 59,
              bottom: 15,
              width: 28,
              height: 28,
              borderRadius: "50%",
              bgcolor: timing.cloud,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: 26,
              bottom: 31,
              width: 34,
              height: 8,
              borderRadius: "999px",
              bgcolor: timing.highlight,
              opacity: 0.72,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

function getGreetingTiming(): GreetingTiming {
  const hour = new Date().getHours();

  if (hour < 12) {
    return {
      greeting: "Good morning",
      sky: "linear-gradient(180deg, #e7f7ff 0%, #fff8e6 100%)",
      sun: "#f4b740",
      sunOpacity: 0.92,
      cloud: "#ffffff",
      shadow: "rgba(136, 166, 196, 0.18)",
      highlight: "#f7fdff",
      driftSeconds: 7,
      bobSeconds: 4.2,
    };
  }

  if (hour < 17) {
    return {
      greeting: "Good afternoon",
      sky: "linear-gradient(180deg, #dff3ff 0%, #eef9ff 100%)",
      sun: "#eeb24b",
      sunOpacity: 0.82,
      cloud: "#ffffff",
      shadow: "rgba(89, 105, 128, 0.16)",
      highlight: "#fbfeff",
      driftSeconds: 5.8,
      bobSeconds: 3.6,
    };
  }

  return {
    greeting: "Good evening",
    sky: "linear-gradient(180deg, #26324f 0%, #65718d 100%)",
    sun: "#f1d98a",
    sunOpacity: 0.72,
    cloud: "#eef2f7",
    shadow: "rgba(23, 32, 47, 0.18)",
    highlight: "#ffffff",
    driftSeconds: 9,
    bobSeconds: 5.2,
  };
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
