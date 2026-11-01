"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, CircularProgress, Menu, MenuItem } from "@mui/material";
import TourListingCard, { featured, inr } from "@/components/TourListingCard";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";
const WISH_KEY = "ej_wishlist";

const DURATIONS = [
  { label: "1–3 days", test: (d: number) => d <= 3 },
  { label: "4–6 days", test: (d: number) => d >= 4 && d <= 6 },
  { label: "7+ days", test: (d: number) => d >= 7 },
];
const BUDGETS = [
  { label: "Under ₹10,000", test: (p: number) => p < 10000 },
  { label: "₹10,000 – ₹15,000", test: (p: number) => p >= 10000 && p <= 15000 },
  { label: "Above ₹15,000", test: (p: number) => p > 15000 },
];
const SORTS = ["Nearest", "Price: low to high", "Price: high to low", "Soonest departure"];

const monthKey = (d: string | Date) => new Date(d).toISOString().slice(0, 7);
const monthLabel = (k: string) => new Date(`${k}-15`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
const targetOf = (t: any) => t.targetCity || t.destinationId?.name || "";

interface City { id: string; name: string; state: string; lat?: number; lng?: number }
interface Loc { lat: number; lng: number }

const ctl = { boxSizing: "border-box", height: 40, border: "1px solid #D0D0D0", bgcolor: "#fff", display: "inline-flex", alignItems: "center", gap: "10px", px: "15px", cursor: "pointer", fontFamily: MANROPE, fontSize: 14, color: "#0C0C0C", whiteSpace: "nowrap", "&:hover": { borderColor: "#0C0C0C" } } as const;
const Chevron = () => <Box component="img" src="/images/home/ico-chevron.svg" alt="" sx={{ width: 10, height: 7 }} />;

function FilterMenu({ label, value, options, onChange, width }: { label: string; value: string | null; options: string[]; onChange: (v: string | null) => void; width?: number }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  return (
    <>
      <Box component="button" type="button" onClick={(e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)} sx={{ ...ctl, fontWeight: 600, width: { md: width }, justifyContent: "space-between", borderColor: value ? "#0C0C0C" : "#D0D0D0" }}>
        <span>{value || label}</span>
        <Chevron />
      </Box>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 0, border: "1px solid #D0D0D0", boxShadow: "0 8px 24px rgba(12,12,12,0.12)", minWidth: 180, maxHeight: 320 } } }}>
        <MenuItem onClick={() => { onChange(null); setAnchor(null); }} sx={{ fontFamily: MANROPE, fontSize: 14, color: "#6B6B6B" }}>Any</MenuItem>
        {options.map((o) => (
          <MenuItem key={o} selected={o === value} onClick={() => { onChange(o); setAnchor(null); }} sx={{ fontFamily: MANROPE, fontSize: 14, fontWeight: o === value ? 700 : 500 }}>{o}</MenuItem>
        ))}
      </Menu>
    </>
  );
}

interface ToursSectionProps {
  tours: any[];
  allTours: any[];
  loading: boolean;
  error: string | null;
  cityName: string;
  fromCity: City | null;
  userLocation: Loc | null;
  onFromChange: (c: City | null) => void;
  onUseMyLocation: () => void;
  onRetry: () => void;
}

export default function ToursSection({ tours, allTours, loading, error, cityName, fromCity, userLocation, onFromChange, onUseMyLocation, onRetry }: ToursSectionProps) {
  const [dest, setDest] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [deals, setDeals] = useState(false);
  const [sort, setSort] = useState("Nearest");
  const [fromAnchor, setFromAnchor] = useState<null | HTMLElement>(null);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);
  const [wish, setWish] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WISH_KEY) || "[]");
      if (Array.isArray(saved)) setWish(saved);
    } catch {}
  }, []);
  const toggleWish = (id: string) => {
    const next = wish.includes(id) ? wish.filter((x) => x !== id) : [...wish, id];
    setWish(next);
    try {
      localStorage.setItem(WISH_KEY, JSON.stringify(next));
    } catch {}
  };

  // Start cities: every city a dated departure leaves from.
  const fromOptions = useMemo<City[]>(() => {
    const map = new Map<string, City>();
    for (const t of allTours) for (const d of t.departures || []) {
      const c = d.cityId;
      if (c?._id && !map.has(c._id)) map.set(c._id, { id: c._id, name: c.name, state: c.state, lat: c.coordinates?.lat, lng: c.coordinates?.lng });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allTours]);

  const destOptions = useMemo(() => [...new Set(tours.map(targetOf).filter(Boolean))].sort(), [tours]);
  const styleOptions = useMemo(() => [...new Set(tours.flatMap((t) => t.travelStyles || []))].sort(), [tours]);
  const monthOptions = useMemo(() => {
    const now = Date.now();
    return [...new Set(tours.flatMap((t) => (t.departures || []).filter((d: any) => new Date(d.startDate).getTime() > now).map((d: any) => monthKey(d.startDate))))].sort();
  }, [tours]);

  const active = Boolean(dest || style || duration || budget || month || deals);
  const clear = () => { setDest(null); setStyle(null); setDuration(null); setBudget(null); setMonth(null); setDeals(false); };

  const rows = useMemo(() => {
    const now = Date.now();
    const list = tours
      .filter((t) => (!dest || targetOf(t) === dest) && (!style || (t.travelStyles || []).includes(style)))
      .filter((t) => !duration || DURATIONS.find((d) => d.label === duration)?.test(t.durationDays))
      .filter((t) => !budget || BUDGETS.find((b) => b.label === budget)?.test(t.priceInr))
      .filter((t) => !month || (t.departures || []).some((d: any) => new Date(d.startDate).getTime() > now && monthKey(d.startDate) === month))
      .filter((t) => !deals || t.discountPercentage > 0 || t.specialOffer)
      .map((t) => ({ t, dep: featured(t, fromCity?.id, userLocation) }));
    const soon = (r: any) => (r.dep ? +new Date(r.dep.startDate) : Infinity);
    switch (sort) {
      case "Price: low to high": list.sort((a, b) => a.t.priceInr - b.t.priceInr); break;
      case "Price: high to low": list.sort((a, b) => b.t.priceInr - a.t.priceInr); break;
      case "Soonest departure": list.sort((a, b) => soon(a) - soon(b)); break;
      default: list.sort((a, b) => (a.t.distanceKm ?? Infinity) - (b.t.distanceKm ?? Infinity));
    }
    return list;
  }, [tours, dest, style, duration, budget, month, deals, sort, fromCity, userLocation]);

  return (
    <Box component="section" id="tour-results" sx={{ bgcolor: "#fff", pt: "62px", pb: "64px" }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Box sx={{ width: 14, height: 14, borderRadius: "7px", bgcolor: "#EA321E", flexShrink: 0 }} />
          <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "14.4px", letterSpacing: "1.7px", color: "#0C0C0C" }}>POPULAR TOURS NEAR YOU</Box>
        </Box>
        <Box component="h2" sx={{ m: 0, mt: "2px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 34, md: 46 }, lineHeight: "46.9px", letterSpacing: "-0.035em", color: "#0C0C0C" }}>
          Popular tours from <Box component="span" sx={{ color: "#EA321E" }}>{cityName}</Box>
        </Box>
        <Box sx={{ mt: "29px", maxWidth: 560, fontFamily: MANROPE, fontWeight: 500, fontSize: 17, lineHeight: "27.2px", color: "#4A4A4A" }}>
          Tours closest to {cityName} first. Filter by destination, type of trip, length, budget or month.
        </Box>

        {/* Filter bar */}
        <Box sx={{ mt: "46px", py: "18px", pt: "19px", borderTop: "1px solid #E1E1E1", borderBottom: "1px solid #E1E1E1", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <Box component="button" type="button" onClick={(e: React.MouseEvent<HTMLElement>) => setFromAnchor(e.currentTarget)} sx={{ ...ctl, gap: "6px", pl: "15px", pr: "12px", fontWeight: 600 }}>
            <Box component="img" src="/images/home/ico-pin.svg" alt="" sx={{ width: 16, height: 16, mr: "0px" }} />
            <Box component="span" sx={{ fontWeight: 500, color: "#6B6B6B" }}>From</Box>
            <span>{fromCity?.name || cityName}</span>
            <Box sx={{ ml: "4px", display: "flex" }}><Chevron /></Box>
          </Box>
          <Menu anchorEl={fromAnchor} open={Boolean(fromAnchor)} onClose={() => setFromAnchor(null)} slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 0, border: "1px solid #D0D0D0", boxShadow: "0 8px 24px rgba(12,12,12,0.12)", minWidth: 200, maxHeight: 320 } } }}>
            {fromOptions.length === 0 && <MenuItem disabled sx={{ fontFamily: MANROPE, fontSize: 14 }}>No cities available</MenuItem>}
            {fromOptions.map((c) => (
              <MenuItem key={c.id} selected={c.id === fromCity?.id} onClick={() => { onFromChange(c); setFromAnchor(null); }} sx={{ fontFamily: MANROPE, fontSize: 14, fontWeight: c.id === fromCity?.id ? 700 : 500 }}>
                {c.name}{c.state ? `, ${c.state}` : ""}
              </MenuItem>
            ))}
          </Menu>
          <Box component="button" type="button" onClick={onUseMyLocation} sx={{ all: "unset", cursor: "pointer", px: "8px", fontFamily: MANROPE, fontWeight: 600, fontSize: 13, lineHeight: "16.3px", color: "#6B6B6B", "&:hover": { color: "#0C0C0C", textDecoration: "underline" }, "&:focus-visible": { outline: "2px solid #0C0C0C" } }}>
            Use my location
          </Box>
          <Box sx={{ display: { xs: "none", md: "block" }, width: "1px", height: 24, bgcolor: "#E1E1E1", mx: "7px" }} />
          <FilterMenu label="Destination" value={dest} options={destOptions} onChange={setDest} width={130} />
          <FilterMenu label="Trip type" value={style} options={styleOptions} onChange={setStyle} width={110} />
          <FilterMenu label="Duration" value={duration} options={DURATIONS.map((d) => d.label)} onChange={setDuration} width={110} />
          <FilterMenu label="Budget" value={budget} options={BUDGETS.map((b) => b.label)} onChange={setBudget} width={100} />
          <FilterMenu label="Month" value={month ? monthLabel(month) : null} options={monthOptions.map(monthLabel)} onChange={(v) => setMonth(v ? monthOptions.find((k) => monthLabel(k) === v) || null : null)} width={92} />
          <Box component="button" type="button" aria-pressed={deals} onClick={() => setDeals((d) => !d)} sx={{ ...ctl, fontWeight: 600, bgcolor: deals ? "#0C0C0C" : "#fff", color: deals ? "#fff" : "#0C0C0C", borderColor: deals ? "#0C0C0C" : "#D0D0D0" }}>Deals</Box>
          <Box component="button" type="button" onClick={clear} sx={{ all: "unset", cursor: "pointer", px: "4px", fontFamily: MANROPE, fontWeight: 600, fontSize: 13, lineHeight: "16.3px", color: active ? "#0C0C0C" : "#6B6B6B", "&:hover": { textDecoration: "underline" }, "&:focus-visible": { outline: "2px solid #0C0C0C" } }}>
            Clear
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 14, lineHeight: "17.5px", color: "#6B6B6B", mr: "6px" }}>{rows.length} of {tours.length} tours</Box>
          <Box component="button" type="button" onClick={(e: React.MouseEvent<HTMLElement>) => setSortAnchor(e.currentTarget)} sx={{ ...ctl, width: { md: 136 }, justifyContent: "space-between", fontWeight: 600 }}>
            <Box component="span"><Box component="span" sx={{ fontWeight: 500, color: "#6B6B6B", mr: "6px" }}>Sort</Box>{sort.split(":")[0] === "Price" ? "Price" : sort === "Soonest departure" ? "Soonest" : sort}</Box>
            <Chevron />
          </Box>
          <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)} slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 0, border: "1px solid #D0D0D0", boxShadow: "0 8px 24px rgba(12,12,12,0.12)", minWidth: 200 } } }}>
            {SORTS.map((s) => (
              <MenuItem key={s} selected={s === sort} onClick={() => { setSort(s); setSortAnchor(null); }} sx={{ fontFamily: MANROPE, fontSize: 14, fontWeight: s === sort ? 700 : 500 }}>{s}</MenuItem>
            ))}
          </Menu>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={32} sx={{ color: "#0C0C0C" }} />
          </Box>
        )}
        {error && (
          <Box sx={{ mt: 4, p: 2, bgcolor: "#FDEAE7", color: "#C4260F", fontFamily: MANROPE, fontWeight: 600, fontSize: 14 }}>
            {error}{" "}
            <Box component="button" type="button" onClick={onRetry} sx={{ all: "unset", cursor: "pointer", textDecoration: "underline" }}>Try again</Box>
          </Box>
        )}

        {!loading && rows.length === 0 && !error && (
          <Box sx={{ mt: 4, py: 8, textAlign: "center", border: "1px dashed #D0D0D0" }}>
            <Box sx={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 17, color: "#0C0C0C" }}>No tours match these filters</Box>
            <Box sx={{ mt: 1, fontFamily: MANROPE, fontSize: 14, color: "#6B6B6B" }}>Try removing a filter to see more tours.</Box>
            {active && <Box component="button" type="button" onClick={clear} sx={{ mt: 2.5, height: 40, px: 3, border: 0, bgcolor: "#0C0C0C", color: "#fff", cursor: "pointer", fontFamily: MANROPE, fontWeight: 700, fontSize: 12, letterSpacing: "0.7px" }}>CLEAR FILTERS</Box>}
          </Box>
        )}

        {!loading && rows.length > 0 && (
          <Box sx={{ mt: "32px", display: "grid", columnGap: "20px", rowGap: "34px", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
            {rows.map(({ t, dep }) => (
              <TourListingCard
                key={t._id}
                tour={t}
                dep={dep}
                href={`/tours/${t.slug || t._id}${fromCity?.id ? `?from=${fromCity.id}` : ""}`}
                saved={wish.includes(t._id)}
                onToggleSave={() => toggleWish(t._id)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
