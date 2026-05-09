import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#a6178e",
      dark: "#7d116c",
      light: "#c640ad",
      contrastText: "#fff7fd",
    },
    secondary: {
      main: "#178ea6",
      dark: "#0f6f83",
      contrastText: "#f5fdff",
    },
    success: {
      main: "#2fa36b",
    },
    warning: {
      main: "#d99132",
    },
    background: {
      default: "#100b12",
      paper: "#17111a",
    },
    text: {
      primary: "#f8eff6",
      secondary: "#cab8c7",
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
