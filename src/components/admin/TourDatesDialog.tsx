"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

const DAY = 86400000;
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const THIS_COLOR = "#FFD9A0";

const day = (d: string | Date) => new Date(d).toISOString().slice(0, 10);
const addDays = (ymd: string, n: number) => new Date(+new Date(`${ymd}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const fmt = (ymd: string) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtFull = (ymd: string) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
};

interface OwnDate { _id: string; start: string; end: string; seats: number; booked: number; discount: number }
interface Entry { tourId: string; title: string; mine: boolean; start: string; end: string; own?: boolean }

/** Pop-up calendar to add, edit and remove a tour's own joining / leaving dates, . */
export default function TourDatesDialog({
  tour,
  allTours,
  onClose,
  onChanged,
}: {
  tour: any | null;
  allTours: any[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const open = Boolean(tour);
  const today = day(new Date());
  const [month, setMonth] = useState(today.slice(0, 7));
  const [dates, setDates] = useState<OwnDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);

  // small popup state
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [picked, setPicked] = useState<string | null>(null); // the day that was clicked
  const [editing, setEditing] = useState<OwnDate | null>(null);
  const [seats, setSeats] = useState("");
  const [discount, setDiscount] = useState(0);
  const [touched, setTouched] = useState(false);

  const duration = Math.max(1, tour?.durationDays || 1);
  const special = useMemo(
    () => offers.filter((o) => (tour?.travelStyles || []).includes(o.travelStyle)).sort((a, b) => b.percentage - a.percentage)[0] || null,
    [offers, tour]
  );

  const loadOwn = useCallback(async () => {
    if (!tour) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tours/${tour._id}?raw=true`).then((r) => r.json());
      if (!res.success) throw new Error(res.error || "Couldn't load the dates");
      setDates(
        (res.data.departures || [])
          .filter((d: any) => d.isBase)
          .map((d: any) => ({ _id: d._id, start: day(d.startDate), end: day(d.endDate), seats: d.seats, booked: d.booked || 0, discount: d.discountPercentage || 0 }))
          .sort((a: OwnDate, b: OwnDate) => a.start.localeCompare(b.start))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tour]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setMonth(today.slice(0, 7));
    setAnchor(null);
    loadOwn();
    fetch("/api/discounts").then((r) => r.json()).then((d) => d.success && setDiscounts(d.data || [])).catch(() => {});
    fetch("/api/special-discounts?active=true").then((r) => r.json()).then((d) => d.success && setOffers(d.data || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tour?._id]);

  // Every departure on the calendar, keyed by each day it covers. This tour's basic dates come from local state so edits show instantly.
  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    if (!tour) return map;
    const [y, m] = month.split("-").map(Number);
    const from = new Date(Date.UTC(y, m - 1, 1) - 7 * DAY);
    const to = new Date(Date.UTC(y, m, 0) + 8 * DAY);
    const push = (e: Entry) => {
      let t = Math.max(+new Date(`${e.start}T00:00:00Z`), +from);
      const last = Math.min(+new Date(`${e.end}T00:00:00Z`), +to);
      for (; t <= last; t += DAY) {
        const k = new Date(t).toISOString().slice(0, 10);
        map.set(k, [...(map.get(k) || []), e]);
      }
    };
    // Only the opened tour: its partner-launched dates from the list, plus its basic dates from local state (so edits show instantly).
    const self = allTours.find((t) => t._id === tour._id);
    for (const d of self?.departures || []) {
      if (!d.launchId) continue;
      push({ tourId: tour._id, title: tour.title, mine: true, start: day(d.startDate), end: day(d.endDate) });
    }
    for (const d of dates) push({ tourId: tour._id, title: tour.title, mine: true, own: true, start: d.start, end: d.end });
    return map;
  }, [allTours, dates, month, tour]);

  const cells = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const lead = (first.getUTCDay() + 6) % 7; // Monday first
    const total = Math.ceil((lead + new Date(Date.UTC(y, m, 0)).getUTCDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) => new Date(+first + (i - lead) * DAY).toISOString().slice(0, 10));
  }, [month]);

  const shiftMonth = (n: number) => {
    const [y, m] = month.split("-").map(Number);
    setMonth(new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7));
  };
  const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

  const onDayClick = (e: React.MouseEvent<HTMLElement>, ymd: string) => {
    setError(null);
    const existing = dates.find((d) => d.start === ymd) || null;
    if (!existing && ymd < today) return;
    setAnchor(e.currentTarget);
    setPicked(ymd);
    setEditing(existing);
    setSeats(String(existing?.seats ?? tour.maxGroupSize ?? 15));
    setDiscount(existing ? existing.discount : special?.percentage ?? 0);
    setTouched(false);
  };
  const closePopup = () => {
    setAnchor(null);
    setPicked(null);
    setEditing(null);
  };

  // Every change is saved as the tour's full list of basic dates; the server validates it (past dates, duplicates, bookings).
  const save = async (next: { _id?: string; startDate: string; seats: number; discountPercentage: number }[]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tours/${tour._id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ baseDepartures: next }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't save the date");
      closePopup();
      await loadOwn();
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const current = () => dates.map((d) => ({ _id: d._id, startDate: d.start, seats: d.seats, discountPercentage: d.discount }));

  const submit = () => {
    if (!picked) return;
    const n = Math.floor(Number(seats));
    if (!(n >= 1 && n <= 500)) return setError("Travellers must be between 1 and 500.");
    // An untouched, prefilled discount is the live offer itself: store 0 so the date returns to no discount when the offer ends.
    const stored = !editing && !touched && special && discount === special.percentage ? 0 : discount;
    if (editing) save(current().map((d) => (d._id === editing._id ? { ...d, seats: n, discountPercentage: stored } : d)));
    else save([...current(), { startDate: picked, seats: n, discountPercentage: stored }]);
  };
  const remove = (d: OwnDate) => save(current().filter((x) => x._id !== d._id));

  // What the new/selected date would collide with, shown inside the popup.
  const preview = useMemo(() => {
    if (!picked) return { own: [] as OwnDate[] };
    const end = addDays(picked, duration - 1);
    const own = dates.filter((d) => d._id !== editing?._id && d.start <= end && d.end >= picked);
    return { own };
  }, [picked, editing, dates, duration]);

  const options = useMemo(() => {
    const vals = new Map<number, string>();
    discounts.forEach((d) => vals.set(d.value, `${d.name} (${d.value}% OFF)`));
    if (discount > 0 && !vals.has(discount)) vals.set(discount, special && discount === special.percentage ? `Special offer (${discount}% OFF)` : `Custom (${discount}% OFF)`);
    return [...vals.entries()];
  }, [discounts, discount, special]);

  const upcoming = dates.filter((d) => d.end >= today);

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: "8px" } } }}>
      {tour && (
        <>
          <Box sx={{ px: 3, pt: 2.25, pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.25 }}>Joining / Leaving dates</Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "#64748b" }}>
                {tour.title} · {tour.durationDays}D / {tour.durationNights}N · pick a start date to add a departure
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose} disabled={busy}><CloseRoundedIcon fontSize="small" /></IconButton>
          </Box>

          <DialogContent sx={{ pt: 0.5 }}>
            {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: "6px" }} onClose={() => setError(null)}>{error}</Alert>}
            {!tour.baseStartCityId && !tour.destinationId && <Alert severity="warning" sx={{ mb: 1.5 }}>Set the start &amp; end location on this tour first.</Alert>}

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton size="small" onClick={() => shiftMonth(-1)}><ChevronLeftRoundedIcon /></IconButton>
                <Typography sx={{ fontWeight: 800, minWidth: 150, textAlign: "center" }}>{monthLabel}</Typography>
                <IconButton size="small" onClick={() => shiftMonth(1)}><ChevronRightRoundedIcon /></IconButton>
                <Button size="small" onClick={() => setMonth(today.slice(0, 7))} sx={{ textTransform: "none", ml: 0.5 }}>Today</Button>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><Box sx={{ width: 14, height: 14, bgcolor: THIS_COLOR, border: "1px solid #FF9900", borderRadius: "3px" }} /><Typography sx={{ fontSize: "0.75rem" }}>This tour&apos;s dates</Typography></Box>
              </Box>
            </Box>

            <Box sx={{ position: "relative", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
              {(loading || busy) && <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(255,255,255,0.6)", zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center" }}><CircularProgress size={26} /></Box>}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {WEEK.map((w) => <Typography key={w} sx={{ py: 0.75, textAlign: "center", fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>{w}</Typography>)}
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                {cells.map((ymd) => {
                  const inMonth = ymd.startsWith(month);
                  const list = byDay.get(ymd) || [];
                  const mine = list.filter((e) => e.mine);
                  const ownHere = mine.filter((e) => e.own);
                  const starts = ownHere.some((e) => e.start === ymd);
                  const clash = new Set(mine.map((e) => `${e.tourId}:${e.start}`)).size > 1;
                  const past = ymd < today;
                  const bg = mine.length ? THIS_COLOR : "#fff";
                  const tip = list.length ? (
                    <Box>
                      {[...new Map(list.map((e) => [`${e.tourId}${e.start}`, e])).values()].map((e) => (
                        <Typography key={`${e.tourId}${e.start}`} sx={{ fontSize: "0.72rem" }}>{e.mine ? "● " : "○ "}{e.title} · {fmt(e.start)}–{fmt(e.end)}</Typography>
                      ))}
                      {clash && <Typography sx={{ fontSize: "0.72rem", color: "#fca5a5", fontWeight: 700 }}>Overlaps another departure of this tour</Typography>}
                    </Box>
                  ) : "";
                  return (
                    <Tooltip key={ymd} title={tip} placement="top" arrow disableHoverListener={!list.length}>
                      <Box
                        role="button"
                        tabIndex={past && !starts ? -1 : 0}
                        onClick={(e) => onDayClick(e, ymd)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onDayClick(e as any, ymd))}
                        sx={{
                          minHeight: 62,
                          p: 0.5,
                          bgcolor: bg,
                          opacity: inMonth ? 1 : 0.45,
                          borderRight: "1px solid #eef2f7",
                          borderBottom: "1px solid #eef2f7",
                          outline: clash ? "2px solid #ef4444" : "none",
                          outlineOffset: "-2px",
                          cursor: past && !starts ? "not-allowed" : "pointer",
                          position: "relative",
                          "&:hover": past && !starts ? {} : { boxShadow: "inset 0 0 0 2px #FF9900" },
                        }}
                      >
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: ymd === today ? 800 : 600, color: past ? "#94a3b8" : "#0f172a", ...(ymd === today ? { bgcolor: "#0f172a", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" } : {}) }}>
                          {Number(ymd.slice(8))}
                        </Typography>
                        {starts && <Chip label="Start" size="small" sx={{ position: "absolute", top: 4, right: 4, height: 16, fontSize: "0.58rem", fontWeight: 800, bgcolor: "#FF9900", color: "#0f172a", "& .MuiChip-label": { px: 0.6 } }} />}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", mb: 0.75 }}>Upcoming dates ({upcoming.length})</Typography>
              {upcoming.length === 0 ? (
                <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>No upcoming dates yet. Click a day on the calendar to add one.</Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {upcoming.map((d) => (
                    <Chip key={d._id} onClick={() => { setMonth(d.start.slice(0, 7)); }}
                      label={`${fmt(d.start)} – ${fmt(d.end)} · ${d.seats} seats${d.discount ? ` · ${d.discount}% off` : ""}${d.booked ? ` · ${d.booked} booked` : ""}`}
                      onDelete={d.booked ? undefined : () => remove(d)}
                      deleteIcon={<DeleteRoundedIcon />}
                      sx={{ borderRadius: "4px", bgcolor: THIS_COLOR, fontWeight: 600, fontSize: "0.74rem" }} />
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>

          {/* Small popup over the calendar: number of travellers and discount */}
          <Popover
            open={Boolean(anchor && picked)}
            anchorEl={anchor}
            onClose={() => !busy && closePopup()}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
            slotProps={{ paper: { sx: { p: 2, width: 320, borderRadius: "8px", boxShadow: "0 12px 32px rgba(15,23,42,0.22)" } } }}
          >
            {picked && (
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>{editing ? "Edit departure" : "Add departure"}</Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "#64748b", mb: 1.5 }}>
                  {fmtFull(picked)} → {fmt(addDays(picked, duration - 1))} ({duration} day{duration === 1 ? "" : "s"})
                </Typography>
                <TextField label="Number of travellers" type="number" size="small" fullWidth autoFocus value={seats} onChange={(e) => setSeats(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
                  slotProps={{ htmlInput: { min: Math.max(1, editing?.booked || 1) } }} helperText={editing?.booked ? `${editing.booked} already booked` : undefined} sx={{ mb: 1.5 }} />
                <FormControl fullWidth size="small">
                  <InputLabel>Discount</InputLabel>
                  <Select value={discount} label="Discount" onChange={(e) => { setDiscount(Number(e.target.value)); setTouched(true); }}>
                    <MenuItem value={0}>No Discount (0%)</MenuItem>
                    {options.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                  </Select>
                </FormControl>
                {special && !editing && !touched && discount === special.percentage && (
                  <Typography sx={{ mt: 0.75, fontSize: "0.72rem", color: "#92400e", display: "flex", alignItems: "center", gap: 0.5 }}>
                    <BoltRoundedIcon sx={{ fontSize: 14 }} />{special.name || "Special offer"} is live — it applies on its own until it ends.
                  </Typography>
                )}
                {preview.own.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 1.25, py: 0, fontSize: "0.74rem" }}>Overlaps this tour&apos;s departure {preview.own.map((d) => `${fmt(d.start)}–${fmt(d.end)}`).join(", ")}</Alert>
                )}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.75, gap: 1 }}>
                  {editing ? (
                    <Tooltip title={editing.booked ? "This date has bookings and can't be deleted" : "Delete this date"}>
                      <span><Button size="small" color="error" disabled={busy || Boolean(editing.booked)} onClick={() => remove(editing)} sx={{ textTransform: "none" }}>Delete</Button></span>
                    </Tooltip>
                  ) : <span />}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button size="small" onClick={closePopup} disabled={busy} sx={{ color: "#64748b", textTransform: "none" }}>Cancel</Button>
                    <Button size="small" variant="contained" disabled={busy} onClick={submit} sx={{ bgcolor: "#0f172a", textTransform: "none", "&:hover": { bgcolor: "#1e293b" } }}>
                      {busy ? "Saving…" : editing ? "Save" : "Add date"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Popover>
        </>
      )}
    </Dialog>
  );
}
