"use client";

import React from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AirlineSeatReclineNormalOutlinedIcon from "@mui/icons-material/AirlineSeatReclineNormalOutlined";
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { MANROPE, BALOO, INK, MUTED, RED, LINE, inr, SectionHead } from "./ui";

const b14 = { fontFamily: MANROPE, fontWeight: 500, fontSize: 14, lineHeight: "20px" } as const;
const utc = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString("en-IN", { ...o, timeZone: "UTC" });

const StepTitle = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: "12px", mb: "16px" }}>
    <Box sx={{ width: 28, height: 28, bgcolor: INK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MANROPE, fontWeight: 700, fontSize: 14 }}>{n}</Box>
    <Box sx={{ fontFamily: BALOO, fontWeight: 500, fontSize: 24, lineHeight: "30px", letterSpacing: "-0.02em" }}>{children}</Box>
  </Box>
);

export interface PlanProps {
  cities: { id: string; name: string; short: string; disabled: boolean }[];
  cityId: string;
  onCity: (id: string) => void;
  homeCityId: string;
  departures: any[];
  selected: any | null;
  onSelect: (d: any) => void;
  travellers: number;
  setTravellers: (n: number) => void;
  max: number;
  unit: number;
  total: number;
  pay: number;
  canBook: boolean;
  onBook: () => void;
  cityName: string;
  partner: string;
}

export default function PlanTrip(p: PlanProps) {
  const partnerCities = p.cities.filter((c) => c.id !== "base" && !c.disabled);
  const base = p.cities.find((c) => c.id === "base");
  const mode = p.cityId === "base" ? "base" : p.cityId === p.homeCityId ? "home" : p.cityId ? "near" : "";
  const home = partnerCities.find((c) => c.id === p.homeCityId) || partnerCities[0];
  const others = partnerCities.filter((c) => c.id !== home?.id);
  const tabs = [
    { key: "home", icon: <HomeOutlinedIcon />, t: home ? `From ${home.short}` : "From your town", s: "Pickup at your lounge", disabled: !home, go: () => home && p.onCity(home.id), rec: true },
    { key: "near", icon: <AirlineSeatReclineNormalOutlinedIcon />, t: "From nearby towns", s: "Free feeder, under 100 km", disabled: others.length === 0, go: () => others[0] && p.onCity(others[0].id) },
    { key: "base", icon: <NearMeOutlinedIcon />, t: "Standard departures", s: "Joining / Leaving", disabled: !base || base.disabled, go: () => p.onCity("base") },
  ];
  const sel = p.selected;
  const date = (iso: string) => ({ d: utc(iso, { day: "2-digit" }), m: utc(iso, { month: "short", year: "numeric" }), w: utc(iso, { weekday: "short" }) });
  const rooms = Math.ceil(p.travellers / 2);

  return (
    <Box id="plan" sx={{ scrollMarginTop: "70px" }}>
      <SectionHead eyebrow="Plan your trip" title="Dates, travellers and" red="your total" sub={`Everything from ${p.cityName} and back is in the price. Seats are held once you pay the deposit.`} />

      <Box sx={{ mt: "28px" }}>
        <StepTitle n={1}>Pick a departure</StepTitle>
        <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, border: `1px solid ${INK}` }}>
          {tabs.map((t, i) => {
            const on = mode === t.key;
            return (
              <Box key={t.key} component="button" type="button" disabled={t.disabled} aria-pressed={on} onClick={t.go} sx={{ all: "unset", boxSizing: "border-box", position: "relative", cursor: t.disabled ? "not-allowed" : "pointer", opacity: t.disabled ? 0.4 : 1, minHeight: 78, p: "16px", display: "flex", alignItems: "center", gap: "12px", bgcolor: on ? INK : "#fff", color: on ? "#fff" : INK, borderLeft: i ? `1px solid ${INK}` : 0, "& svg": { fontSize: 24, flexShrink: 0 }, "&:focus-visible": { outline: `2px solid ${RED}`, outlineOffset: -4 } }}>
                {t.rec && !t.disabled && <Box sx={{ position: "absolute", top: -12, left: 12, bgcolor: RED, color: "#fff", px: "10px", fontFamily: MANROPE, fontWeight: 700, fontSize: 11, lineHeight: "20px" }}>Recommended</Box>}
                {t.icon}
                <Box>
                  <Box sx={{ ...b14, fontWeight: 800, fontSize: 15, lineHeight: "20px" }}>{t.t}</Box>
                  <Box sx={{ ...b14, fontSize: 13, lineHeight: "18px", opacity: on ? 0.85 : 1, color: on ? "#fff" : MUTED }}>{t.s}</Box>
                </Box>
              </Box>
            );
          })}
        </Box>

        {mode === "near" && others.length > 0 && (
          <Box sx={{ mt: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {others.map((c) => (
              <Box key={c.id} component="button" type="button" aria-pressed={c.id === p.cityId} onClick={() => p.onCity(c.id)} sx={{ all: "unset", cursor: "pointer", boxSizing: "border-box", height: 32, px: "12px", display: "inline-flex", alignItems: "center", border: "1px solid", borderColor: c.id === p.cityId ? INK : "#D0D0D0", bgcolor: c.id === p.cityId ? INK : "#fff", color: c.id === p.cityId ? "#fff" : INK, ...b14, fontWeight: 600, fontSize: 13 }}>{c.short}</Box>
            ))}
          </Box>
        )}

        {p.cityId && (
          <Box sx={{ mt: "16px", display: "flex", gap: "12px", alignItems: "flex-start", ...b14, fontSize: 15, lineHeight: "22px", "& svg": { fontSize: 24, flexShrink: 0 } }}>
            <AirlineSeatReclineNormalOutlinedIcon />
            <Box>
              {mode === "base"
                ? <>Joining and leaving at <b>{base?.short || "the tour start"}</b>, the main tour group.</>
                : <>Pickup at <b>{p.partner || "your LocalStart Lounge"}</b>, your LocalStart Lounge in {p.cityName}. Drop back at the same door.</>}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: "16px", borderTop: `1px solid ${LINE}` }}>
          {!p.cityId && <Box sx={{ py: "28px", ...b14, color: MUTED }}>Choose where you are leaving from to see its dates.</Box>}
          {p.cityId && p.departures.length === 0 && <Box sx={{ py: "28px", ...b14, color: MUTED }}>No dates are open from here yet. Use the form below to ask for one.</Box>}
          {p.departures.map((d) => {
            const dt = date(d.startDate);
            const on = sel?._id === d._id;
            const full = d.available <= 0;
            const price = Math.round(d.price * (1 - (d.discountPercentage || 0) / 100));
            const urgent = d.available <= 3;
            return (
              <Box key={d._id} component="button" type="button" disabled={full} aria-pressed={on} onClick={() => p.onSelect(d)} sx={{ all: "unset", boxSizing: "border-box", width: "100%", minHeight: 85, display: "flex", alignItems: "center", gap: "20px", px: "16px", py: "14px", cursor: full ? "not-allowed" : "pointer", opacity: full ? 0.5 : 1, bgcolor: on ? "#F6F6F6" : "#fff", borderBottom: `1px solid ${on ? RED : LINE}`, borderTop: on ? `1px solid ${RED}` : 0, borderLeft: `3px solid ${on ? RED : "transparent"}`, "&:focus-visible": { outline: `2px solid ${RED}`, outlineOffset: -2 } }}>
                <Box sx={{ width: 22, height: 22, borderRadius: "11px", border: `2px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <Box sx={{ width: 10, height: 10, borderRadius: "5px", bgcolor: INK }} />}</Box>
                <Box sx={{ width: 84, flexShrink: 0 }}>
                  <Box sx={{ fontFamily: BALOO, fontWeight: 500, fontSize: 36, lineHeight: "38px", letterSpacing: "-0.03em" }}>{dt.d}</Box>
                  <Box sx={{ ...b14, fontWeight: 700, fontSize: 13, lineHeight: "16px" }}>{dt.m}</Box>
                  <Box sx={{ ...b14, fontSize: 13, lineHeight: "16px", color: MUTED }}>{dt.w}</Box>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "8px", ...b14, fontWeight: 800, fontSize: 15 }}>
                    <Box component="span" sx={{ width: 7, height: 7, borderRadius: "4px", bgcolor: "#1E9E52" }} />
                    {mode === "base" ? "Standard departure" : "Direct hometown pickup"}
                  </Box>
                  <Box sx={{ mt: "6px", ...b14, fontSize: 13, color: urgent ? "#C4260F" : MUTED, fontWeight: urgent ? 700 : 500 }}>
                    {full ? "Sold out" : `${urgent ? "Filling fast · " : ""}${d.available} of ${d.seats} seats left`}
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  {d.discountPercentage > 0 && <Box sx={{ ...b14, fontSize: 13, color: MUTED, textDecoration: "line-through" }}>{inr(d.price)}</Box>}
                  <Box sx={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 20, lineHeight: "26px", color: d.discountPercentage > 0 ? "#C4260F" : INK }}>{inr(price)}</Box>
                  <Box sx={{ ...b14, fontSize: 13, color: MUTED }}>per person</Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ mt: "40px" }}>
        <StepTitle n={2}>Who&apos;s travelling</StepTitle>
        <Box sx={{ boxSizing: "border-box", maxWidth: 232, p: "20px", border: `1px solid ${LINE}` }}>
          <Box sx={{ ...b14, fontWeight: 800, fontSize: 15 }}>Travellers</Box>
          <Box sx={{ mt: "10px", ...b14, fontSize: 13, color: MUTED }}>{sel ? `Up to ${p.max} on this date` : "Pick a date first"}</Box>
          <Box sx={{ mt: "14px", display: "inline-flex", alignItems: "center", border: `1px solid ${INK}`, height: 36 }}>
            <Box component="button" type="button" aria-label="Fewer travellers" disabled={p.travellers <= 1} onClick={() => p.setTravellers(p.travellers - 1)} sx={{ all: "unset", width: 40, textAlign: "center", cursor: "pointer", fontWeight: 700, "&[disabled]": { opacity: 0.35, cursor: "default" } }}>−</Box>
            <Box sx={{ width: 40, textAlign: "center", fontFamily: MANROPE, fontWeight: 700, fontSize: 14 }}>{p.travellers}</Box>
            <Box component="button" type="button" aria-label="More travellers" disabled={!sel || p.travellers >= p.max} onClick={() => p.setTravellers(p.travellers + 1)} sx={{ all: "unset", width: 40, textAlign: "center", cursor: "pointer", fontWeight: 700, "&[disabled]": { opacity: 0.35, cursor: "default" } }}>+</Box>
          </Box>
        </Box>
        <Box sx={{ mt: "16px", display: "flex", gap: "12px", alignItems: "center", ...b14, fontSize: 15, "& svg": { fontSize: 24 } }}>
          <BedOutlinedIcon /> <span><b>{rooms} {rooms === 1 ? "room" : "rooms"}</b>, twin sharing.</span>
        </Box>
        <Box sx={{ mt: "12px", display: "flex", gap: "12px", alignItems: "flex-start", ...b14, fontSize: 15, lineHeight: "22px", "& svg": { fontSize: 24, flexShrink: 0 } }}>
          <GroupsOutlinedIcon />
          <span>No separate senior fare. Travellers over 60 get front seats, lift or ground-floor rooms, and a slower plan at no extra cost.</span>
        </Box>
      </Box>

      <Box sx={{ mt: "40px" }}>
        <StepTitle n={3}>Your price</StepTitle>
        <Box sx={{ border: `1px solid ${INK}`, p: "18px 18px 20px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", pb: "12px", borderBottom: `1px solid ${LINE}`, ...b14, fontWeight: 800, fontSize: 15 }}>
            <span>{sel ? utc(sel.startDate, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "No date picked"}</span>
            <Box component="a" href="#plan" sx={{ color: RED, textDecoration: "underline", fontWeight: 800 }}>{sel ? "Change" : ""}</Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", py: "12px", borderBottom: `1px solid ${LINE}`, ...b14, fontSize: 15 }}>
            <span>{p.travellers} {p.travellers === 1 ? "traveller" : "travellers"} × {inr(p.unit)}</span>
            <Box component="span" sx={{ fontWeight: 800 }}>{inr(p.total)}</Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", pt: "16px", gap: 2 }}>
            <Box>
              <Box sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 20, lineHeight: "26px" }}>Total, all inclusive</Box>
              <Box sx={{ mt: "6px", ...b14, fontSize: 13, color: MUTED }}>Taxes, pickup, hotels, meals and sightseeing. <Box component="a" href="#included" sx={{ color: RED, textDecoration: "none" }}>See everything included</Box></Box>
            </Box>
            <Box sx={{ fontFamily: BALOO, fontWeight: 500, fontSize: 40, lineHeight: "44px", letterSpacing: "-0.03em" }}>{inr(p.total)}</Box>
          </Box>
          {sel && (
            <Box sx={{ mt: "18px", bgcolor: "#EDEDED", p: "14px 16px", display: "grid", gridTemplateColumns: "88px 1fr", rowGap: "6px", ...b14, fontSize: 14 }}>
              <Box sx={{ fontWeight: 800 }}>{inr(p.pay)}</Box><Box>to pay now to hold your seats. The balance is due before departure.</Box>
              <Box sx={{ fontWeight: 800 }}>Cancelling</Box><Box>See the <Box component={Link} href="/help" sx={{ color: RED }}>cancellation rules</Box> for this tour.</Box>
            </Box>
          )}
          <Box component="button" type="button" disabled={!p.canBook} onClick={p.onBook} sx={{ mt: "18px", width: "100%", height: 38, border: 0, cursor: p.canBook ? "pointer" : "not-allowed", bgcolor: RED, color: "#fff", opacity: p.canBook ? 1 : 0.5, fontFamily: MANROPE, fontWeight: 600, fontSize: 13, letterSpacing: "0.28px", textTransform: "uppercase", "&:hover:not([disabled])": { bgcolor: "#C4260F" } }}>
            {p.canBook ? "Book now" : "Pick a date to book"}
          </Box>
          <Box component={Link} href="/help" sx={{ mt: "12px", height: 38, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${INK}`, color: INK, textDecoration: "none", fontFamily: MANROPE, fontWeight: 600, fontSize: 13, letterSpacing: "0.28px", textTransform: "uppercase" }}>Prefer to talk? Ask us</Box>
          <Box sx={{ mt: "16px", display: "grid", rowGap: "10px" }}>
            {[["Choose your date and travellers.", " Seats are shown live, so what you see is what is open."], ["You pay the deposit online", " to EpicJourneys only. Nothing is charged before checkout."], ["Seats are held.", " You get a receipt and your coordinator's number."]].map(([a, b], i) => (
              <Box key={a} sx={{ display: "flex", gap: "10px", alignItems: "center", ...b14, fontSize: 14 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: "10px", border: `1.5px solid ${RED}`, color: RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</Box>
                <span><b>{a}</b>{b}</span>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
