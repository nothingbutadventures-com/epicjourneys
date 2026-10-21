"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { adminTheme } from "./theme";
import { publicTheme } from "./publicTheme";

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  // /admin and /partner keep the legacy theme; everything else uses the Figma theme.
  const legacy = /^\/(admin|partner)(\/|$)/.test(pathname);
  return (
    <AppRouterCacheProvider options={{ key: "mui-epic" }}>
      <ThemeProvider theme={legacy ? adminTheme : publicTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
