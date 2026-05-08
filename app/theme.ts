import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00e5ff",
      dark: "#00a6d6",
      contrastText: "#001219",
    },
    secondary: {
      main: "#ff3df2",
      dark: "#c31fb8",
      contrastText: "#fff7ff",
    },
    success: {
      main: "#9dff4f",
    },
    warning: {
      main: "#ffd166",
    },
    background: {
      default: "#02030a",
      paper: "#07111f",
    },
    text: {
      primary: "#f9fbff",
      secondary: "#b9c8df",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: 0,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
});

export default theme;
