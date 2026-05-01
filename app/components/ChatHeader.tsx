import { Box, Paper, Typography } from "@mui/material";

export default function ChatHeader() {
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
      </Box>
    </Paper>
  );
}
