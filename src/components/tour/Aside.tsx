"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { MANROPE, BALOO, INK, MUTED, RED, LINE, inr } from "./ui";

const b14 = { fontFamily: MANROPE, fontWeight: 500, fontSize: 14, lineHeight: "20px" } as const;
const WISH = "ej_wishlist";
const tag = { boxSizing: "border-box", height: 24, px: "8px", display: "inline-flex", alignItems: "center", fontFamily: MANROPE, fontWeight: 700, fontSize: 12, lineHeight: "20px" } as const;

interface Props {
  tour: any;
  city: string;
  partner: string;
  rating: { avg: number; n: number };
  from: number;
  was: number | null;
  discount: number;
  dateLabel: string | null;
  depositPerPerson: number;
  days: number;
  nights: number;
}

export default function Aside({ tour, city, partner, rating, from, was, discount, dateLabel, depositPerPerson, days, nights }: Props) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try { setSaved((JSON.parse(localStorage.getItem(WISH) || "[]") as string[]).includes(tour._id)); } catch {}
  }, [tour._id]);
  const toggle = () => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem(WISH) || "[]");
      const next = list.includes(tour._id) ? list.filter((x) => x !== tour._id) : [...list, tour._id];
      localStorage.setItem(WISH, JSON.stringify(next));
      setSaved(next.includes(tour._id));
    } catch {}
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: tour.title, url });
      else { await navigator.clipboard.writeText(url); }
    } catch {}
  };
  const code = `EJ-${String(tour.slug || tour.title).replace(/[^a-z]/gi, "").slice(0, 4).toUpperCase()}${tour.durationDays}`;
  const row = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, py: "12px", borderTop: `1px solid ${LINE}`, textDecoration: "none", color: INK, ...b14, fontSize: 14 } as const;

  return (
    <Box sx={{ position: { lg: "sticky" }, top: 24, display: "grid", rowGap: "12px", alignSelf: "start" }}>
      <Box sx={{ border: `1px solid ${INK}`, p: "16px", bgcolor: "#fff" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {discount > 0 && <Box sx={{ ...tag, bgcolor: INK, color: "#fff" }}>Sale {discount}%</Box>}
            {(tour.travelStyles || []).slice(0, 2).map((s: string) => <Box key={s} sx={{ ...tag, border: `1px solid ${INK}` }}>{s}</Box>)}
          </Box>
          <Box sx={{ display: "flex", gap: "10px", color: INK }}>
            <Box component="button" type="button" aria-label="Share this tour" onClick={share} sx={{ all: "unset", cursor: "pointer", display: "flex" }}><IosShareRoundedIcon sx={{ fontSize: 22 }} /></Box>
            <Box component="button" type="button" aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save tour"} onClick={toggle} sx={{ all: "unset", cursor: "pointer", display: "flex" }}>
              {saved ? <FavoriteRoundedIcon sx={{ fontSize: 22, color: RED }} /> : <FavoriteBorderRoundedIcon sx={{ fontSize: 22 }} />}
            </Box>
          </Box>
        </Box>
        <Box sx={{ mt: "14px", fontFamily: BALOO, fontWeight: 500, fontSize: 30, lineHeight: "36px", letterSpacing: "-0.03em" }}>{days} Days · {nights} Nights</Box>
        <Box sx={{ mt: "16px", ...b14, fontSize: 13, color: MUTED }}>From</Box>
        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <Box sx={{ fontFamily: BALOO, fontWeight: 500, fontSize: 40, lineHeight: "46px", letterSpacing: "-0.03em", color: discount > 0 ? "#C4260F" : INK }}>{inr(from)}</Box>
            <Box sx={{ ...b14, color: MUTED }}>per person</Box>
          </Box>
          {was && <Box sx={{ ...b14, fontWeight: 800, fontSize: 13, textDecoration: "line-through" }}>was {inr(was)}</Box>}
        </Box>
        <Box sx={{ mt: "8px", mb: "12px", ...b14, fontSize: 13, color: MUTED }}>{dateLabel ? `On ${dateLabel} · ` : ""}all inclusive from {city}</Box>

        {rating.n > 0 && (
          <Box component="a" href="#reviews" sx={row}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Box component="span" sx={{ color: "#FF7700", letterSpacing: "1px" }}>{"★".repeat(Math.round(rating.avg))}{"☆".repeat(5 - Math.round(rating.avg))}</Box>
              <Box component="span" sx={{ fontWeight: 800 }}>{rating.avg.toFixed(1)}</Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", color: MUTED }}>{rating.n} {rating.n === 1 ? "review" : "reviews"} <ChevronRightRoundedIcon sx={{ fontSize: 18, color: RED }} /></Box>
          </Box>
        )}
        <Box component="a" href="#getting-there" sx={row}>
          <Box><Box component="span" sx={{ fontWeight: 800 }}>Pickup</Box>{partner && <Box component="span" sx={{ color: MUTED }}> {partner}, {city}</Box>}</Box>
          <ChevronRightRoundedIcon sx={{ fontSize: 18, color: RED }} />
        </Box>
        {depositPerPerson > 0 && (
          <Box component="a" href="#plan" sx={row}>
            <Box component="span" sx={{ fontWeight: 800 }}>Hold seats with {inr(depositPerPerson)}</Box>
            <Box sx={{ display: "flex", alignItems: "center", color: MUTED }}>per person <ChevronRightRoundedIcon sx={{ fontSize: 18, color: RED }} /></Box>
          </Box>
        )}
        <Box component="a" href="#plan" sx={{ mt: "8px", width: 210, height: 38, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: RED, color: "#fff", textDecoration: "none", fontFamily: MANROPE, fontWeight: 600, fontSize: 13, letterSpacing: "0.28px", textTransform: "uppercase", "&:hover": { bgcolor: "#C4260F" } }}>Check dates &amp; prices</Box>
        <Box sx={{ mt: "14px", ...b14, fontSize: 13 }}>Questions? <Box component={Link} href="/help" sx={{ color: INK, fontWeight: 800 }}>Ask us</Box> and we&apos;ll call you back.</Box>
        <Box sx={{ mt: "6px", ...b14, fontSize: 13, color: MUTED }}>Trip code {code}. Quote it when you call.</Box>
      </Box>

      {discount > 0 && (
        <Box>
          <Box sx={{ display: "inline-block", bgcolor: RED, color: "#fff", px: "10px", fontFamily: MANROPE, fontWeight: 700, fontSize: 12, lineHeight: "24px" }}>Deals &amp; offers</Box>
          <Box sx={{ bgcolor: "#EDEDED", p: "12px", display: "flex", alignItems: "center", gap: "12px", ...b14, fontSize: 15 }}>
            <Box sx={{ ...tag, bgcolor: "#fff", border: `1px solid ${LINE}` }}>Save {discount}%</Box>
            {dateLabel ? `Departure ${dateLabel}` : "On selected departures"}
          </Box>
        </Box>
      )}

      <Box sx={{ border: `1px solid ${LINE}`, p: "20px", bgcolor: "#fff" }}>
        <Box sx={{ fontFamily: BALOO, fontWeight: 500, fontSize: 24, lineHeight: "30px", letterSpacing: "-0.02em" }}>Who you&apos;re booking with</Box>
        <Box sx={{ mt: "14px", display: "grid", rowGap: "16px" }}>
          <Box sx={{ display: "flex", gap: "12px" }}>
            <StorefrontOutlinedIcon sx={{ fontSize: 24, flexShrink: 0 }} />
            <Box>
              <Box sx={{ ...b14, fontWeight: 800 }}>{partner || `Your LocalStart Lounge in ${city}`}</Box>
              <Box sx={{ ...b14, fontSize: 13, lineHeight: "19px" }}>Your LocalStart Lounge in {city}. Drop in before you book to meet the team.</Box>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: "12px" }}>
            <VerifiedUserOutlinedIcon sx={{ fontSize: 24, flexShrink: 0 }} />
            <Box>
              <Box sx={{ ...b14, fontWeight: 800 }}>EpicJourneys Travel Pvt. Ltd.</Box>
              <Box sx={{ ...b14, fontSize: 13, lineHeight: "19px" }}>Pay only to this company by UPI or card. We never ask for money on a personal number.</Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
