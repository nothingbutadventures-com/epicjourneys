"use client";

import React, { useMemo, useState } from "react";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { discountedUnitPrice, inr } from "@/lib/pricing";

export interface CalendarDeparture {
  _id: string;
  startDate: string;
  endDate: string;
  price: number;
  discountPercentage: number;
  available: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const key = (iso: string) => String(iso).slice(0, 10); // date-only semantics, timezone safe
const keyOf = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const monthLabel = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function Month({
  year,
  month,
  startMap,
  selected,
  travellers,
  onSelect,
}: {
  year: number;
  month: number;
  startMap: Map<string, CalendarDeparture[]>;
  selected: CalendarDeparture | null;
  travellers: number;
  onSelect: (d: CalendarDeparture) => void;
}) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const selStart = selected ? key(selected.startDate) : "";
  const selEnd = selected ? key(selected.endDate) : "";

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ textAlign: "center", fontWeight: 800, mb: 1.5 }}>{monthLabel(year, month)}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
        {WEEKDAYS.map((w) => (
          <Typography key={w} sx={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", pb: 0.5 }}>
            {w}
          </Typography>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <Box key={`e${i}`} />;
          const k = keyOf(year, month, d);
          const deps = startMap.get(k);
          const dep = deps?.find((x) => x.available >= travellers) || deps?.[0];
          const soldOut = dep ? dep.available < travellers : false;
          const isSelected = k === selStart;
          const inRange = Boolean(selected) && k > selStart && k <= selEnd;
          const isTourDate = Boolean(dep);
          return (
            <Box key={k} sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
              {inRange && !isSelected && <Box sx={{ position: "absolute", inset: "4px 0", bgcolor: "#FFF0D1", zIndex: 0 }} />}
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box
                  role={isTourDate ? "button" : undefined}
                  aria-label={isTourDate ? `${fmt(k)}${soldOut ? " (not enough seats)" : ""}` : undefined}
                  aria-pressed={isSelected}
                  tabIndex={isTourDate && !soldOut ? 0 : -1}
                  onClick={() => dep && !soldOut && onSelect(dep)}
                  onKeyDown={(e) => dep && !soldOut && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(dep))}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: isTourDate ? 800 : 500,
                    outline: "none",
                    cursor: isTourDate && !soldOut ? "pointer" : "default",
                    color: isSelected ? "#FF9900" : soldOut ? "#cbd5e1" : isTourDate ? "#0f172a" : inRange ? "#8A5200" : "#94a3b8",
                    bgcolor: isSelected ? "#0f172a" : isTourDate && !soldOut ? "#FF9900" : "transparent",
                    textDecoration: soldOut ? "line-through" : "none",
                    border: isTourDate && !isSelected && !soldOut ? "1px solid #E68A00" : "1px solid transparent",
                    boxShadow: "none",
                    "&:focus-visible": { boxShadow: "0 0 0 3px rgba(15,23,42,0.25)" },
                  }}
                >
                  {d}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/**
 * Two-month calendar of this tour's dates from one city, plus the same dates as a list below it.
 * Picking a date calls onSelect with that departure.
 */
export default function DepartureCalendar({
  departures,
  selectedId,
  travellers,
  cityName,
  onSelect,
}: {
  departures: CalendarDeparture[];
  selectedId: string;
  travellers: number;
  cityName: string;
  onSelect: (d: CalendarDeparture) => void;
}) {
  const selected = departures.find((d) => d._id === selectedId) || null;
  const initial = selected ? key(selected.startDate) : departures[0] ? key(departures[0].startDate) : keyOf(new Date().getFullYear(), new Date().getMonth(), 1);
  const [base, setBase] = useState({ y: Number(initial.slice(0, 4)), m: Number(initial.slice(5, 7)) - 1 });

  const startMap = useMemo(() => {
    const map = new Map<string, CalendarDeparture[]>();
    for (const d of departures) map.set(key(d.startDate), [...(map.get(key(d.startDate)) || []), d]);
    return map;
  }, [departures]);

  const shift = (delta: number) =>
    setBase((b) => {
      const t = b.y * 12 + b.m + delta;
      return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
    });
  const second = { y: base.m === 11 ? base.y + 1 : base.y, m: (base.m + 1) % 12 };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.015em", lineHeight: 1.2 }}>Your travel date</Typography>
        <Typography sx={{ color: "#64748b", fontSize: "0.9rem", mt: 0.5 }}>Tour dates from {cityName} are highlighted — tap one to switch.</Typography>
      </Box>

      <Box sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: "4px", border: "1px solid #E2E2E2", bgcolor: "#fff" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
          <IconButton aria-label="Previous month" onClick={() => shift(-1)} size="small" sx={{ border: "1px solid #E2E2E2" }}><ChevronLeftRoundedIcon /></IconButton>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: "4px", bgcolor: "#FF9900", border: "1px solid #E68A00" }} />Tour date</Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: "4px", bgcolor: "#43149D" }} />Selected</Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: "4px", bgcolor: "#FFF0D1" }} />Trip days</Box>
          </Box>
          <IconButton aria-label="Next month" onClick={() => shift(1)} size="small" sx={{ border: "1px solid #E2E2E2" }}><ChevronRightRoundedIcon /></IconButton>
        </Box>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 3, md: 4 }, mt: 1.5 }}>
          <Month year={base.y} month={base.m} startMap={startMap} selected={selected} travellers={travellers} onSelect={onSelect} />
          <Month year={second.y} month={second.m} startMap={startMap} selected={selected} travellers={travellers} onSelect={onSelect} />
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 800, mt: 3, mb: 1.5 }}>All dates from {cityName}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
        {departures.map((d) => {
          const isSel = d._id === selectedId;
          const notEnough = d.available < travellers;
          return (
            <Box key={d._id}>
              <Box
                role="radio"
                aria-checked={isSel}
                tabIndex={notEnough ? -1 : 0}
                onClick={() => !notEnough && onSelect(d)}
                onKeyDown={(e) => !notEnough && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(d))}
                sx={{
                  position: "relative",
                  p: 1.75,
                  borderRadius: "4px",
                  border: "2px solid",
                  outline: "none",
                  borderColor: isSel ? "#FF9900" : "#E2E2E2",
                  bgcolor: isSel ? "#FFF6E5" : notEnough ? "#FDF9EC" : "#fff",
                  opacity: notEnough ? 0.6 : 1,
                  cursor: notEnough ? "not-allowed" : "pointer",
                  transition: "all .2s",
                }}
              >
                {isSel && (
                  <Box sx={{ position: "absolute", top: -9, right: -9, width: 20, height: 20, borderRadius: "50%", bgcolor: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckRoundedIcon sx={{ fontSize: 14 }} />
                  </Box>
                )}
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.92rem" }}>{fmt(d.startDate)} – {fmt(d.endDate)}</Typography>
                  {d.discountPercentage > 0 && (
                    <Chip icon={<LocalOfferRoundedIcon sx={{ fontSize: "12px !important", color: "#fff !important" }} />} label={`${d.discountPercentage}%`} size="small" sx={{ height: 20, bgcolor: "#ef4444", color: "#fff", fontWeight: 800 }} />
                  )}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 0.75 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: notEnough ? "#dc2626" : d.available <= 3 ? "#dc2626" : "#059669" }}>
                    {d.available <= 0 ? "Sold out" : notEnough ? `Only ${d.available} seat${d.available === 1 ? "" : "s"} left` : `${d.available} seat${d.available === 1 ? "" : "s"} left`}
                  </Typography>
                  <Typography sx={{ fontWeight: 800 }}>
                    {inr(discountedUnitPrice(d.price, d.discountPercentage))}
                    <Box component="span" sx={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 500 }}> /person</Box>
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
