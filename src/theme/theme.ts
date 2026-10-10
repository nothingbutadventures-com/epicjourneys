import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f172a", // Slate 900
      light: "#1e293b",
      dark: "#020617",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#facc15", // Yellow 400
      light: "#fde047",
      dark: "#eab308",
      contrastText: "#0f172a",
    },
    success: {
      main: "#10b981",
      light: "#ecfdf5",
      dark: "#047857",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#f59e0b",
      light: "#fffbeb",
      dark: "#b45309",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#fef2f2",
      dark: "#b91c1c",
      contrastText: "#ffffff",
    },
    info: {
      main: "#0284c7",
      light: "#f0f9ff",
      dark: "#0369a1",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc", // Slate 50
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a", // Slate 900
      secondary: "#64748b", // Slate 500
      disabled: "#94a3b8",
    },
    divider: "#e2e8f0",
  },
  shape: {
    borderRadius: 6, // rounded-md (6px)
  },
  typography: {
    fontFamily: [
      "var(--font-sans)",
      "Plus Jakarta Sans",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontWeight: 700,
      fontSize: "2rem",
      lineHeight: 1.25,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 700,
      fontSize: "1.5rem",
      lineHeight: 1.25,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.3,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.1rem",
      lineHeight: 1.35,
    },
    h5: {
      fontWeight: 600,
      fontSize: "0.95rem",
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: "0.85rem",
      lineHeight: 1.45,
    },
    subtitle1: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
      fontWeight: 600,
    },
    subtitle2: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
      fontWeight: 600,
    },
    body1: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      fontSize: "0.8125rem",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily:
            'var(--font-sans), Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          scrollbarColor: "#cbd5e1 transparent",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: 6,
            height: 6,
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 6,
            backgroundColor: "#cbd5e1",
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        size: "small",
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 6,
          padding: "6px 14px",
          fontSize: "0.8125rem",
          transition: "all 0.15s ease-in-out",
        },
        contained: {
          backgroundColor: "#0f172a",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#1e293b",
          },
        },
        outlined: {
          borderColor: "#e2e8f0",
          color: "#334155",
          "&:hover": {
            backgroundColor: "#f8fafc",
            borderColor: "#cbd5e1",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          boxShadow: "none",
          backgroundImage: "none",
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          boxShadow: "none",
          backgroundImage: "none",
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: "none",
          boxShadow: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: "none",
          boxShadow: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "#f1f5f9",
          padding: "10px 14px",
          fontSize: "0.8125rem",
        },
        head: {
          fontWeight: 600,
          backgroundColor: "#f8fafc",
          color: "#475569",
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          borderBottom: "1px solid #e2e8f0",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: "0.7rem",
          height: 22,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: "0.8125rem",
          "& fieldset": {
            borderColor: "#e2e8f0",
          },
          "&:hover fieldset": {
            borderColor: "#cbd5e1",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#0f172a",
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
        },
      },
    },
  },
});
