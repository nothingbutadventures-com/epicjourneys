"use client";

import React from "react";
import Link from "next/link";
import { Box, Typography } from "@mui/material";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "#FDF9EC" }}>
      {/* Visual panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1,
          position: "relative",
          backgroundImage: "url('/images/hero-slide-1.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          alignItems: "flex-end",
          p: 6,
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,13,26,0.9) 0%, rgba(8,13,26,0.2) 70%)" }} />
        <Box sx={{ position: "relative", maxWidth: 460 }}>
          <Typography sx={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", mb: 1.5 }}>
            Journeys that begin <Box component="span" sx={{ color: "#FF9900" }}>near you.</Box>
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
            Curated Indian tours with verified local partners and transparent pricing in ₹.
          </Typography>
        </Box>
      </Box>

      {/* Form panel */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 2.5, sm: 4 } }}>
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <Box component="img" src="/logo.svg" alt="EpicJourneys" sx={{ height: 44, width: "auto", display: "block" }} />
          </Link>
          <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", mb: 0.75 }}>
            {title}
          </Typography>
          {subtitle && <Typography sx={{ color: "#64748b", mb: 3.5, fontSize: "0.95rem" }}>{subtitle}</Typography>}
          {children}
          {footer && <Box sx={{ mt: 3, textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>{footer}</Box>}
        </Box>
      </Box>
    </Box>
  );
}

export const fieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "4px", bgcolor: "#fff", fontSize: "0.95rem" },
};
export const submitSx = {
  py: 1.4,
  fontSize: "1rem",
  fontWeight: 700,
  borderRadius: "4px",
  bgcolor: "#FF9900",
  color: "#0f172a",
  "&:hover": { bgcolor: "#E68A00" },
} as const;
