"use client";

import React from "react";
import Link from "next/link";
import { Box, Container, Typography, Grid, Divider, IconButton } from "@mui/material";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Destinations", href: "/#destinations" },
      { label: "All Tours", href: "/#tour-results" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Help & Support", href: "/help" },
      { label: "Our Partners", href: "/our-partners" },
      { label: "Become a Partner", href: "/become-a-partner" },
      { label: "Careers", href: "/careers" },
      { label: "Partner Portal", href: "/partner/login" },
      { label: "Admin Panel", href: "/admin/login" },
    ],
  },
  {
    title: "Popular States",
    links: [
      { label: "Himachal Pradesh", href: "/" },
      { label: "Rajasthan", href: "/" },
      { label: "Uttarakhand", href: "/" },
      { label: "Kerala", href: "/" },
    ],
  },
];

const linkSx = {
  color: "#475569",
  fontSize: "0.9rem",
  textDecoration: "none",
  "&:hover": { color: "#B36B00" },
} as const;

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: "#FDF9EC", color: "#0f172a", mt: "auto", pt: 8, pb: 3 }}>
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
              <Box component="img" src="/logo.svg" alt="EpicJourneys" sx={{ height: 46, width: "auto", display: "block" }} />
            </Box>
            <Typography sx={{ color: "#475569", fontSize: "0.92rem", lineHeight: 1.7, maxWidth: 360, mb: 3 }}>
              Curated Indian journeys starting closest to you. Verified local partners, transparent pricing in ₹ and
              roundtrip itineraries.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#334155", fontSize: "0.9rem" }}>
                <EmailOutlinedIcon sx={{ fontSize: 18, color: "#E68A00" }} /> support@epicjourneys.in
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#334155", fontSize: "0.9rem" }}>
                <PhoneOutlinedIcon sx={{ fontSize: 18, color: "#E68A00" }} /> +91 00000 00000
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {[
                { label: "Facebook", icon: <FacebookRoundedIcon fontSize="small" /> },
                { label: "Instagram", icon: <InstagramIcon fontSize="small" /> },
                { label: "X", icon: <XIcon fontSize="small" /> },
                { label: "YouTube", icon: <YouTubeIcon fontSize="small" /> },
              ].map((s) => (
                <IconButton
                  key={s.label}
                  aria-label={s.label}
                  sx={{ color: "#334155", bgcolor: "#ffffff", border: "1px solid #E2E2E2", borderRadius: "4px", "&:hover": { bgcolor: "#FF9900", color: "#0f172a" } }}
                >
                  {s.icon}
                </IconButton>
              ))}
            </Box>
          </Grid>

          {COLUMNS.map((col) => (
            <Grid size={{ xs: 6, md: 8 / 3 }} key={col.title}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2, color: "#0f172a" }}>{col.title}</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} style={{ textDecoration: "none" }}>
                    <Typography component="span" sx={linkSx}>{l.label}</Typography>
                  </Link>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 5, borderColor: "#E2E2E2" }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Typography sx={{ color: "#64748b", fontSize: "0.85rem" }}>
            © {new Date().getFullYear()} EpicJourneys. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", gap: 3 }}>
            {["Privacy Policy", "Terms of Service", "Cancellation Policy"].map((t) => (
              <Typography key={t} sx={{ ...linkSx, fontSize: "0.85rem", cursor: "pointer" }}>{t}</Typography>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
