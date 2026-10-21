import { createTheme } from "@mui/material/styles";

// Tokens from the "Nothing but Adventures UI" Figma file.
export const brand = {
  purple: "#43149D",
  purpleDark: "#360F7D",
  orange: "#FF9900",
  orangeDark: "#E68A00",
  cream: "#FDF9EC",
  navy: "#0F172A",
  grey: "#F2F4F7",
  border: "#E2E2E2",
};

const fontStack = [
  "var(--font-manrope)",
  "Manrope",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  "Arial",
  "sans-serif",
].join(",");

export const publicTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brand.purple,
      light: "#6B3FC4",
      dark: brand.purpleDark,
      contrastText: "#ffffff",
    },
    secondary: {
      main: brand.orange,
      light: "#FFB340",
      dark: brand.orangeDark,
      contrastText: brand.navy,
    },
    success: { main: "#16A34A", light: "#F0FDF4", dark: "#166534", contrastText: "#ffffff" },
    warning: { main: brand.orange, light: "#FFF6E5", dark: "#B36B00", contrastText: brand.navy },
    error: { main: "#DC2626", light: "#FEF2F2", dark: "#B91C1C", contrastText: "#ffffff" },
    info: { main: "#0284c7", light: "#f0f9ff", dark: "#0369a1", contrastText: "#ffffff" },
    background: { default: brand.cream, paper: "#ffffff" },
    text: { primary: brand.navy, secondary: "#64748b", disabled: "#94a3b8" },
    divider: brand.border,
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: fontStack,
    h1: { fontWeight: 500, fontSize: "2.4rem", lineHeight: 1.15, letterSpacing: "-0.02em" },
    h2: { fontWeight: 500, fontSize: "1.75rem", lineHeight: 1.2, letterSpacing: "-0.02em" },
    h3: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.3, letterSpacing: "-0.01em" },
    h4: { fontWeight: 600, fontSize: "1.1rem", lineHeight: 1.35 },
    h5: { fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.4 },
    h6: { fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.45 },
    subtitle1: { fontSize: "0.875rem", lineHeight: 1.5, fontWeight: 600 },
    subtitle2: { fontSize: "0.75rem", lineHeight: 1.5, fontWeight: 600 },
    body1: { fontSize: "0.875rem", lineHeight: 1.55 },
    body2: { fontSize: "0.8125rem", lineHeight: 1.55 },
    button: { textTransform: "none", fontWeight: 600, fontSize: "0.875rem" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brand.cream,
          color: brand.navy,
          scrollbarColor: "#cbd5e1 transparent",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": { width: 6, height: 6 },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 6,
            backgroundColor: "#cbd5e1",
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        maxWidthLg: { "&.MuiContainer-maxWidthLg": { maxWidth: "1320px" } },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, size: "small" },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 4,
          padding: "7px 16px",
          fontSize: "0.875rem",
          transition: "all 0.15s ease-in-out",
        },
        contained: {
          backgroundColor: brand.purple,
          color: "#ffffff",
          "&:hover": { backgroundColor: brand.purpleDark },
        },
        outlined: {
          borderColor: brand.border,
          color: brand.navy,
          "&:hover": { backgroundColor: brand.grey, borderColor: "#cfcfcf" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          border: `1px solid ${brand.border}`,
          boxShadow: "none",
          backgroundImage: "none",
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 4,
          border: `1px solid ${brand.border}`,
          boxShadow: "none",
          backgroundImage: "none",
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: 0, border: "none", boxShadow: "none" } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRadius: 0, border: "none", boxShadow: "none" } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: brand.grey, padding: "10px 14px", fontSize: "0.8125rem" },
        head: {
          fontWeight: 600,
          backgroundColor: brand.cream,
          color: "#475569",
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          borderBottom: `1px solid ${brand.border}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4, fontWeight: 600, fontSize: "0.7rem", height: 22 },
      },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontSize: "0.875rem",
          backgroundColor: "#ffffff",
          "& fieldset": { borderColor: brand.border },
          "&:hover fieldset": { borderColor: "#cfcfcf" },
          "&.Mui-focused fieldset": { borderColor: brand.purple, borderWidth: 1.5 },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 4,
          border: `1px solid ${brand.border}`,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
        },
      },
    },
  },
});
