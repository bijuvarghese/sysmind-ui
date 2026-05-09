"use client";

import { Box, ButtonBase, SvgIcon, Typography } from "@mui/material";
import { toolLabel } from "../lib/tool-formatters";
import type { ToolDefinition } from "./types";

type ToolGalleryProps = {
  tools: ToolDefinition[];
  loading: boolean;
  selectedToolName: string | null;
  onSelectTool: (tool: ToolDefinition | null) => void;
  onRunTool: (tool: ToolDefinition) => void;
};

export default function ToolGallery({
  tools,
  loading,
  selectedToolName,
  onSelectTool,
  onRunTool,
}: ToolGalleryProps) {
  if (tools.length === 0) return null;

  return (
    <Box
      sx={{
        position: "relative",
        px: { xs: 2, sm: 2.5 },
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "rgba(89, 105, 128, 0.14)",
        bgcolor: "#ffffff",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 0.5,
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(89, 105, 128, 0.26)",
            borderRadius: 1,
          },
        }}
      >
        <ToolTile
          active={selectedToolName === null}
          title="SysMind"
          description="Route automatically"
          name="auto"
          disabled={loading}
          onClick={() => onSelectTool(null)}
        />
        {tools.map((tool) => (
          <ToolTile
            key={tool.name}
            active={tool.name === selectedToolName}
            title={toolLabel(tool.name)}
            description={tool.description?.trim() || "Available tool"}
            name={tool.name}
            disabled={loading}
            onClick={() => onRunTool(tool)}
          />
        ))}
      </Box>
    </Box>
  );
}

function ToolTile({
  active,
  title,
  description,
  name,
  disabled,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  name: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      sx={{
        width: { xs: 220, sm: 250 },
        minWidth: { xs: 220, sm: 250 },
        height: 96,
        alignItems: "stretch",
        justifyContent: "flex-start",
        borderRadius: 1,
        border: "1px solid",
        borderColor: active ? "rgba(166, 23, 142, 0.46)" : "rgba(89, 105, 128, 0.18)",
        bgcolor: active ? "rgba(166, 23, 142, 0.08)" : "#f8fafc",
        color: "text.primary",
        textAlign: "left",
        overflow: "hidden",
        transition: "border-color 180ms ease, background-color 180ms ease",
        "&:hover": {
          borderColor: "rgba(166, 23, 142, 0.46)",
          bgcolor: active ? "rgba(166, 23, 142, 0.11)" : "rgba(166, 23, 142, 0.05)",
        },
        "&.Mui-disabled": {
          color: "text.disabled",
          opacity: 0.58,
        },
      }}
    >
      <Box sx={{ display: "flex", width: "100%", gap: 1.25, p: 1.25 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            flex: "0 0 auto",
            display: "grid",
            placeItems: "center",
            border: "1px solid",
            borderColor: active ? "rgba(166, 23, 142, 0.38)" : "rgba(89, 105, 128, 0.2)",
            bgcolor: active ? "rgba(166, 23, 142, 0.1)" : "rgba(89, 105, 128, 0.06)",
            color: active ? "primary.main" : "text.secondary",
          }}
        >
          <ToolIcon name={name} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: "text.primary",
              fontWeight: 800,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              display: "-webkit-box",
              lineHeight: 1.35,
              mt: 0.5,
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {description}
          </Typography>
        </Box>
      </Box>
    </ButtonBase>
  );
}

function ToolIcon({ name }: { name: string }) {
  const path = (() => {
    if (name === "machine_status") return "M4 5h16v10H4V5Zm2 2v6h12V7H6Zm2 10h8v2H8v-2Zm3-2h2v2h-2v-2Z";
    if (name === "latest_news") return "M5 4h11l3 3v13H5V4Zm2 2v12h10V8h-3V6H7Zm2 4h6v2H9v-2Zm0 4h6v2H9v-2Z";
    if (name === "chroma_status") return "M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 2.2L16.8 7 12 8.8 7.2 7 12 5.2ZM6 8.7l5 1.9v7.8l-5-2.5V8.7Zm12 0v7.2l-5 2.5v-7.8l5-1.9Z";
    return "M12 2 4 6v6c0 4.4 3.1 8.5 8 10 4.9-1.5 8-5.6 8-10V6l-8-4Zm0 2.2 6 3V12c0 3.2-2.1 6.2-6 7.8-3.9-1.6-6-4.6-6-7.8V7.2l6-3Z";
  })();

  return (
    <SvgIcon fontSize="small" viewBox="0 0 24 24">
      <path d={path} />
    </SvgIcon>
  );
}
