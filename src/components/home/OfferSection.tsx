"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

const pad = (n: number) => String(n).padStart(2, "0");

/** "10d : 22h : 41m : 27s", ticking every second. Renders nothing until mounted so server and client agree. */
function Countdown({ to, digit, unit, color }: { to: number; digit: number; unit: number; color: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.floor((to - (now ?? to)) / 1000));
  const parts: [string, string][] = [
    [pad(Math.floor(left / 86400)), "d"],
    [pad(Math.floor((left % 86400) / 3600)), "h"],
    [pad(Math.floor((left % 3600) / 60)), "m"],
    [pad(left % 60), "s"],
  ];
  return (
    <Box component="span" suppressHydrationWarning sx={{ fontFamily: MANROPE, fontWeight: 700, fontSize: digit, lineHeight: "25.6px", color, whiteSpace: "nowrap", visibility: now === null ? "hidden" : "visible" }}>
      {parts.map(([v, u], i) => (
        <React.Fragment key={u}>
          {i > 0 && " : "}
          {v}
          <Box component="span" sx={{ fontWeight: 600, fontSize: unit }}>{u}</Box>
        </React.Fragment>
      ))}
    </Box>
  );
}

interface OfferSectionProps {
  /** All active tours (already carrying live offers, prices and seats left). */
  tours: any[];
  /** The departure city the visitor is nearest to. */
  city: { id: string; name: string } | null;
}

export default function OfferSection({ tours, city }: OfferSectionProps) {
  // The most recently started live offer.
  const offer = useMemo(() => {
    const list = tours.map((t) => t.specialOffer).filter((o) => o && new Date(o.endsAt).getTime() > Date.now());
    return list.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime() || b.percentage - a.percentage)[0] || null;
  }, [tours]);

  // Next dated departure per tour from this city that still has seats.
  const rows = useMemo(() => {
    if (!city) return [];
    const now = Date.now();
    const out: any[] = [];
    for (const t of tours) {
      const next = (t.departures || [])
        .filter((d: any) => d.cityId?._id === city.id && new Date(d.startDate).getTime() > now && (d.seatsLeft ?? d.seats) > 0)
        .sort((a: any, b: any) => +new Date(a.startDate) - +new Date(b.startDate))[0];
      if (next) out.push({ tour: t, dep: next });
    }
    return out.sort((a, b) => +new Date(a.dep.startDate) - +new Date(b.dep.startDate)).slice(0, 3);
  }, [tours, city]);

  if (!offer && rows.length === 0) return null;
  const style = String(offer?.travelStyle || "").trim();

  return (
    <Box component="section" sx={{ bgcolor: "#EDEDED", pt: "72px", pb: "64px" }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" }, display: "flex", flexDirection: { xs: "column", md: "row" } }}>
        {offer && (
          <Box sx={{ position: "relative", flex: { md: rows.length ? "607 1 0" : 1 }, minHeight: 356, bgcolor: "#EA321E", color: "#fff", p: { xs: 3, md: "24px 50px" }, pb: { xs: 3, md: 0 } }}>
            <Box sx={{ ml: { md: "-1px" }, display: "inline-block", boxSizing: "border-box", height: 44, border: "2.5px solid #fff", px: "12.5px", pt: "5px", fontFamily: MANROPE, fontWeight: 800, fontSize: 13, lineHeight: "16.3px", letterSpacing: "0.8px", textTransform: "uppercase" }}>
              Diwali Special
            </Box>
            <Box component="h2" sx={{ m: 0, mt: "4px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 30, md: 38 }, lineHeight: "38.8px", letterSpacing: "-0.034em" }}>
              Flat {offer.percentage}% off
            </Box>
            <Box sx={{ mt: "17px", fontFamily: MANROPE, fontWeight: 600, fontSize: 19, lineHeight: "24.7px", opacity: 0.95 }}>on every {style.toLowerCase()} tour</Box>
            <Box sx={{ mt: "9px", fontFamily: MANROPE, fontWeight: 500, fontSize: 13.5, lineHeight: "20.3px", color: "rgba(255,255,255,0.9)" }}>
              The discount is already included in the prices you see.
            </Box>
            <Box sx={{ mt: "21.7px", fontFamily: MANROPE, fontWeight: 700, fontSize: 10.5, lineHeight: "13.1px", letterSpacing: "1.3px", color: "rgba(255,255,255,0.85)" }}>OFFER ENDS IN</Box>
            <Box sx={{ mt: "5px", pb: { xs: 2, md: 0 } }}>
              <Countdown to={new Date(offer.endsAt).getTime()} digit={22} unit={12.1} color="#fff" />
            </Box>
            <Box
              component={Link}
              href={`/tours?style=${encodeURIComponent(style)}`}
              sx={{
                position: { md: "absolute" },
                right: { md: 38 },
                top: { md: 206 },
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                height: 47,
                px: "19.5px",
                mt: { xs: 1, md: 0 },
                bgcolor: "#fff",
                color: "#C4260F",
                textDecoration: "none",
                fontFamily: MANROPE,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                transition: "background-color .2s",
                "&:hover": { bgcolor: "#F7F7F7" },
              }}
            >
              See {style} tours
            </Box>
          </Box>
        )}

        {rows.length > 0 && city && (
          <Box sx={{ flex: { md: offer ? "713 1 0" : 1 }, minHeight: 356, boxSizing: "border-box", bgcolor: "#fff", p: { xs: 2.5, md: "26px 44px 0 30px" } }}>
            <Box sx={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 15, lineHeight: "18.8px", color: "#0C0C0C", pb: "14px", borderBottom: "2px solid #D6D6D6", height: { md: 34 }, boxSizing: "content-box" }}>
              Next direct departures from <Box component="span" sx={{ color: "#EA321E" }}>{city.name}</Box>
            </Box>
            {rows.map(({ tour, dep }, i) => {
              const left = dep.seatsLeft ?? dep.seats;
              const urgent = left <= 5;
              return (
                <Box
                  key={tour._id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr auto", md: "233px 165px 173px 68px" },
                    alignItems: "center",
                    rowGap: 1,
                    py: "14px",
                    pb: "16px",
                    borderTop: i ? "1px solid #E1E1E1" : "none",
                  }}
                >
                  <Box sx={{ minWidth: 0, pr: 2 }}>
                    <Box sx={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 15, lineHeight: "18.8px", color: "#0C0C0C" }}>
                      {city.name} → {tour.targetCity || tour.destinationId?.name}
                    </Box>
                    <Box sx={{ mt: "2px", fontFamily: MANROPE, fontWeight: 500, fontSize: 12.5, lineHeight: "15.6px", color: "#6B6B6B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 215 }}>
                      {tour.title} · {tour.durationDays}D / {tour.durationNights}N
                    </Box>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "1", md: "auto" }, gridRow: { xs: 2, md: "auto" } }}>
                    <Box sx={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 10, lineHeight: "12.5px", letterSpacing: "1px", color: "#8A8A8A" }}>LEAVES IN</Box>
                    <Box sx={{ mt: "1.5px" }}>
                      <Countdown to={new Date(dep.startDate).getTime()} digit={17} unit={9.4} color="#0C0C0C" />
                    </Box>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "1", md: "auto" }, gridRow: { xs: 3, md: "auto" }, maxWidth: 142, fontFamily: MANROPE, fontSize: 12.5, lineHeight: "15.6px", fontWeight: urgent ? 700 : 600, color: urgent ? "#C4260F" : "#4A4A4A" }}>
                    {urgent ? `Only ${left} ${left === 1 ? "seat" : "seats"} left at this price` : `${left} seats left`}
                  </Box>
                  <Box
                    component={Link}
                    href={`/tours/${tour.slug || tour._id}?from=${city.id}`}
                    sx={{
                      gridColumn: { xs: 2, md: "auto" },
                      gridRow: { xs: "1 / span 3", md: "auto" },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 68,
                      height: 38,
                      bgcolor: "#0C0C0C",
                      color: "#fff",
                      textDecoration: "none",
                      fontFamily: MANROPE,
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: "0.7px",
                      transition: "background-color .2s",
                      "&:hover": { bgcolor: "#262626" },
                    }}
                  >
                    BOOK
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
