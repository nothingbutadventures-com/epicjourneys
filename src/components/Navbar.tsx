"use client";

import React, { useEffect, useState } from "react";
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
  const [account, setAccount] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.authenticated && setAccount({ name: d.user.name, role: d.user.role }))
      .catch(() => {});
  }, []);

  const logout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    setAccount(null);
    window.location.href = "/";
  };

  return (
    <>
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #E2E2E2",
        borderRadius: 0,
        zIndex: 1000,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: "68px !important", height: 68, gap: 1.5 }}>
          {/* Brand Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }} aria-label="Epic Journeys">
            <Box component="img" src="/logo.svg" alt="Epic Journeys" sx={{ height: { xs: 36, md: 42 }, width: "auto", display: "block" }} />
          </Link>

          {/* Location indicator button */}
          {userLocationName && (
            <Chip
              icon={<LocationOnIcon sx={{ fontSize: "14px !important", color: "#E68A00 !important" }} />}
              label={`Near ${userLocationName}`}
              onClick={onLocationClick}
              size="small"
              sx={{
                ml: { xs: 1, sm: 2 },
                borderColor: "#E2E2E2",
                backgroundColor: "#F2F4F7",
                fontWeight: 600,
                color: "#1e293b",
                fontSize: "0.75rem",
                borderRadius: "4px",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "#F2F4F7",
                  borderColor: "#cbd5e1",
                },
              }}
            />
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
            {[
              { label: "Destinations", href: "/#destinations" },
              { label: "Tours", href: "/tours" },
              { label: "Bookings", href: "/user/profile" },
            ].map((l) => (
              <Button
                key={l.label}
                component={Link}
                href={l.href}
                variant="text"
                sx={{ color: "#334155", fontWeight: 600, borderRadius: "4px", fontSize: "0.88rem", px: 1.75, "&:hover": { bgcolor: "#F2F4F7", color: "#0f172a" } }}
              >
                {l.label}
              </Button>
            ))}
            <Box sx={{ width: "1px", height: 24, bgcolor: "#E2E2E2", mx: 1.5 }} />
            {account ? (
              <>
                <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem", px: 1.5 }}>
                  Hi, {account.name.split(" ")[0]}
                </Typography>
                <Button
                  onClick={logout}
                  variant="outlined"
                  sx={{ borderRadius: "4px", fontSize: "0.88rem", fontWeight: 700, px: 2.25 }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  href="/login"
                  variant="text"
                  sx={{ color: "#0f172a", fontWeight: 700, borderRadius: "4px", fontSize: "0.88rem", px: 2 }}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  sx={{
                    bgcolor: "#43149D",
                    color: "#ffffff",
                    borderRadius: "4px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    px: 2.5,
                    py: 0.9,
                    "&:hover": { bgcolor: "#360F7D" },
                  }}
                >
                  Register
                </Button>
              </>
            )}
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
                  sx: { width: 190, mt: 1, borderRadius: "4px", border: "1px solid #E2E2E2" },
                },
              }}
            >
              <MenuItem
                component={Link}
                href="/#destinations"
                onClick={() => setMobileAnchor(null)}
                sx={{ fontSize: "0.88rem", fontWeight: 500 }}
              >
                Destinations
              </MenuItem>
              <MenuItem
                component={Link}
                href="/tours"
                onClick={() => setMobileAnchor(null)}
                sx={{ fontSize: "0.88rem", fontWeight: 500 }}
              >
                Tours
              </MenuItem>
              <MenuItem
                component={Link}
                href="/user/profile"
                onClick={() => setMobileAnchor(null)}
                sx={{ fontSize: "0.88rem", fontWeight: 500 }}
              >
                Bookings
              </MenuItem>
              {account ? (
                <MenuItem onClick={logout} sx={{ fontSize: "0.88rem", fontWeight: 700 }}>
                  Logout ({account.name.split(" ")[0]})
                </MenuItem>
              ) : (
                [
                  <MenuItem key="l" component={Link} href="/login" onClick={() => setMobileAnchor(null)} sx={{ fontSize: "0.88rem" }}>
                    Login
                  </MenuItem>,
                  <MenuItem key="r" component={Link} href="/register" onClick={() => setMobileAnchor(null)} sx={{ fontSize: "0.88rem", fontWeight: 700 }}>
                    Register
                  </MenuItem>,
                ]
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
      {/* Spacer so page content starts below the fixed header */}
      <Box sx={{ height: 68 }} />
    </>
  );
}
