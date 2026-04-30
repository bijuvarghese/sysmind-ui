"use client";

import type { FormEvent } from "react";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";

type MessageComposerProps = {
  input: string;
  loading: boolean;
  onInputChange: (input: string) => void;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
};

export default function MessageComposer({ input, loading, onInputChange, onSubmit }: MessageComposerProps) {
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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
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
  );
}
