"use client";

import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import { endDateFor, totalDays } from "@/lib/launch-shared";
import { authHeaders, fmtDate, inr } from "./LaunchParts";

interface Row {
  startDate: string;
  seats: number | "";
}

type Side = "before" | "after";

/** A day's cities (new multi-city field, or the older single city), else a short title. */
function dayLabel(d: any) {
  const cities: string[] = d.destinations?.length ? d.destinations.map((c: any) => c.name) : d.destinationName ? [d.destinationName] : [];
  if (cities.length) return { cities, text: cities.join(" → ") };
  const t = String(d.title || "Day").trim();
  return { cities: [] as string[], text: t.length > 48 ? `${t.slice(0, 46).trim()}…` : t };
}

/** Partner's form to request a tour for their own city. */
export default function LaunchRequestDialog({
  tour,
  city,
  tokenKey,
  onClose,
  onCreated,
}: {
  tour: any | null;
  city: any | null; // the partner's destination (with addresses)
  tokenKey: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [rows, setRows] = useState<Row[]>([{ startDate: "", seats: 15 }]);
  const [before, setBefore] = useState<string[]>([]);
  const [after, setAfter] = useState<string[]>([]);
  const [addressId, setAddressId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // note popup
  const [popup, setPopup] = useState<{ side: Side; index: number | null } | null>(null);
  const [popupText, setPopupText] = useState("");

  useEffect(() => {
    if (!tour) return;
    setRows([{ startDate: "", seats: tour.maxGroupSize || 15 }]);
    setBefore([]);
    setAfter([]);
    setNotes("");
    setError(null);
    const addrs = city?.addresses || [];
    setAddressId(addrs.length === 1 ? addrs[0]._id : "");
  }, [tour, city]);

  if (!tour) return null;
  const today = new Date().toISOString().slice(0, 10);
  const addrs: any[] = city?.addresses || [];
  const itinerary: any[] = tour.itinerary || [];

  const openPopup = (side: Side, index: number | null = null) => {
    setPopup({ side, index });
    setPopupText(index === null ? "" : (side === "before" ? before : after)[index] || "");
  };
  const savePopup = () => {
    if (!popup || !popupText.trim()) return;
    const set = popup.side === "before" ? setBefore : setAfter;
    set((list) => (popup.index === null ? [...list, popupText.trim()] : list.map((n, i) => (i === popup.index ? popupText.trim() : n))));
    setPopup(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (rows.some((r) => !r.startDate)) return setError("Choose a start date for every row.");
    setSaving(true);
    try {
      const res = await fetch("/api/launches", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(tokenKey) },
        body: JSON.stringify({
          tourId: tour._id,
          dates: rows.map((r) => ({ startDate: r.startDate, seats: Number(r.seats) })),
          startNotes: before,
          endNotes: after,
          addressId: addressId || null,
          partnerNotes: notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not send the request");
      onCreated(data.data._id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const noteList = (side: Side, list: string[]) =>
    list.map((n, i) => (
      <Box key={`${side}-${i}`} sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 1.25, border: "1px dashed #cbd5e1", borderRadius: "4px", bgcolor: "#fffbeb" }}>
        <Chip label={`${side === "before" ? "Before" : "After"} · ${i + 1}`} size="small" sx={{ height: 20, fontSize: "0.68rem", borderRadius: "4px", bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 700, mt: 0.15 }} />
        <Typography sx={{ flex: 1, fontSize: "0.82rem", whiteSpace: "pre-line" }}>{n}</Typography>
        <IconButton size="small" aria-label="Edit note" onClick={() => openPopup(side, i)} sx={{ p: 0.5 }}><EditRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
        <IconButton size="small" aria-label="Remove note" onClick={() => (side === "before" ? setBefore : setAfter)((l) => l.filter((_, j) => j !== i))} sx={{ p: 0.5, color: "#dc2626" }}><DeleteRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
      </Box>
    ));

  const plusButton = (side: Side) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <IconButton
        aria-label={side === "before" ? "Add a day before the tour" : "Add a day after the tour"}
        onClick={() => openPopup(side)}
        sx={{ width: 30, height: 30, border: "1px dashed #94a3b8", borderRadius: "50%", color: "#0f172a", "&:hover": { bgcolor: "#f1f5f9", borderColor: "#0f172a" } }}
      >
        <AddRoundedIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>
        {side === "before" ? "Add a day before the tour (e.g. travel to the tour's start)" : "Add a day after the tour (e.g. the return journey)"}
      </Typography>
    </Box>
  );

  // Estimated length: notes are one day each; the admin confirms the final itinerary.
  const estDays = totalDays(tour.durationDays, before.length, after.length);

  return (
    <>
      <Dialog open onClose={() => !saving && onClose()} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
        <form onSubmit={submit}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 0.5 }}>
            Request to start “{tour.title}” from {city?.name}
          </DialogTitle>
          <DialogContent sx={{ pt: 1.5 }}>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>{error}</Alert>}

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
              <Chip label={`Start & end city: ${city?.name}`} size="small" sx={{ borderRadius: "4px", bgcolor: "#f1f5f9", fontWeight: 600 }} />
              <Chip label={`Tour length: ${tour.durationDays} days / ${tour.durationNights} nights`} size="small" sx={{ borderRadius: "4px", bgcolor: "#f1f5f9", fontWeight: 600 }} />
              <Chip label={`Base price: ${inr(tour.basePriceInr || tour.priceInr)} per person`} size="small" sx={{ borderRadius: "4px", bgcolor: "#f1f5f9", fontWeight: 600 }} />
            </Box>
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
              The admin reviews your request, plans any extra days from your notes, sets the supplement for your city and sends it back for your confirmation.
            </Typography>

            {/* Dates */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>Start dates</Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>End dates follow the itinerary (about {estDays} days in total — the admin confirms).</Typography>
              </Box>
              <Button size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => setRows([...rows, { startDate: "", seats: tour.maxGroupSize || 15 }])} sx={{ borderRadius: "4px" }}>
                Add date
              </Button>
            </Box>
            {rows.map((r, i) => (
              <Box key={i} sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", p: 1.5, mb: 1.25 }}>
                <Grid container spacing={1.25} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField label="Start date" type="date" required fullWidth size="small" value={r.startDate} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, startDate: e.target.value } : x)))} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField label="End date (estimated)" fullWidth size="small" disabled value={r.startDate ? fmtDate(endDateFor(r.startDate, tour.durationDays, before.length, after.length)) : "—"} />
                  </Grid>
                  <Grid size={{ xs: 8, sm: 3 }}>
                    <TextField label="Travellers (seats)" type="number" required fullWidth size="small" value={r.seats} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, seats: e.target.value === "" ? "" : Number(e.target.value) } : x)))} slotProps={{ htmlInput: { min: 1 } }} />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 1 }} sx={{ textAlign: "right" }}>
                    {rows.length > 1 && (
                      <IconButton size="small" aria-label="Remove date" onClick={() => setRows(rows.filter((_, j) => j !== i))} sx={{ color: "#dc2626" }}>
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            <FormControl fullWidth size="small" disabled={addrs.length === 0} sx={{ mb: 0.5 }}>
              <InputLabel>Starting address (where travellers report)</InputLabel>
              <Select value={addressId} label="Starting address (where travellers report)" onChange={(e) => setAddressId(e.target.value as string)}>
                <MenuItem value=""><em>Decide later</em></MenuItem>
                {addrs.map((a) => <MenuItem key={a._id} value={a._id}>{a.label} — {a.address}</MenuItem>)}
              </Select>
            </FormControl>
            {addrs.length === 0 && <Typography variant="caption" sx={{ color: "#64748b" }}>No addresses are set for {city?.name} yet — the admin can attach one during review.</Typography>}

            <Divider sx={{ my: 2 }} />

            {/* The tour's own itinerary, with room to add days before and after it */}
            <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>Tour itinerary</Typography>
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1.25 }}>
              Need extra days for your city (travelling to the tour or back)? Use the + buttons to leave a short note for each day — the admin will plan them.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {plusButton("before")}
              {noteList("before", before)}

              <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", bgcolor: "#f8fafc" }}>
                {itinerary.length === 0 && <Typography sx={{ p: 1.5, fontSize: "0.8rem", color: "#94a3b8" }}>This tour has no itinerary yet.</Typography>}
                {itinerary.map((d, i) => {
                  const l = dayLabel(d);
                  return (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1.5, py: 0.9, borderBottom: i < itinerary.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", minWidth: 44 }}>Day {d.day ?? i + 1}</Typography>
                      {l.cities.length > 0 && <PlaceRoundedIcon sx={{ fontSize: 15, color: "#a16207" }} />}
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: l.cities.length ? 600 : 400, color: "#0f172a" }}>{l.text}</Typography>
                    </Box>
                  );
                })}
              </Box>

              {noteList("after", after)}
              {plusButton("after")}
            </Box>

            <Divider sx={{ my: 2 }} />
            <TextField label="Anything else the admin should know? (optional)" fullWidth multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Transport arrangements, pickup points, group size expectations…" />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={onClose} disabled={saving} sx={{ color: "#64748b" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
              {saving ? "Sending…" : "Send request to admin"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Note popup */}
      <Dialog open={Boolean(popup)} onClose={() => setPopup(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
          {popup?.index === null ? "Add" : "Edit"} a day {popup?.side === "before" ? "before" : "after"} the tour
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b", mb: 1.25 }}>
            Just describe the idea — e.g. “Overnight train from Pune to Mumbai, check in at hotel”. The admin will turn it into an itinerary day.
          </Typography>
          <TextField autoFocus fullWidth multiline minRows={3} label="Notes" value={popupText} onChange={(e) => setPopupText(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setPopup(null)} sx={{ color: "#64748b" }}>Cancel</Button>
          <Button variant="contained" disabled={!popupText.trim()} onClick={savePopup} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
            {popup?.index === null ? "Add" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
