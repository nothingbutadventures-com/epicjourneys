"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Chip,
  Container,
  Avatar,
  IconButton,
} from "@mui/material";
import HandshakeIcon from "@mui/icons-material/Handshake";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LogoutIcon from "@mui/icons-material/Logout";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);

  useEffect(() => {
    if (pathname === "/partner/login") return;

    const storedUser = localStorage.getItem("epic_partner_user");
    if (storedUser) {
      try {
        setPartner(JSON.parse(storedUser));
      } catch {}
    }
  }, [pathname]);

  if (pathname === "/partner/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    localStorage.removeItem("epic_partner_token");
    localStorage.removeItem("epic_partner_user");
    router.push("/partner/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      {/* Partner Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          color: "#0f172a",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 64, justifyContent: "space-between", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HandshakeIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
                  EpicJourneys
                </Typography>
                <Typography variant="caption" sx={{ color: "#2563eb", fontWeight: 600, fontSize: "0.68rem" }}>
                  Destination Partner Portal
                </Typography>
              </Box>
            </Box>

            {/* Destination badge */}
            {partner?.assignedDestination && (
              <Chip
                icon={<LocationOnIcon sx={{ fontSize: "15px !important", color: "#1d4ed8 !important" }} />}
                label={`Assigned Location: ${
                  partner.assignedDestination.name || partner.assignedDestination
                }`}
                size="small"
                sx={{
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  display: { xs: "none", sm: "inline-flex" },
                }}
              />
            )}

            {/* User details and actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Button
                component={Link}
                href="/"
                target="_blank"
                startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                size="small"
                sx={{ color: "#64748b", display: { xs: "none", md: "inline-flex" } }}
              >
                View Live Site
              </Button>

              <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  {partner?.name || "Partner"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  {partner?.email || ""}
                </Typography>
              </Box>

              <Button
                onClick={handleLogout}
                variant="outlined"
                size="small"
                startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderColor: "#e2e8f0",
                  color: "#ef4444",
                  "&:hover": { borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
                }}
              >
                Logout
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </Box>
  );
}
