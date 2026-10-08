"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

interface NavbarProps {
  userLocationName?: string;
  onLocationClick?: () => void;
}

export default function Navbar({
  userLocationName,
  onLocationClick,
}: NavbarProps) {
  const [mobileAnchor, setMobileAnchor] = useState<null | HTMLElement>(null);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        borderRadius: 0,
        zIndex: 1000,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: "56px !important", height: 56, gap: 1.5 }}>
          {/* Brand Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "4px",
                backgroundColor: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.8rem",
              }}
            >
              EJ
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.15,
                  fontSize: "0.95rem",
                  letterSpacing: "-0.01em",
                }}
              >
                EpicJourneys
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  display: "block",
                  lineHeight: 1,
                }}
              >
                epicjourneys.in
              </Typography>
            </Box>
          </Link>

          {/* Location indicator button */}
          {userLocationName && (
            <Chip
              icon={<LocationOnIcon sx={{ fontSize: "14px !important", color: "#2563eb !important" }} />}
              label={`Near ${userLocationName}`}
              onClick={onLocationClick}
              size="small"
              sx={{
                ml: { xs: 1, sm: 2 },
                borderColor: "#e2e8f0",
                backgroundColor: "#f8fafc",
                fontWeight: 600,
                color: "#1e293b",
                fontSize: "0.75rem",
                borderRadius: "4px",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "#f1f5f9",
                  borderColor: "#cbd5e1",
                },
              }}
            />
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
            <Button
              component={Link}
              href="/"
              variant="text"
              size="small"
              sx={{ color: "#334155", fontWeight: 600, borderRadius: "4px", fontSize: "0.8rem", px: 1.5 }}
            >
              Explore Tours
            </Button>

            <Button
              component={Link}
              href="/help"
              startIcon={<HelpOutlineRoundedIcon sx={{ fontSize: 16 }} />}
              variant="text"
              size="small"
              sx={{ color: "#64748b", fontWeight: 600, borderRadius: "4px", fontSize: "0.8rem", px: 1.5 }}
            >
              Help & Support
            </Button>

            <Button
              component={Link}
              href="/partner/login"
              startIcon={<HandshakeRoundedIcon sx={{ fontSize: 16 }} />}
              variant="outlined"
              size="small"
              sx={{
                borderColor: "#e2e8f0",
                color: "#334155",
                borderRadius: "4px",
                fontSize: "0.78rem",
                px: 1.5,
                "&:hover": { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
              }}
            >
              Partner
            </Button>

            <Button
              component={Link}
              href="/admin/login"
              startIcon={<AdminPanelSettingsRoundedIcon sx={{ fontSize: 16 }} />}
              variant="contained"
              size="small"
              sx={{
                backgroundColor: "#0f172a",
                color: "#ffffff",
                borderRadius: "4px",
                fontSize: "0.78rem",
                px: 1.5,
                "&:hover": { backgroundColor: "#1e293b" },
              }}
            >
              Admin
            </Button>
          </Box>

          {/* Mobile Navigation Menu */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              onClick={(e) => setMobileAnchor(e.currentTarget)}
              size="small"
              sx={{ color: "#0f172a" }}
            >
              <MenuRoundedIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={mobileAnchor}
              open={Boolean(mobileAnchor)}
              onClose={() => setMobileAnchor(null)}
              slotProps={{
                paper: {
                  sx: { width: 190, mt: 1, borderRadius: "4px", border: "1px solid #e2e8f0" },
                },
              }}
            >
              <MenuItem
                component={Link}
                href="/"
                onClick={() => setMobileAnchor(null)}
                sx={{ fontSize: "0.82rem" }}
              >
                Explore Tours
              </MenuItem>
              <MenuItem
                component={Link}
                href="/help"
                onClick={() => setMobileAnchor(null)}
                sx={{ fontSize: "0.82rem" }}
              >
                Help & Support
              </MenuItem>
              <MenuItem
                component={Link}
                href="/partner/login"
                onClick={() => setMobileAnchor(null)}
                sx={{ fontSize: "0.82rem" }}
              >
                Partner Portal
              </MenuItem>
              <MenuItem
                component={Link}
                href="/admin/login"
                onClick={() => setMobileAnchor(null)}
                sx={{ fontSize: "0.82rem" }}
              >
                Admin Panel
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
