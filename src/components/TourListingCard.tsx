"use client";

import React from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import { calculateDistanceKm } from "@/lib/geo";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
interface Loc { lat: number; lng: number }

/** The upcoming date to feature: from the chosen start city, else the nearest city to the visitor, soonest first. */
export function featured(t: any, fromId: string | undefined, loc: Loc | null) {
  const now = Date.now();
  const ups = (t.departures || [])
    .filter((d: any) => new Date(d.startDate).getTime() > now && (d.seatsLeft ?? d.seats) > 0)
    .sort((a: any, b: any) => +new Date(a.startDate) - +new Date(b.startDate));
  if (!ups.length) return null;
  const own = fromId ? ups.filter((d: any) => d.cityId?._id === fromId) : [];
  if (own.length) return own[0];
  if (loc) {
    const dist = (d: any) => (d.cityId?.coordinates ? calculateDistanceKm(loc.lat, loc.lng, d.cityId.coordinates.lat, d.cityId.coordinates.lng) : Infinity);
    return [...ups].sort((a, b) => dist(a) - dist(b) || +new Date(a.startDate) - +new Date(b.startDate))[0];
  }
  return ups[0];
}


interface TourListingCardProps {
  tour: any;
  /** The departure to feature (see `featured`), or null when no dates are open. */
  dep: any;
  href: string;
  saved: boolean;
  onToggleSave: () => void;
}

/** Tour card used by the homepage "Popular tours" grid and the /tours listing. */
export default function TourListingCard({ tour: t, dep, href, saved, onToggleSave }: TourListingCardProps) {
  const left = dep ? dep.seatsLeft ?? dep.seats : 0;
  const urgent = dep && left <= 5;
  const sale = t.discountPercentage > 0 || t.specialOffer;
  const showList = t.listPriceInr && t.listPriceInr > t.priceInr;
  return (
                <Box key={t._id} sx={{ boxSizing: "border-box", p: "11px", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ position: "relative", height: 254 }}>
                    <Box component={Link} href={href} aria-label={t.title} sx={{ display: "block", height: "100%" }}>
                      <Box component="img" src={t.coverImage} alt="" loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px", display: "block" }} />
                    </Box>
                    <Box component="button" type="button" aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save tour"} onClick={() => onToggleSave()} sx={{ position: "absolute", top: 13, right: 14, width: 34, height: 34, border: 0, borderRadius: "6px", bgcolor: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", p: 0 }}>
                      {saved ? <FavoriteRoundedIcon sx={{ fontSize: 22, color: "#EA321E" }} /> : <Box component="img" src="/images/home/ico-heart.svg" alt="" sx={{ width: 24, height: 24 }} />}
                    </Box>
                    <Box sx={{ position: "absolute", left: 12, bottom: 12, height: 24, display: "flex", alignItems: "center", bgcolor: "#fff", pl: "23px", pr: "9px", fontFamily: MANROPE, fontWeight: 700, fontSize: 10.5, letterSpacing: "1.1px", color: "#0C0C0C", textTransform: "uppercase" }}>
                      TOUR · {t.durationDays}D / {t.durationNights}N
                    </Box>
                    {sale && (
                      <Box sx={{ position: "absolute", right: -6, bottom: 12, height: 18, display: "flex", alignItems: "center", bgcolor: "#FF7700", px: "9px", fontFamily: MANROPE, fontWeight: 500, fontSize: 12, letterSpacing: "0.1px", color: "#fff" }}>SALE</Box>
                    )}
                  </Box>

                  <Box component={Link} href={href} sx={{ mt: "11px", minHeight: 50, pr: "20px", fontFamily: MANROPE, fontWeight: 600, fontSize: 20, lineHeight: "25px", letterSpacing: "-0.5px", color: "#0C0C0C", textDecoration: "none", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {t.title}
                  </Box>
                  <Box sx={{ mt: "1px", height: 16, display: "flex", alignItems: "center", gap: "8px", fontFamily: MANROPE, fontSize: 12.5, lineHeight: "15.6px", fontWeight: urgent ? 700 : 600, color: urgent ? "#C4260F" : "#4A4A4A" }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "3.5px", flexShrink: 0, bgcolor: urgent ? "#EA321E" : "#8A8A8A" }} />
                    {dep
                      ? `${urgent ? `Only ${left} ${left === 1 ? "seat" : "seats"} left` : `${left} seats left`} on ${new Date(dep.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
                      : "Dates coming soon"}
                  </Box>
                  <Box sx={{ mt: "12px", fontFamily: MANROPE, fontWeight: 500, fontSize: 13, lineHeight: "18.2px", color: "#6B6B6B" }}>
                    {[
                      t.distanceKm != null ? `${Math.round(t.distanceKm).toLocaleString("en-IN")} km away` : null,
                      dep?.cityId?.name ? `from ${dep.cityId.name}` : null,
                      dep ? `Next: ${new Date(dep.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : null,
                    ].filter(Boolean).join(" · ")}
                  </Box>
                  <Box sx={{ mt: "6px", height: "1px", bgcolor: "rgba(0,0,0,0.25)" }} />
                  <Box sx={{ mt: "6px", fontFamily: MANROPE, fontWeight: 500, fontSize: 12, lineHeight: "15px", color: "#6B6B6B" }}>Starting from</Box>
                  <Box sx={{ mt: "4px", height: 32, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <Box sx={{ minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", display: "flex", alignItems: "baseline", gap: "6px", lineHeight: "32px" }}>
                      <Box component="span" sx={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 24, letterSpacing: "-0.1px", color: sale ? "#C4260F" : "#0C0C0C" }}>{inr(t.priceInr)}</Box>
                      {showList && <Box component="span" sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 12, color: "#6B6B6B" }}>{inr(t.listPriceInr)}</Box>}
                      <Box component="span" sx={{ fontFamily: MANROPE, fontWeight: showList ? 400 : 500, fontSize: showList ? 10 : 12, color: "#6B6B6B" }}>/ per person</Box>
                    </Box>
                    <Box component={Link} href={href} sx={{ flexShrink: 0, width: 84, height: 27, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#0C0C0C", color: "#fff", borderRadius: "4px", textDecoration: "none", fontFamily: MANROPE, fontWeight: 700, fontSize: 11.5, letterSpacing: "0.7px", transition: "background-color .2s", "&:hover": { bgcolor: "#262626" } }}>
                      VIEW TOUR
                    </Box>
                  </Box>
                </Box>
  );
}
