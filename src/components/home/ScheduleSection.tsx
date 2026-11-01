"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const plural = (n: number) => `${n} ${n === 1 ? "DEPARTURE" : "DEPARTURES"}`;

/** "Tours by state": each tour's next dated departure with seats, grouped by the tour's state. */
export default function ScheduleSection({ tours }: { tours: any[] }) {
  const [state, setState] = useState<string>("All states");

  const rows = useMemo(() => {
    const now = Date.now();
    const out: any[] = [];
    for (const t of tours) {
      const dep = (t.departures || [])
        .filter((d: any) => new Date(d.startDate).getTime() > now && (d.seatsLeft ?? d.seats) > 0)
        .sort((a: any, b: any) => +new Date(a.startDate) - +new Date(b.startDate))[0];
      if (dep) out.push({ t, dep });
    }
    return out.sort((a, b) => +new Date(a.dep.startDate) - +new Date(b.dep.startDate));
  }, [tours]);

  const states = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) if (r.t.state) m.set(r.t.state, (m.get(r.t.state) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [rows]);

  if (rows.length === 0) return null;
  const shown = state === "All states" ? rows : rows.filter((r) => r.t.state === state);
  const list: [string, number][] = [["All states", rows.length], ...states];

  return (
    <Box component="section" id="schedule" sx={{ bgcolor: "#EDEDED", pt: { xs: 8, md: "176px" }, pb: { xs: 8, md: "129px" } }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" } }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { md: "flex-start" }, gap: { xs: 2, md: 4 } }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Box sx={{ width: 14, height: 14, borderRadius: "7px", bgcolor: "#EA321E", flexShrink: 0 }} />
              <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "14.4px", letterSpacing: "1.7px", color: "#0C0C0C" }}>ONGOING TOURS SCHEDULE</Box>
            </Box>
            <Box component="h2" sx={{ m: 0, mt: "2px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 34, md: 46 }, lineHeight: "46.9px", letterSpacing: "-0.035em", color: "#0C0C0C" }}>
              Tours by state, <Box component="span" sx={{ color: "#EA321E" }}>departing soon</Box>
            </Box>
          </Box>
          <Box sx={{ mt: { md: "10px" }, maxWidth: 560, fontFamily: MANROPE, fontWeight: 500, fontSize: 17, lineHeight: "27.2px", color: "#4A4A4A" }}>
            Pick a state to see its next departures and how many seats are left.
          </Box>
        </Box>

        <Box sx={{ mt: "10px", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 4, md: "56px" } }}>
          {/* State list */}
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, flexShrink: 0, borderTop: "1px solid rgba(12,12,12,0.16)", alignSelf: "flex-start", width: { xs: "100%", md: 300 } }}>
            {list.map(([name, n]) => {
              const on = state === name;
              return (
                <Box component="li" key={name} sx={{ borderBottom: "1px solid rgba(12,12,12,0.16)" }}>
                  <Box component="button" type="button" aria-pressed={on} onClick={() => setState(name)} sx={{ all: "unset", boxSizing: "border-box", width: "100%", minHeight: 62, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", p: "16px 14px", cursor: "pointer", bgcolor: on ? "#0C0C0C" : "transparent", color: on ? "#fff" : "#0C0C0C", "&:hover": { bgcolor: on ? "#0C0C0C" : "rgba(12,12,12,0.05)" }, "&:focus-visible": { outline: "2px solid #EA321E", outlineOffset: -2 } }}>
                    <Box component="span" sx={{ maxWidth: 140, fontFamily: MANROPE, fontWeight: 400, fontSize: 21, lineHeight: "25.2px" }}>{name}</Box>
                    <Box component="span" sx={{ mt: "10px", whiteSpace: "nowrap", fontFamily: MANROPE, fontWeight: 600, fontSize: 11.5, lineHeight: "14.4px", letterSpacing: "0.9px", color: on ? "rgba(255,255,255,0.72)" : "#6B6B6B" }}>{plural(n)}</Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Departures */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: "15.6px", borderBottom: "1px solid #0C0C0C", fontFamily: MANROPE, fontSize: 11.5, lineHeight: "14.4px", letterSpacing: "1.2px" }}>
              <Box component="span" sx={{ fontWeight: 700, color: "#0C0C0C" }}>NEXT DEPARTURES</Box>
              <Box component="span" sx={{ fontWeight: 600, color: "#6B6B6B" }}>{plural(shown.length)}</Box>
            </Box>
            {shown.map(({ t, dep }) => {
              const left = dep.seatsLeft ?? dep.seats;
              const urgent = left <= 3;
              const d = new Date(dep.startDate);
              const price = Math.round(dep.price * (1 - (dep.discountPercentage || 0) / 100));
              return (
                <Box key={t._id} sx={{ display: "grid", alignItems: "center", gap: { xs: 2, md: "24px" }, gridTemplateColumns: { xs: "72px 1fr", md: "72px minmax(0,1fr) 190px 110px 120px" }, p: { xs: "20px 0", md: "20px 20px" }, borderBottom: "1px solid rgba(12,12,12,0.14)" }}>
                  <Box sx={{ boxSizing: "border-box", width: 72, height: 72, bgcolor: "#fff", border: "1px solid #0C0C0C", textAlign: "center", pt: "7px" }}>
                    <Box sx={{ fontFamily: MANROPE, fontWeight: 400, fontSize: 28, lineHeight: "28px", color: "#0C0C0C" }}>{String(d.getDate()).padStart(2, "0")}</Box>
                    <Box sx={{ mt: "8px", fontFamily: MANROPE, fontWeight: 700, fontSize: 11, lineHeight: "13.8px", letterSpacing: "1.3px", color: "#6B6B6B", textTransform: "uppercase" }}>{d.toLocaleDateString("en-US", { month: "short" })}</Box>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Box component={Link} href={`/tours/${t.slug || t._id}?from=${dep.cityId?._id}`} sx={{ display: "block", textDecoration: "none", color: "#0C0C0C", fontFamily: MANROPE, fontWeight: 400, fontSize: 21, lineHeight: "26.3px" }}>{t.title}</Box>
                    <Box sx={{ mt: "7px", fontFamily: MANROPE, fontWeight: 500, fontSize: 13.5, lineHeight: "16.9px", color: "#6B6B6B" }}>
                      {t.durationDays}D / {t.durationNights}N · from {dep.cityId?.name}{t.state ? ` · ${t.state}` : ""}
                    </Box>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                    <Box sx={{ fontFamily: MANROPE, fontWeight: urgent ? 700 : 600, fontSize: 13, lineHeight: "16.3px", color: urgent ? "#EA321E" : "#0C0C0C" }}>
                      {urgent ? "Filling fast · " : ""}{left} of {dep.seats} seats left
                    </Box>
                    <Box sx={{ mt: "9.7px", height: 4, bgcolor: "rgba(12,12,12,0.1)" }}>
                      <Box sx={{ height: "100%", width: `${Math.round(((dep.seats - left) / dep.seats) * 100)}%`, bgcolor: urgent ? "#EA321E" : "#0C0C0C" }} />
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 12, lineHeight: "15px", color: "#6B6B6B" }}>from</Box>
                    <Box sx={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 18, lineHeight: "22.5px", color: "#0C0C0C" }}>{inr(price)}</Box>
                  </Box>
                  <Box component={Link} href={`/tours/${t.slug || t._id}?from=${dep.cityId?._id}`} sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 48, bgcolor: "#0C0C0C", color: "#fff", textDecoration: "none", fontFamily: MANROPE, fontWeight: 700, fontSize: 13, letterSpacing: "0.8px", transition: "background-color .2s", "&:hover": { bgcolor: "#262626" } }}>
                    BOOK NOW
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
