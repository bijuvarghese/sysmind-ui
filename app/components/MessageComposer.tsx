"use client";

import type { SyntheticEvent } from "react";
import { Box, IconButton, SvgIcon, TextField } from "@mui/material";

type MessageComposerProps = {
  input: string;
  loading: boolean;
  connected: boolean;
  onInputChange: (input: string) => void;
  onSubmit: (event?: SyntheticEvent<HTMLFormElement>) => void;
};

export default function MessageComposer({
  input,
  loading,
  connected,
  onInputChange,
  onSubmit,
}: MessageComposerProps) {
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        position: "relative",
        p: { xs: 2, sm: 2.5 },
        borderTop: "1px solid",
        borderColor: "rgba(0, 229, 255, 0.18)",
        bgcolor: "rgba(2, 3, 10, 0.7)",
        background:
          "linear-gradient(90deg, rgba(0, 229, 255, 0.08), rgba(255, 61, 242, 0.08), rgba(157, 255, 79, 0.06))",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <TextField
          id="message-input"
          name="message"
          fullWidth
          multiline
          minRows={1}
          maxRows={5}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!loading && input.trim()) {
                onSubmit();
              }
            }
          }}
          placeholder="Ask SysMind about machine status, news, or Chroma status"
          aria-label="Message"
          disabled={loading}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
              bgcolor: "rgba(2, 3, 10, 0.72)",
              color: "text.primary",
              boxShadow: "inset 0 0 24px rgba(0, 229, 255, 0.05)",
              "& fieldset": {
                borderColor: "rgba(0, 229, 255, 0.28)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(157, 255, 79, 0.48)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "primary.main",
                boxShadow: "0 0 22px rgba(0, 229, 255, 0.25)",
              },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "rgba(185, 200, 223, 0.72)",
              opacity: 1,
            },
          }}
        />
        <IconButton
          type="submit"
          color="primary"
          aria-label={connected ? "Send message, connected" : "Send message"}
          disabled={loading || !input.trim()}
          sx={{
            width: 48,
            height: 48,
            flex: "0 0 auto",
            position: "relative",
            overflow: "hidden",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            outline: connected ? "2px solid" : "1px solid",
            outlineColor: connected ? "success.main" : "transparent",
            outlineOffset: 3,
            boxShadow: connected
              ? "0 0 0 5px rgba(157, 255, 79, 0.12), 0 0 28px rgba(0, 229, 255, 0.45)"
              : "0 0 20px rgba(0, 229, 255, 0.28)",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, transparent, rgba(255,255,255,0.45), transparent)",
              transform: "translateX(-120%)",
              transition: "transform 240ms ease",
            },
            "&:hover": {
              bgcolor: "primary.dark",
              transform: "translateY(-1px)",
              "&::before": { transform: "translateX(120%)" },
            },
            "&.Mui-disabled": {
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
              outlineColor: connected ? "success.main" : "transparent",
            },
          }}
        >
          <SvgIcon fontSize="small" viewBox="0 0 24 24">
            <path d="M3.4 20.4 21.2 12 3.4 3.6 3 10.1l10.7 1.9L3 13.9l.4 6.5Z" />
          </SvgIcon>
        </IconButton>
      </Box>
    </Box>
  );
}
