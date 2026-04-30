import { Box, Chip, MenuItem, Paper, Select, Typography } from "@mui/material";
import type { LLMModel } from "./types";

type ChatHeaderProps = {
  models: LLMModel[] | null;
  modelsChecked: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
};

export default function ChatHeader({
  models,
  modelsChecked,
  selectedModel,
  onModelChange,
}: ChatHeaderProps) {
  return (
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
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          {modelsChecked && models && models.length > 0 ? (
            <>
              <Chip label="Connected" color="secondary" variant="outlined" size="small" sx={{ mr: 1 }} />
              <Select
                size="small"
                value={selectedModel}
                onChange={(event) => onModelChange(event.target.value)}
                sx={{
                  minWidth: 200,
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
            </>
          ) : modelsChecked ? (
            <Chip
              label="Disconnected"
              variant="outlined"
              size="small"
              sx={{ borderColor: "rgba(148,163,184,0.3)", color: "text.disabled" }}
            />
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}
