"use client";

import type { SyntheticEvent } from "react";
import { Box, Chip, IconButton, SvgIcon, TextField } from "@mui/material";

type MessageComposerProps = {
  input: string;
  loading: boolean;
  connected: boolean;
  selectedToolName: string | null;
  onInputChange: (input: string) => void;
  onSubmit: (event?: SyntheticEvent<HTMLFormElement>) => void;
};

export default function MessageComposer({
  input,
  loading,
  connected,
  selectedToolName,
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
        borderColor: "rgba(154, 168, 186, 0.14)",
        bgcolor: "rgba(15, 20, 28, 0.72)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {selectedToolName ? (
          <Chip
            size="small"
            label={selectedToolName}
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              maxWidth: 160,
              borderRadius: 1,
              border: "1px solid rgba(166, 23, 142, 0.28)",
              bgcolor: "rgba(166, 23, 142, 0.08)",
              color: "primary.main",
              fontWeight: 700,
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
          />
        ) : null}
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
          placeholder={selectedToolName ? `Ask ${selectedToolName}` : "Ask SysMind about machine status, news, or Chroma status"}
          aria-label="Message"
          disabled={loading}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
              bgcolor: "rgba(21, 27, 36, 0.95)",
              color: "text.primary",
              "& fieldset": {
                borderColor: "rgba(154, 168, 186, 0.2)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(166, 23, 142, 0.42)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "primary.main",
              },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "rgba(154, 168, 186, 0.78)",
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
            bgcolor: "primary.main",
            color: "primary.contrastText",
            outline: connected ? "1px solid rgba(139, 213, 202, 0.36)" : "none",
            outlineOffset: 2,
            "&:hover": {
              bgcolor: "primary.dark",
            },
            "&.Mui-disabled": {
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
              outlineColor: "transparent",
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
