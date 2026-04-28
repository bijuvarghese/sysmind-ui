import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#7c3aed",
    },
    secondary: {
      main: "#22c55e",
    },
    background: {
      default: "#050816",
      paper: "#0b1220",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#cbd5e1",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
});

export default theme;
