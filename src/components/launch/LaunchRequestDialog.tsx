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
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { endDateFor, totalDays } from "@/lib/launch-shared";
import { authHeaders, fmtDate, inr } from "./LaunchParts";

interface Row {
  startDate: string;
  seats: number | "";
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
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tour) return;
    setRows([{ startDate: "", seats: tour.maxGroupSize || 15 }]);
    setNotes("");
    setError(null);
  }, [tour, city]);

  if (!tour) return null;
  const today = new Date().toISOString().slice(0, 10);

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

  // Estimated length: the tour's own days; the admin plans any extra days and confirms the final itinerary.
  const estDays = totalDays(tour.durationDays, 0, 0);

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
              The admin reviews your request, plans the itinerary, sets the supplement for your city and sends it back for your confirmation.
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
                    <TextField label="End date (estimated)" fullWidth size="small" disabled value={r.startDate ? fmtDate(endDateFor(r.startDate, tour.durationDays, 0, 0)) : "—"} />
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
    </>
  );
}
