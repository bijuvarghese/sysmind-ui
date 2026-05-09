import { Box, Paper, SvgIcon, Typography } from "@mui/material";

export default function ChatHeader() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: "1px solid",
        borderColor: "rgba(154, 168, 186, 0.18)",
        bgcolor: "background.paper",
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(166, 23, 142, 0.32)",
              bgcolor: "rgba(166, 23, 142, 0.08)",
              color: "primary.main",
            }}
          >
            <SvgIcon viewBox="0 0 24 24">
              <path d="M4 13.5 9 4l4.2 8.1L16 7l4 10H4v-3.5Zm3.4.5h3.2l-1.7-3.4L7.4 14Zm5.9 0h3.8l-1.3-3.2-1.4 2.7h-1.1Z" />
            </SvgIcon>
          </Box>
          <Box>
            <Typography variant="h5" component="h1">
              SysMind Agent
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              System tools and chat
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.75,
            border: "1px solid rgba(139, 213, 202, 0.28)",
            bgcolor: "rgba(139, 213, 202, 0.07)",
            color: "success.main",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "success.main",
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
