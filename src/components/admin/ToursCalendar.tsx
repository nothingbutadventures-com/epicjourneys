"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";

const DAY = 86400000;
const COLS = 29; // four weeks plus the following Monday, like a planning board
const DAY_W = 46; // minimum width of one day column
const LOW_SEATS = 3;

interface Ev {
  id: string; tourId: string; title: string; slug: string; coverImage?: string; state: string; targetCity: string; travelStyles: string[]; tourActive: boolean;
  kind: "base" | "launched"; cityName: string; partnerName: string; start: string; end: string;
  seats: number; booked: number; available: number; bookings: number;
  price: number; storedDiscount: number; discount: number; specialOffer: { name: string; percentage: number } | null; unitPrice: number;
  revenue: number; paid: number;
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(`${s}T00:00:00Z`);
const addDays = (s: string, n: number) => ymd(new Date(+parse(s) + n * DAY));
const diff = (a: string, b: string) => Math.round((+parse(b) - +parse(a)) / DAY);
const mondayOf = (s: string) => addDays(s, -((parse(s).getUTCDay() + 6) % 7));
const fmt = (s: string) => parse(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtYear = (s: string) => parse(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtLong = (s: string) => parse(s).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};

type Status = "open" | "low" | "sold";
const statusOf = (e: Ev): Status => (e.available <= 0 ? "sold" : e.available <= LOW_SEATS ? "low" : "open");
const STATUS_META: Record<Status, { label: string; bg: string; fg: string; fill: string }> = {
  open: { label: "Seats available", bg: "#ecfdf5", fg: "#047857", fill: "linear-gradient(135deg, #6a6cf0 0%, #4f52e3 100%)" },
  low: { label: "Filling fast", bg: "#fff7ed", fg: "#c2410c", fill: "linear-gradient(135deg, #f0a43a 0%, #d97c0a 100%)" },
  sold: { label: "Sold out", bg: "#fef2f2", fg: "#dc2626", fill: "linear-gradient(135deg, #ee5a73 0%, #d62f4b 100%)" },
};

interface Row { ev: Ev; from: number; to: number; before: boolean; after: boolean }

/** Packs departures into rows so bars in the same row never overlap. */
function pack(days: string[], events: Ev[]): Row[][] {
  const first = days[0];
  const last = days[days.length - 1];
  const items: Row[] = events
    .filter((e) => e.start <= last && e.end >= first)
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title))
    .map((ev) => ({ ev, from: Math.max(0, diff(first, ev.start)), to: Math.min(days.length - 1, diff(first, ev.end)), before: ev.start < first, after: ev.end > last }));
  const rows: Row[][] = [];
  const ends: number[] = [];
  for (const it of items) {
    let r = ends.findIndex((end) => end < it.from);
    if (r === -1) r = ends.length;
    ends[r] = it.to;
    (rows[r] = rows[r] || []).push(it);
  }
  return rows;
}

const DEPARTURE_FILTERS: [string, string][] = [
  ["all", "All Departures"],
  ["base", "Joining / Leaving"],
  ["launched", "Partner city"],
  ["open", "Available spots"],
  ["low", "Filling fast"],
  ["sold", "Sold out"],
];

const fieldSx = { bgcolor: "#fff", borderRadius: "6px", fontSize: "0.82rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e2e8f0", borderRadius: "6px" }, "& .MuiSelect-select, & .MuiInputBase-input": { fontWeight: 500, fontSize: "0.82rem" } };

export default function ToursCalendar() {
  const today = ymd(new Date());
  const [view, setView] = useState<"timeline" | "agenda">("timeline");
  const [start, setStart] = useState(mondayOf(today));
  const [events, setEvents] = useState<Ev[]>([]);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tourId, setTourId] = useState("all");
  const [destination, setDestination] = useState("all");
  const [style, setStyle] = useState("all");
  const [departure, setDeparture] = useState("all");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Ev | null>(null);
  const reqId = useRef(0);

  const days = useMemo(() => Array.from({ length: COLS }, (_, i) => addDays(start, i)), [start]);
  const end = days[COLS - 1];

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/tours-calendar?from=${start}&to=${end}`, { headers: authHeaders() }).then((r) => r.json());
      if (id !== reqId.current) return; // a newer request replaced this one
      if (!res.success) throw new Error(res.error || "Couldn't load the calendar");
      setEvents(res.data || []);
      if (res.tours) setTours(res.tours);
      setError(null);
    } catch (e: any) {
      if (id === reqId.current) setError(e.message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [start, end]);
  useEffect(() => {
    load();
  }, [load]);

  const options = useMemo(() => {
    const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();
    return { destinations: uniq(events.map((e) => e.targetCity || e.state)), styles: uniq(events.flatMap((e) => e.travelStyles)) };
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (tourId !== "all" && e.tourId !== tourId) return false;
      if (destination !== "all" && (e.targetCity || e.state) !== destination) return false;
      if (style !== "all" && !e.travelStyles.includes(style)) return false;
      if (departure === "base" || departure === "launched") {
        if (e.kind !== departure) return false;
      } else if (departure !== "all" && statusOf(e) !== departure) return false;
      if (q && !`${e.title} ${e.cityName} ${e.partnerName} ${e.state} ${e.targetCity}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, tourId, destination, style, departure, search]);

  const filtersOn = tourId !== "all" || destination !== "all" || style !== "all" || departure !== "all" || search !== "";
  const reset = () => {
    setTourId("all");
    setDestination("all");
    setStyle("all");
    setDeparture("all");
    setSearch("");
  };

  const period = useMemo(() => {
    const seats = filtered.reduce((n, e) => n + e.seats, 0);
    const booked = filtered.reduce((n, e) => n + e.booked, 0);
    return { seats, booked, fill: seats ? Math.round((booked / seats) * 100) : 0, revenue: filtered.reduce((n, e) => n + e.revenue, 0), sold: filtered.filter((e) => statusOf(e) === "sold").length, low: filtered.filter((e) => statusOf(e) === "low").length, tours: new Set(filtered.map((e) => e.tourId)).size };
  }, [filtered]);

  const rows = useMemo(() => pack(days, filtered), [days, filtered]);
  const single = tourId !== "all";
  const ROW_H = single ? 54 : 56;
  const BAR_H = single ? 40 : 44;

  const stat = (label: string, value: React.ReactNode, sub: string, icon: React.ReactNode, c: string, bg: string) => (
    <Grid size={{ xs: 6, md: 3 }}>
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "0.66rem", letterSpacing: "0.04em" }}>{label}</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: "1.2rem", color: "#0f172a", lineHeight: 1.3 }}>{value}</Typography>
          <Typography sx={{ color: "#64748b", fontWeight: 500, fontSize: "0.68rem" }}>{sub}</Typography>
        </Box>
        <Box sx={{ width: 34, height: 34, borderRadius: "6px", bgcolor: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center", "& svg": { fontSize: 20 } }}>{icon}</Box>
      </Paper>
    </Grid>
  );

  const timeline = (
    <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", overflow: "hidden", bgcolor: "#fff" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: COLS * DAY_W }}>
          {/* Day header */}
          <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, borderBottom: "1px solid #e8ecf2", bgcolor: "#fafbfc" }}>
            {days.map((d, i) => {
              const wd = parse(d).getUTCDay();
              const weekend = wd === 0 || wd === 6;
              const isToday = d === today;
              const showMonth = i === 0 || d.endsWith("-01");
              return (
                <Box key={d} sx={{ py: 1, textAlign: "center", borderRight: i < COLS - 1 ? "1px solid #eef1f5" : 0, bgcolor: isToday ? "#f1f4ff" : "transparent" }}>
                  <Typography sx={{ fontSize: "0.58rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", height: 11, lineHeight: "11px" }}>{showMonth ? parse(d).toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }) : ""}</Typography>
                  <Typography sx={{ fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.04em", color: weekend ? "#ef4444" : "#64748b", textTransform: "uppercase" }}>
                    {parse(d).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).slice(0, 2)}
                  </Typography>
                  <Box sx={{ mx: "auto", mt: 0.25, width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: isToday ? "2px solid #4f52e3" : "2px solid transparent", color: isToday ? "#4f52e3" : "#0f172a" }}>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1 }}>{Number(d.slice(8))}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Rows of departure bars */}
          <Box sx={{ position: "relative" }}>
            <Box sx={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, pointerEvents: "none" }}>
              {days.map((d, i) => {
                const wd = parse(d).getUTCDay();
                return <Box key={d} sx={{ borderRight: i < COLS - 1 ? "1px solid #f0f3f7" : 0, bgcolor: d === today ? "#f7f8ff" : wd === 0 || wd === 6 ? "#fcfcfd" : "transparent" }} />;
              })}
            </Box>
            {rows.length === 0 ? (
              <Box sx={{ position: "relative", py: 9, textAlign: "center", color: "#94a3b8" }}>
                <Typography sx={{ fontWeight: 700 }}>No departures between {fmt(start)} and {fmtYear(end)}</Typography>
                <Typography sx={{ fontSize: "0.82rem" }}>{filtersOn ? "Try clearing the filters, or move to another period." : "Use the arrows to move to another period."}</Typography>
              </Box>
            ) : (
              rows.map((row, ri) => (
                <Box key={ri} sx={{ position: "relative", height: ROW_H, borderBottom: ri < rows.length - 1 ? "1px solid #f0f3f7" : 0 }}>
                  {row.map((r) => {
                    const e = r.ev;
                    const st = statusOf(e);
                    const meta = STATUS_META[st];
                    const dur = diff(e.start, e.end) + 1;
                    return (
                      <Tooltip
                        key={e.id}
                        arrow
                        placement="top"
                        title={
                          <Box>
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 800 }}>{e.title}</Typography>
                            <Typography sx={{ fontSize: "0.72rem" }}>{fmtYear(e.start)} – {fmtYear(e.end)} · {e.kind === "base" ? "Joining / Leaving" : e.cityName}</Typography>
                            <Typography sx={{ fontSize: "0.72rem" }}>{e.booked}/{e.seats} travellers · {meta.label}{e.discount ? ` · ${e.discount}% off` : ""}</Typography>
                          </Box>
                        }
                      >
                        <Box
                          onClick={() => setActive(e)}
                          sx={{
                            position: "absolute",
                            top: (ROW_H - BAR_H) / 2,
                            height: BAR_H,
                            left: `calc(${(r.from / COLS) * 100}% + ${r.before ? 0 : 4}px)`,
                            width: `calc(${((r.to - r.from + 1) / COLS) * 100}% - ${(r.before ? 0 : 4) + (r.after ? 0 : 4)}px)`,
                            px: 1.1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            overflow: "hidden",
                            cursor: "pointer",
                            color: "#fff",
                            background: meta.fill,
                            opacity: e.tourActive ? 1 : 0.6,
                            borderRadius: `${r.before ? 0 : 6}px ${r.after ? 0 : 6}px ${r.after ? 0 : 6}px ${r.before ? 0 : 6}px`,
                            boxShadow: "0 2px 6px rgba(79,82,227,0.16)",
                            transition: "transform .12s, box-shadow .12s",
                            "&:hover": { transform: "translateY(-1px)", boxShadow: "0 6px 16px rgba(15,23,42,0.25)" },
                          }}
                        >
                          {!single && <Typography noWrap sx={{ fontSize: "0.74rem", fontWeight: 700, lineHeight: 1.25 }}>{e.title}</Typography>}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, whiteSpace: "nowrap" }}>
                            <Typography noWrap sx={{ fontSize: "0.72rem", fontWeight: single ? 700 : 500, opacity: single ? 1 : 0.92, minWidth: 0 }}>
                              {fmtYear(e.start)} – {fmtYear(e.end)}
                            </Typography>
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 0.9, py: 0.15, borderRadius: "6px", bgcolor: "rgba(255,255,255,0.22)", flexShrink: 0 }}>
                              <GroupsRoundedIcon sx={{ fontSize: 12 }} />
                              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700 }}>{e.booked}/{e.seats}</Typography>
                            </Box>
                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 500, flexShrink: 0 }}>• {dur}D</Typography>
                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, flexShrink: 0 }}>• {inr(e.unitPrice)}</Typography>
                            {e.kind === "launched" && !single && <Typography noWrap sx={{ fontSize: "0.72rem", opacity: 0.85 }}>• {e.cityName}</Typography>}
                          </Box>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );

  const agenda = (
    <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
      <TableContainer>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>{["Tour", "Dates", "Start from", "Travellers", "Price", "Bookings", "Status"].map((h) => <TableCell key={h} sx={{ fontWeight: 700, color: "#475569", py: 1.25 }}>{h}</TableCell>)}</TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((e) => {
              const st = statusOf(e);
              return (
                <TableRow key={e.id} hover onClick={() => setActive(e)} sx={{ cursor: "pointer" }}>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.84rem", color: "#0f172a" }}>{e.title}</Typography>
                    <Typography noWrap sx={{ fontSize: "0.7rem", color: "#64748b" }}>{e.targetCity ? `${e.targetCity}, ` : ""}{e.state}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{fmt(e.start)} – {fmt(e.end)}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{e.kind === "base" ? "Joining / Leaving" : e.cityName}{e.partnerName ? <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>{e.partnerName}</Typography> : null}</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{e.booked} / {e.seats}</Typography>
                    <LinearProgress variant="determinate" value={Math.min(100, e.seats ? (e.booked / e.seats) * 100 : 0)} sx={{ height: 5, borderRadius: 3, bgcolor: "#eef2f7", "& .MuiLinearProgress-bar": { bgcolor: st === "sold" ? "#dc2626" : st === "low" ? "#ea580c" : "#4f52e3" } }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                    {inr(e.unitPrice)}
                    {e.discount > 0 && <Typography component="span" sx={{ ml: 0.5, fontSize: "0.68rem", fontWeight: 800, color: e.specialOffer ? "#c2410c" : "#dc2626" }}>{e.specialOffer ? "⚡" : ""}-{e.discount}%</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{e.bookings}<Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>{inr(e.revenue)}</Typography></TableCell>
                  <TableCell><Chip label={STATUS_META[st].label} size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, borderRadius: "4px", bgcolor: STATUS_META[st].bg, color: STATUS_META[st].fg }} /></TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: "#94a3b8" }}>No departures in this period{filtersOn ? " for these filters" : ""}.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  return (
    <Box sx={{ width: "100%", pb: 6 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: "6px", bgcolor: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>Calendar</Typography>
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>Every tour and departure on one timeline, with live seats and bookings</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} sx={{ bgcolor: "#f8fafc", "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700, px: 1.5, py: 0.4, fontSize: "0.78rem" } }}>
            <ToggleButton value="timeline">Timeline</ToggleButton>
            <ToggleButton value="agenda">Agenda</ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Refresh"><IconButton size="small" onClick={load} sx={{ border: "1px solid #e2e8f0", bgcolor: "#fff", borderRadius: "6px" }}><RefreshRoundedIcon sx={{ fontSize: 18, color: "#475569" }} /></IconButton></Tooltip>
        </Box>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {stat("Departures", filtered.length, `${period.tours} tour${period.tours === 1 ? "" : "s"} running`, <EventRoundedIcon />, "#2563eb", "#eff6ff")}
        {stat("Travellers booked", `${period.booked} / ${period.seats}`, `${period.fill}% of seats filled`, <GroupsRoundedIcon />, "#059669", "#ecfdf5")}
        {stat("Booked value", inr(period.revenue), "total of bookings in view", <TrendingUpRoundedIcon />, "#7c3aed", "#f5f3ff")}
        {stat("Needs attention", `${period.low + period.sold}`, `${period.sold} sold out · ${period.low} filling fast`, <BlockRoundedIcon />, "#d97706", "#fffbeb")}
      </Grid>

      {/* Toolbar */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, mb: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel shrink sx={{ bgcolor: "#fff", px: 0.5, fontSize: "0.82rem" }}>Select Tour Map</InputLabel>
          <Select value={tourId} label="Select Tour Map" notched onChange={(e) => setTourId(e.target.value)} sx={{ ...fieldSx, "& .MuiSelect-select": { fontStyle: "italic", fontWeight: 600 } }}>
            <MenuItem value="all">All Tours (Multi-Tour Timeline)</MenuItem>
            {tours.map((t) => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select value={destination} onChange={(e) => setDestination(e.target.value)} sx={fieldSx} startAdornment={<PublicRoundedIcon sx={{ color: "#64748b", fontSize: 18, mr: 1 }} />}>
            <MenuItem value="all">All Destinations</MenuItem>
            {options.destinations.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel shrink sx={{ bgcolor: "#fff", px: 0.5, fontSize: "0.82rem" }}>Travel Styles</InputLabel>
          <Select value={style} label="Travel Styles" notched onChange={(e) => setStyle(e.target.value)} sx={{ ...fieldSx, "& .MuiSelect-select": { fontStyle: "italic", fontWeight: 600 } }}>
            <MenuItem value="all">All Travel Styles</MenuItem>
            {options.styles.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <Select value={departure} onChange={(e) => setDeparture(e.target.value)} sx={fieldSx}>
            {DEPARTURE_FILTERS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search tours…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220, flexGrow: 1, maxWidth: 320, "& .MuiOutlinedInput-root": fieldSx }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "#94a3b8", fontSize: 18 }} /></InputAdornment> } }} />
        {filtersOn && <Button size="small" startIcon={<FilterAltOffRoundedIcon sx={{ fontSize: 16 }} />} onClick={reset} sx={{ color: "#ef4444", fontWeight: 600, textTransform: "none" }}>Reset</Button>}
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={() => setStart(addDays(start, -7))} aria-label="Earlier" sx={{ color: "#334155", border: "1px solid #e2e8f0", borderRadius: "6px" }}><ChevronLeftRoundedIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setStart(addDays(start, 7))} aria-label="Later" sx={{ color: "#334155", border: "1px solid #e2e8f0", borderRadius: "6px" }}><ChevronRightRoundedIcon fontSize="small" /></IconButton>
          <Button variant="outlined" size="small" startIcon={<CalendarTodayRoundedIcon sx={{ fontSize: 15 }} />} onClick={() => setStart(mondayOf(today))} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.8rem", color: "#0f172a", borderColor: "#e2e8f0", borderRadius: "6px", height: 36, px: 1.75 }}>
            Today
          </Button>
        </Box>
      </Box>

      <Typography sx={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, mb: 0.75 }}>{fmt(start)} – {fmtYear(end)}</Typography>
      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: "6px" }} onClose={() => setError(null)}>{error}</Alert>}
      <Box sx={{ height: 3, mb: 0.5 }}>{loading && <LinearProgress sx={{ height: 3, borderRadius: 2, bgcolor: "#eef2f7", "& .MuiLinearProgress-bar": { bgcolor: "#4f52e3" } }} />}</Box>

      {view === "timeline" ? timeline : agenda}

      {/* Legend */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2.5, mt: 1.5, px: 0.5 }}>
        {([["open", "Available Spots"], ["low", `Filling Fast (≤ ${LOW_SEATS} spots)`], ["sold", "Sold Out"]] as const).map(([k, l]) => (
          <Box key={k} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 28, height: 12, borderRadius: "4px", background: STATUS_META[k].fill }} />
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#475569" }}>{l}</Typography>
          </Box>
        ))}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #4f52e3" }} />
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#475569" }}>Today</Typography>
        </Box>
      </Box>

      {/* Departure detail */}
      <Drawer anchor="right" open={Boolean(active)} onClose={() => setActive(null)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 440 }, p: 0 } } }}>
        {active && (() => {
          const e = active;
          const st = statusOf(e);
          const nights = Math.max(0, diff(e.start, e.end));
          const row = (l: string, v: React.ReactNode) => (
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.9, borderBottom: "1px solid #f1f5f9" }}>
              <Typography sx={{ fontSize: "0.82rem", color: "#64748b" }}>{l}</Typography>
              <Typography component="div" sx={{ fontSize: "0.85rem", fontWeight: 600, textAlign: "right" }}>{v}</Typography>
            </Box>
          );
          return (
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {e.coverImage && <Box component="img" src={e.coverImage} alt="" sx={{ width: "100%", height: 150, objectFit: "cover" }} />}
              <Box sx={{ p: 2.5, borderTop: "4px solid #4f52e3", flex: 1, overflowY: "auto" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.25 }}>{e.title}</Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>{e.targetCity ? `${e.targetCity}, ` : ""}{e.state}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setActive(null)}><CloseRoundedIcon /></IconButton>
                </Box>
                <Box sx={{ display: "flex", gap: 0.75, my: 1.5, flexWrap: "wrap" }}>
                  <Chip label={STATUS_META[st].label} size="small" sx={{ fontWeight: 700, borderRadius: "4px", bgcolor: STATUS_META[st].bg, color: STATUS_META[st].fg }} />
                  <Chip label={e.kind === "base" ? "Joining / Leaving" : `Partner city · ${e.cityName}`} size="small" sx={{ fontWeight: 600, borderRadius: "4px", bgcolor: "#f1f5f9" }} />
                  {!e.tourActive && <Chip label="Tour inactive" size="small" sx={{ borderRadius: "4px", bgcolor: "#f1f5f9" }} />}
                  {e.specialOffer && <Chip icon={<BoltRoundedIcon sx={{ fontSize: "14px !important" }} />} label={`${e.specialOffer.name || "Special offer"} ${e.specialOffer.percentage}%`} size="small" sx={{ fontWeight: 700, borderRadius: "4px", bgcolor: "#FFF3DB", color: "#92400e" }} />}
                </Box>

                <Box sx={{ p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", mb: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>Travellers</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{e.booked} / {e.seats}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min(100, e.seats ? (e.booked / e.seats) * 100 : 0)} sx={{ height: 8, borderRadius: 4, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: st === "sold" ? "#dc2626" : st === "low" ? "#ea580c" : "#4f52e3" } }} />
                  <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mt: 0.5 }}>{e.available} seat{e.available === 1 ? "" : "s"} left · {e.bookings} booking{e.bookings === 1 ? "" : "s"}</Typography>
                </Box>

                {row("Dates", `${fmtLong(e.start)} → ${fmtLong(e.end)}`)}
                {row("Duration", `${nights + 1} days / ${nights} nights`)}
                {row("Starts from", e.kind === "base" ? "Joining / Leaving location" : e.cityName)}
                {e.partnerName && row("Partner", e.partnerName)}
                {row("Price per person", e.discount > 0 ? <><s style={{ color: "#94a3b8", fontWeight: 500 }}>{inr(e.price)}</s> {inr(e.unitPrice)}</> : inr(e.price))}
                {row("Discount", e.discount > 0 ? `${e.discount}%${e.specialOffer ? " (special offer)" : ""}${e.specialOffer && e.storedDiscount !== e.discount ? ` · date's own ${e.storedDiscount}%` : ""}` : "None")}
                {row("Booked value", inr(e.revenue))}
                {row("Collected so far", inr(e.paid))}
                {e.travelStyles.length > 0 && row("Travel styles", e.travelStyles.join(", "))}
              </Box>
              <Divider />
              <Box sx={{ p: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button component={Link} href={`/admin/tours/${e.tourId}/edit`} variant="contained" size="small" sx={{ bgcolor: "#0f172a", textTransform: "none", "&:hover": { bgcolor: "#1e293b" } }}>Edit tour</Button>
                <Button component={Link} href="/admin/tours" size="small" variant="outlined" sx={{ textTransform: "none", borderColor: "#e2e8f0", color: "#0f172a" }}>Manage dates</Button>
                <Button component="a" href={`/tours/${e.slug || e.tourId}`} target="_blank" size="small" variant="outlined" sx={{ textTransform: "none", borderColor: "#e2e8f0", color: "#0f172a" }}>View live page</Button>
                <Button component={Link} href="/admin/bookings" size="small" sx={{ textTransform: "none", color: "#475569" }}>Bookings</Button>
              </Box>
            </Box>
          );
        })()}
      </Drawer>
    </Box>
  );
}
