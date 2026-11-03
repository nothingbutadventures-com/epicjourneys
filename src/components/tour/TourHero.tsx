"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Menu, MenuItem } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import { MANROPE, BALOO, INK, RED } from "./ui";

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
const PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";

interface Props {
  image: string;
  cities: { id: string; name: string; disabled: boolean }[];
  cityId: string;
  cityLabel: string;
  onCity: (id: string) => void;
}

/** Utility bar, floating header and hero photo of the tour page. */
export default function TourHero({ image, cities, cityId, cityLabel, onCity }: Props) {
  const [account, setAccount] = useState<{ name: string } | null>(null);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  useEffect(() => {
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((d) => d?.authenticated && setAccount({ name: d.user.name })).catch(() => {});
  }, []);
  const ul = { fontFamily: MANROPE, fontWeight: 500, fontSize: 14, lineHeight: "20px", color: "#fff", textDecoration: "none", "&:hover": { opacity: 0.8 } } as const;

  return (
    <Box component="section">
      <Box sx={{ bgcolor: INK, height: 40 }}>
        <Box sx={{ maxWidth: 1160, mx: "auto", px: { xs: 2, lg: 0 }, height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: "24px", ...ul, "&:hover": undefined }}>
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>India’s trusted online travel network, operating right out of your neighborhood.</Box>
            <Box component="a" href="mailto:support@epicjourneys.in" sx={{ ...ul, display: { xs: "none", md: "inline" } }}>support@epicjourneys.in</Box>
          </Box>
          <Box sx={{ display: "flex", gap: "20px" }}>
            <Box component={Link} href="/tours" sx={ul}>All tours</Box>
            <Box component={Link} href="/user/profile" sx={ul}>Bookings</Box>
            {account ? <Box component="span" sx={ul}>Hi, {account.name.split(" ")[0]}</Box> : <Box component={Link} href="/login" sx={ul}>Login</Box>}
          </Box>
        </Box>
      </Box>

      <Box sx={{ position: "relative", height: { xs: 360, md: 450 }, bgcolor: INK, overflow: "hidden" }}>
        <Box component="img" src={image} alt="" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 160, background: "linear-gradient(180deg, rgba(12,12,12,0.7) 0%, rgba(12,12,12,0.35) 50%, rgba(12,12,12,0) 100%)" }} />

        <Box sx={{ position: "relative", maxWidth: 1160, mx: "auto", px: { xs: 2, lg: 0 }, height: 79, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: { md: "76px" } }}>
            <Box component={Link} href="/" aria-label="EpicJourneys home" sx={{ textDecoration: "none", fontFamily: BALOO, fontWeight: 700, fontSize: 32, lineHeight: "51px", letterSpacing: "-0.32px", color: "#fff" }}>
              epic <Box component="span" sx={{ color: "#FF5A45" }}>journeys</Box><Box component="span" sx={{ fontWeight: 600, fontSize: 20, color: "rgba(255,255,255,0.5)" }}>.in</Box>
            </Box>
            <Box component="nav" aria-label="Main" sx={{ display: { xs: "none", md: "flex" }, gap: "40px" }}>
              <Box component={Link} href="/#tour-results" sx={{ ...ul, fontSize: 16, lineHeight: "24px" }}>Destinations <Box component="span" sx={{ fontSize: 11 }}>▾</Box></Box>
              <Box component={Link} href="/tours" sx={{ ...ul, fontSize: 16, lineHeight: "24px" }}>Tours</Box>
              <Box component={Link} href="/tours" sx={{ ...ul, fontSize: 16, lineHeight: "24px" }}>Themes</Box>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: "16px", md: "28px" } }}>
            <Box component="button" type="button" onClick={(e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)} sx={{ all: "unset", cursor: "pointer", textAlign: "left", color: "#fff", display: { xs: "none", sm: "block" } }}>
              <Box sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 12, lineHeight: "16px", color: "rgba(255,255,255,0.75)" }}>Departing from</Box>
              <Box sx={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 14, lineHeight: "20px", display: "flex", alignItems: "center" }}>{cityLabel}<KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} /></Box>
            </Box>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { mt: 1, borderRadius: 0, minWidth: 200 } } }}>
              {cities.filter((c) => !c.disabled).map((c) => (
                <MenuItem key={c.id} selected={c.id === cityId} onClick={() => { onCity(c.id); setAnchor(null); }} sx={{ fontFamily: MANROPE, fontSize: 14, fontWeight: c.id === cityId ? 700 : 500 }}>{c.name}</MenuItem>
              ))}
            </Menu>
            <Box component={WA ? "a" : Link} href={WA ? `https://wa.me/${WA}` : "/help"} sx={{ ...ul, fontWeight: 700 }}>WhatsApp us</Box>
            {PHONE && <Box component="a" href={`tel:${PHONE}`} aria-label="Call us" sx={{ color: "#fff", display: "flex" }}><PhoneInTalkOutlinedIcon /></Box>}
          </Box>
        </Box>

        <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 22 }}>
          <Box sx={{ maxWidth: 1160, mx: "auto", px: { xs: 2, lg: 0 }, display: "flex", justifyContent: "flex-end" }}>
            <Box component="a" href="#photos" sx={{ height: 48, px: "16px", display: "flex", alignItems: "center", gap: "10px", bgcolor: "#fff", color: INK, textDecoration: "none", fontFamily: MANROPE, fontWeight: 700, fontSize: 14, "&:hover": { bgcolor: "#F6F6F6" } }}>
              <GridViewRoundedIcon sx={{ fontSize: 20, color: RED }} /> See photos
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
