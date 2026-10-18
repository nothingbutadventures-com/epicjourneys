"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
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
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const TOKEN = "epic_partner_token";
const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN) : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const statusChip = (status: string) => (
  <Chip
    label={status}
    size="small"
    sx={{
      borderRadius: "4px",
      height: 20,
      fontSize: "0.68rem",
      fontWeight: 600,
      textTransform: "capitalize",
      bgcolor: status === "confirmed" ? "#ecfdf5" : status === "pending" ? "#fffbeb" : "#fef2f2",
      color: status === "confirmed" ? "#059669" : status === "pending" ? "#d97706" : "#dc2626",
    }}
  />
);

export default function PartnerDashboardPage() {
  const [partner, setPartner] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [launches, setLaunches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Booking dialog
  const [open, setOpen] = useState(false);
  const [tourId, setTourId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [requests, setRequests] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const h = authHeaders();
      const [b, t, l, me] = await Promise.all([
        fetch("/api/bookings", { headers: h }).then((r) => r.json()),
        fetch("/api/tours").then((r) => r.json()),
        fetch("/api/launches", { headers: h }).then((r) => r.json()),
        fetch("/api/partners", { headers: h }).then((r) => r.json()),
      ]);
      if (b.success) setBookings(b.data || []);
      else setError(b.error || "Failed to load bookings");
      if (t.success) setTours(t.data || []);
      if (l.success) setLaunches(l.data || []);
      setPartner(me.data?.[0] || null);
    } catch (e: any) {
      setError(e.message || "Failed to load your dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setTravelDate(d.toISOString().split("T")[0]);
    load();
  }, []);

  const needsReply = launches.filter((l) => l.status === "awaiting_partner").length;
  const live = launches.filter((l) => l.status === "approved").length;
  const volume = bookings.filter((b) => b.status !== "cancelled").reduce((n, b) => n + (b.totalAmountInr || 0), 0);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => !q || `${b.bookingRef} ${b.customerName} ${b.customerPhone} ${b.tourTitle}`.toLowerCase().includes(q));
  }, [bookings, search]);

  const selectedTour = tours.find((t) => t._id === tourId);
  const total = selectedTour ? (selectedTour.basePriceInr || selectedTour.priceInr) * travelers : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDialogError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ tourId, customerName, customerEmail, customerPhone, travelDate, numberOfTravelers: travelers, specialRequests: requests }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create booking");
      setConfirmed(data.data);
      setOpen(false);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setRequests("");
      load();
    } catch (err: any) {
      setDialogError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Welcome, {partner?.name || "Partner"}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Bookings for {partner?.assignedDestination?.name || "your location"} and your tour requests
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
          onClick={() => { setTourId(tours[0]?._id || ""); setDialogError(null); setOpen(true); }}
          sx={{ bgcolor: "#0f172a", color: "#ffffff", borderRadius: "4px", height: 30, fontSize: "0.78rem", "&:hover": { bgcolor: "#1e293b" } }}
        >
          Book Tour For Customer
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}
      {needsReply > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "4px" }} action={<Button component={Link} href="/partner/requests" size="small" color="inherit">Review</Button>}>
          {needsReply} tour request{needsReply === 1 ? " is" : "s are"} waiting for your confirmation.
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5, mb: 2.5 }}>
        {[
          { label: "Bookings handled", value: bookings.length },
          { label: "Booking volume", value: inr(volume) },
          { label: "Live tour requests", value: live },
          { label: "Needs my reply", value: needsReply, warn: needsReply > 0 },
        ].map((c) => (
          <Paper key={c.label} elevation={0} sx={{ p: 1.75, borderRadius: "4px", border: "1px solid #e2e8f0" }}>
            <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</Typography>
            <Typography sx={{ fontSize: "1.3rem", fontWeight: 700, color: c.warn ? "#d97706" : "#0f172a", lineHeight: 1.3 }}>{c.value}</Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, gap: 1.5, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>My bookings</Typography>
        <TextField
          size="small"
          placeholder="Search bookings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }}
        />
      </Box>

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={24} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Tour</TableCell>
                  <TableCell>Travel date</TableCell>
                  <TableCell>Pax</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((b) => (
                  <TableRow key={b._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem", whiteSpace: "nowrap" }}>{b.bookingRef}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>{b.customerName}</Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>{b.customerPhone}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", maxWidth: 240 }}>
                      <Typography noWrap sx={{ fontSize: "0.8rem" }}>{b.tourTitle || b.tourId?.title}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{fmt(b.travelDate)}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>{b.numberOfTravelers}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{inr(b.totalAmountInr)}</TableCell>
                    <TableCell>{statusChip(b.status)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>
                      {bookings.length === 0 ? "No bookings yet" : "No bookings match your search"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Book for customer */}
      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
        <form onSubmit={submit}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>Book Tour For Customer</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {dialogError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>{dialogError}</Alert>}
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Tour</InputLabel>
                  <Select value={tourId} label="Tour" onChange={(e) => setTourId(e.target.value)}>
                    {tours.map((t) => <MenuItem key={t._id} value={t._id}>{t.title} ({inr(t.basePriceInr || t.priceInr)} / person)</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Customer name" required fullWidth value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Phone" required fullWidth value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Email" type="email" required fullWidth value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Travel date" type="date" required fullWidth value={travelDate} onChange={(e) => setTravelDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Travellers" type="number" required fullWidth value={travelers} onChange={(e) => setTravelers(Math.max(1, Number(e.target.value) || 1))} slotProps={{ htmlInput: { min: 1 } }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Special requests (optional)" fullWidth multiline minRows={2} value={requests} onChange={(e) => setRequests(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: "4px", bgcolor: "#f8fafc", display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: "0.82rem", color: "#64748b" }}>{selectedTour ? `${inr(selectedTour.basePriceInr || selectedTour.priceInr)} × ${travelers}` : "Choose a tour"}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{inr(total)}</Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setOpen(false)} disabled={saving} sx={{ color: "#64748b" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || !tourId} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
              {saving ? "Booking…" : "Confirm booking"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(confirmed)} onClose={() => setConfirmed(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>Booking confirmed</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>Reference</Typography>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>{confirmed?.bookingRef}</Typography>
          <Typography sx={{ fontSize: "0.85rem", color: "#475569" }}>
            {confirmed?.customerName} · {confirmed?.numberOfTravelers} traveller{confirmed?.numberOfTravelers === 1 ? "" : "s"} · {inr(confirmed?.totalAmountInr)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setConfirmed(null)} variant="contained" sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
