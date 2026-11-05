"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Box, IconButton, Menu, MenuItem } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

const NAV = [
  { label: "Destinations", href: "/#tour-results", caret: true },
  { label: "Tours", href: "/tours" },
  { label: "Themes", href: "/tours" },
  { label: "Winter Sale", href: "/tours?sale=1" },
  { label: "Partners", href: "/our-partners" },
];

interface HomeHeaderProps {
  /** Float transparently over a hero photo (homepage). Everywhere else the header is a solid dark bar. */
  overlay?: boolean;
  userLocationName?: string;
  onLocationClick?: () => void;
}

const utilityText = { fontFamily: MANROPE, fontWeight: 500, fontSize: 12.5, lineHeight: "15.6px", color: "#BDBDBD", transform: "translateY(-1px)" } as const;
const Dot = () => <Box component="span" aria-hidden="true" sx={{ ...utilityText, opacity: 0.5, mx: "10px" }}>·</Box>;
const utilityLink = { ...utilityText, textDecoration: "none", cursor: "pointer", "&:hover": { color: "#fff" } } as const;

/**
 * Homepage header from the design: a dark utility bar, then a transparent header over the hero photo.
 * Once the page scrolls past the utility bar the header pins to the top on a dark background so the menu stays reachable.
 * (Other pages keep the standard white Navbar.)
 */
export default function HomeHeader({ overlay = false, userLocationName, onLocationClick }: HomeHeaderProps) {
  const [mobileAnchor, setMobileAnchor] = useState<null | HTMLElement>(null);
  const [account, setAccount] = useState<{ name: string; role: string } | null>(null);
  const [pinned, setPinned] = useState(false);
  // Pages that don't track the visitor's city show the one the homepage saved.
  const [savedPlace, setSavedPlace] = useState("");
  useEffect(() => {
    try {
      setSavedPlace(JSON.parse(localStorage.getItem("ej_location") || "{}")?.name || "");
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.authenticated && setAccount({ name: d.user.name, role: d.user.role }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setPinned(window.scrollY > 38);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    setAccount(null);
    window.location.href = "/";
  };

  const cityName = userLocationName || savedPlace;
  const place = cityName ? (/^near\s/i.test(cityName) ? cityName : `Near ${cityName}`) : "Choose your city";
  const firstName = account?.name.split(" ")[0];

  return (
    <Box sx={{ position: "relative", zIndex: 20 }}>
      {/* Utility bar */}
      <Box sx={{ bgcolor: "#0C0C0C", height: 38 }}>
        <Box sx={{ maxWidth: 1440, mx: "auto", height: "100%", px: { xs: 2, md: "60px" }, display: "flex", alignItems: "center" }}>
          {/* Left: email */}
          <Box sx={{ flex: 1, display: { xs: "none", md: "flex" }, alignItems: "center", minWidth: 0 }}>
            <Box component="a" href="mailto:support@epicjourneys.in" sx={utilityLink}>✉️ support@epicjourneys.in</Box>
          </Box>

          {/* Center: location */}
          <Box sx={{ flex: { xs: 1, md: "0 1 auto" }, display: "flex", justifyContent: "center", minWidth: 0 }}>
            <Box component="span" sx={{ ...utilityText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              📍 {place} ·{" "}
              <Box component="button" type="button" onClick={onLocationClick || (() => { window.location.href = "/"; })} sx={{ all: "unset", ...utilityLink, "&:focus-visible": { outline: "1px solid #fff", outlineOffset: 2 } }}>
                Change
              </Box>
            </Box>
          </Box>

          {/* Right: currency + account links */}
          <Box sx={{ flex: 1, display: { xs: "none", md: "flex" }, alignItems: "center", justifyContent: "flex-end" }}>
            {/* Prices are in rupees only, so USD is shown as in the design but not selectable yet. */}
            <Box sx={{ display: "flex", alignItems: "center", boxSizing: "border-box", height: 28, p: "2px", border: "1px solid #444" }} role="group" aria-label="Currency">
              <Box component="button" type="button" aria-pressed="true" sx={{ all: "unset", boxSizing: "border-box", width: 46, height: 22, textAlign: "center", lineHeight: "22px", bgcolor: "#fff", color: "#0C0C0C", fontFamily: MANROPE, fontSize: 12, fontWeight: 400, cursor: "default" }}>
                ₹ INR
              </Box>
              <Box component="button" type="button" aria-disabled="true" title="Prices are shown in INR" sx={{ all: "unset", boxSizing: "border-box", width: 51, height: 22, textAlign: "center", lineHeight: "22px", color: "#E2E2E2", fontFamily: MANROPE, fontSize: 12, fontWeight: 400, cursor: "not-allowed" }}>
                $ USD
              </Box>
            </Box>
            <Dot />
            <Box component={Link} href="/user/profile" sx={utilityLink}>Bookings</Box>
            <Dot />
            {account ? (
              <>
                <Box component="span" sx={utilityText}>Hi, {firstName}</Box>
                <Dot />
                <Box component="button" type="button" onClick={logout} sx={{ all: "unset", ...utilityLink, "&:focus-visible": { outline: "1px solid #fff", outlineOffset: 2 } }}>Logout</Box>
              </>
            ) : (
              <>
                <Box component={Link} href="/login" sx={utilityLink}>Login</Box>
                <Dot />
                <Box component={Link} href="/register" sx={utilityLink}>Register</Box>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Header: floats over the hero photo on the homepage, a solid bar elsewhere */}
      <Box sx={{ position: "relative", height: overlay ? 0 : 71 }}>
      <Box
        component="header"
        sx={{
          position: pinned ? "fixed" : "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 71,
          zIndex: 30,
          bgcolor: pinned ? "rgba(12,12,12,0.94)" : overlay ? "transparent" : "#0C0C0C",
          transition: "background-color .2s",
        }}
      >
        <Box sx={{ maxWidth: 1440, mx: "auto", height: "100%", px: { xs: 2, md: "60px" }, display: "flex", alignItems: "flex-start" }}>
          <Link href="/" aria-label="EpicJourneys home" style={{ textDecoration: "none", display: "flex", alignItems: "flex-start", marginTop: 10, color: "#fff" }}>
            {/* Fixed widths keep the nav in the design's position whatever the font renders at. */}
            <Box component="span" sx={{ width: 63, flexShrink: 0, fontFamily: BALOO, fontWeight: 700, fontSize: 32, lineHeight: "32px", letterSpacing: "-0.3px", color: "#fff", whiteSpace: "nowrap" }}>epic</Box>
            <Box component="span" sx={{ width: 125, flexShrink: 0, fontFamily: BALOO, fontWeight: 700, fontSize: 32, lineHeight: "32px", letterSpacing: "-0.3px", color: "#FF5A45", whiteSpace: "nowrap" }}>journeys</Box>
            <Box component="span" sx={{ width: 22, flexShrink: 0, fontFamily: BALOO, fontWeight: 600, fontSize: 19.8, lineHeight: "19.8px", letterSpacing: "-0.3px", color: "rgba(255,255,255,0.45)", mt: "12px", whiteSpace: "nowrap" }}>.in</Box>
          </Link>

          <Box component="nav" aria-label="Main" sx={{ display: { xs: "none", md: "flex" }, flex: 1, alignItems: "flex-start", mt: "24px", pl: { md: "40px", lg: "158px" }, columnGap: { md: "28px", lg: "56px" } }}>
            {NAV.map((n) => (
              <Box
                key={n.label}
                component={Link}
                href={n.href}
                sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 16, lineHeight: "20px", color: "#fff", textDecoration: "none", whiteSpace: "nowrap", "&:hover": { opacity: 0.75 } }}
              >
                {n.label}
                {n.caret && <Box component="span" sx={{ fontSize: 11 }}> ▾</Box>}
              </Box>
            ))}
          </Box>

          <Box
            component={Link}
            href="/tours"
            sx={{
              display: { xs: "none", md: "flex" },
              ml: "auto",
              mt: "15px",
              height: 41,
              px: "22px",
              alignItems: "center",
              bgcolor: "#EA321E",
              color: "#fff",
              textDecoration: "none",
              whiteSpace: "nowrap",
              fontFamily: MANROPE,
              fontWeight: 600,
              fontSize: 14,
              lineHeight: "17.5px",
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              transition: "background-color .2s",
              "&:hover": { bgcolor: "#C4260F" },
            }}
          >
            Find a tour
          </Box>

          {/* Mobile menu */}
          <Box sx={{ display: { xs: "flex", md: "none" }, ml: "auto", mt: "12px" }}>
            <IconButton onClick={(e) => setMobileAnchor(e.currentTarget)} aria-label="Open menu" sx={{ color: "#fff" }}>
              <MenuRoundedIcon />
            </IconButton>
            <Menu anchorEl={mobileAnchor} open={Boolean(mobileAnchor)} onClose={() => setMobileAnchor(null)} slotProps={{ paper: { sx: { width: 210, mt: 1, borderRadius: "4px" } } }}>
              {NAV.map((n) => (
                <MenuItem key={n.label} component={Link} href={n.href} onClick={() => setMobileAnchor(null)} sx={{ fontSize: "0.9rem", fontWeight: 500 }}>
                  {n.label}
                </MenuItem>
              ))}
              <MenuItem component={Link} href="/tours" onClick={() => setMobileAnchor(null)} sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#EA321E" }}>
                Find a tour
              </MenuItem>
              <MenuItem component={Link} href="/user/profile" onClick={() => setMobileAnchor(null)} sx={{ fontSize: "0.9rem" }}>
                Bookings
              </MenuItem>
              {account ? (
                <MenuItem onClick={logout} sx={{ fontSize: "0.9rem", fontWeight: 700 }}>Logout ({firstName})</MenuItem>
              ) : (
                [
                  <MenuItem key="l" component={Link} href="/login" onClick={() => setMobileAnchor(null)} sx={{ fontSize: "0.9rem" }}>Login</MenuItem>,
                  <MenuItem key="r" component={Link} href="/register" onClick={() => setMobileAnchor(null)} sx={{ fontSize: "0.9rem", fontWeight: 700 }}>Register</MenuItem>,
                ]
              )}
            </Menu>
          </Box>
        </Box>
      </Box>
      </Box>
    </Box>
  );
}
