"use client";

import type { SyntheticEvent } from "react";
import { Box, IconButton, MenuItem, Select, SvgIcon, TextField } from "@mui/material";
import type { LLMModel } from "./types";

type MessageComposerProps = {
  input: string;
  loading: boolean;
  connected: boolean;
  models: LLMModel[] | null;
  modelsChecked: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onInputChange: (input: string) => void;
  onSubmit: (event?: SyntheticEvent<HTMLFormElement>) => void;
};

export default function MessageComposer({
  input,
  loading,
  connected,
  models,
  modelsChecked,
  selectedModel,
  onModelChange,
  onInputChange,
  onSubmit,
}: MessageComposerProps) {
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "rgba(2, 6, 23, 0.48)",
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
          placeholder="Ask about system health..."
          aria-label="Message input"
          disabled={loading}
        />
        <IconButton
          type="submit"
          color="primary"
          aria-label={connected ? "Send message, connected" : "Send message"}
          disabled={loading || !input.trim()}
          sx={{
            width: 44,
            height: 44,
            flex: "0 0 auto",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            outline: connected ? "2px solid" : "1px solid",
            outlineColor: connected ? "success.main" : "transparent",
            outlineOffset: 3,
            boxShadow: connected ? "0 0 0 5px rgba(34, 197, 94, 0.1)" : "none",
            "&:hover": { bgcolor: "primary.dark" },
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
      {modelsChecked && models && models.length > 0 ? (
        <Select
          id="model-select"
          name="model"
          size="small"
          value={selectedModel}
          onChange={(event) => onModelChange(event.target.value)}
          sx={{
            mt: 1,
            width: { xs: "100%", sm: 280 },
            height: 32,
            fontSize: "0.875rem",
            bgcolor: "rgba(15, 23, 42, 0.4)",
            "& .MuiSelect-select": { py: 0.5 },
          }}
        >
          {models.map((model) => (
            <MenuItem key={model.id} value={model.id} sx={{ fontSize: "0.875rem" }}>
              {model.id}
            </MenuItem>
          ))}
        </Select>
      ) : null}
    </Box>
  );
}
