"use client";

import React from "react";
import Link from "next/link";
import { Box, Container, Typography, Grid, Divider } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e2e8f0",
        mt: "auto",
        pt: 5,
        pb: 4,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "4px",
                  backgroundColor: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                }}
              >
                EJ
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem" }}>
                EpicJourneys
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 380, mb: 2, fontSize: "0.82rem" }}>
              Curated Indian adventures starting closest to your location. Verified destination partners, authentic itineraries, and 100% roundtrip guarantee.
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
              Domain: <strong style={{ color: "#0f172a" }}>epicjourneys.in</strong> • Transparent Pricing in INR (₹)
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1.5, fontSize: "0.82rem" }}>
              Navigation
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Link href="/" style={{ color: "#475569", fontSize: "0.8rem" }}>
                Explore Tours
              </Link>
              <Link href="/help" style={{ color: "#475569", fontSize: "0.8rem" }}>
                Help & Support
              </Link>
              <Link href="/partner/login" style={{ color: "#475569", fontSize: "0.8rem" }}>
                Partner Portal
              </Link>
              <Link href="/admin/login" style={{ color: "#475569", fontSize: "0.8rem" }}>
                Admin Panel
              </Link>
            </Box>
          </Grid>

          <Grid size={{ xs: 6, md: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1.5, fontSize: "0.82rem" }}>
              Key Indian Destinations
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", lineHeight: 1.8, fontSize: "0.8rem" }}>
              Himachal Pradesh (Manali, Shimla) • Rajasthan (Jaipur, Udaipur) • Uttarakhand (Rishikesh) • Kerala (Munnar) • Goa
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3.5, borderColor: "#f1f5f9" }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            © {new Date().getFullYear()} EpicJourneys (epicjourneys.in). All rights reserved.
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Pure Material UI • MongoDB Atlas
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
