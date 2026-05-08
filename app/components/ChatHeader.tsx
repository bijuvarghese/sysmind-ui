import { Box, Paper, SvgIcon, Typography } from "@mui/material";

export default function ChatHeader() {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 2, sm: 2.5 },
        border: "1px solid",
        borderColor: "rgba(0, 229, 255, 0.28)",
        background:
          "linear-gradient(135deg, rgba(0, 229, 255, 0.16) 0%, rgba(7, 17, 31, 0.96) 35%, rgba(255, 61, 242, 0.16) 100%)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 22px 70px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 229, 255, 0.12)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.16), transparent)",
          transform: "translateX(-100%)",
          animation: "headerSweep 5s ease-in-out infinite",
        },
        "@keyframes headerSweep": {
          "0%, 45%": { transform: "translateX(-100%)" },
          "70%, 100%": { transform: "translateX(100%)" },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
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
              width: 48,
              height: 48,
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(157, 255, 79, 0.55)",
              background:
                "linear-gradient(135deg, rgba(157, 255, 79, 0.22), rgba(0, 229, 255, 0.15))",
              boxShadow: "0 0 28px rgba(157, 255, 79, 0.26)",
            }}
          >
            <SvgIcon sx={{ color: "success.main" }} viewBox="0 0 24 24">
              <path d="M4 13.5 9 4l4.2 8.1L16 7l4 10H4v-3.5Zm3.4.5h3.2l-1.7-3.4L7.4 14Zm5.9 0h3.8l-1.3-3.2-1.4 2.7h-1.1Z" />
            </SvgIcon>
          </Box>
          <Box>
            <Typography variant="h4" component="h1">
              SysMind Agent
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Live system console
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
            border: "1px solid rgba(157, 255, 79, 0.42)",
            bgcolor: "rgba(157, 255, 79, 0.09)",
            color: "success.main",
            fontSize: "0.8rem",
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "success.main",
              boxShadow: "0 0 14px rgba(157, 255, 79, 0.9)",
              animation: "statusPulse 1.8s ease-in-out infinite",
              "@keyframes statusPulse": {
                "0%, 100%": { opacity: 0.55, transform: "scale(0.9)" },
                "50%": { opacity: 1, transform: "scale(1.18)" },
              },
            }}
          />
          Online
        </Box>
      </Box>
    </Paper>
  );
}
