"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, CircularProgress, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const TOKEN = "epic_partner_token";
const authHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function PartnerCommissionPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/partner/commission", { headers: authHeaders(), cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Couldn't load your payouts.");
        return body;
      })
      .then((body) => setData(body.data))
      .catch((e) => setError(e.message || "Couldn't load your payouts."));
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.rows || []).filter((row: any) => !q || `${row.bookingRef} ${row.customer} ${row.tour} ${row.destination}`.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem" }}>Partner payouts</Typography>
        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
          You manage the tour and receive the booking amount after the global platform commission.
        </Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!data && !error && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={26} /></Box>}
      {data && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 1.5, mb: 2.5 }}>
            {[
              ["Platform commission", `${data.platformCommissionPercent}%`, "#2563eb"],
              ["Paid to you", inr(data.totals.payoutPaid), "#059669"],
              ["Pending payout", inr(data.totals.payoutPending), "#d97706"],
              ["Customer payments", inr(data.totals.paid), "#0f172a"],
              ["Bookings counted", data.totals.bookings, "#0f172a"],
            ].map(([label, value, color]) => (
              <Paper key={String(label)} elevation={0} sx={{ p: 1.75, border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{label}</Typography>
                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color }}>{value}</Typography>
              </Paper>
            ))}
          </Box>

          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 1 }}>Your tours</Typography>
          <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", mb: 3 }}>
            <TableContainer><Table size="small">
              <TableHead><TableRow><TableCell>Tour</TableCell><TableCell>Commission</TableCell><TableCell align="right">Bookings</TableCell><TableCell align="right">Paid</TableCell><TableCell align="right">Your payout</TableCell></TableRow></TableHead>
              <TableBody>
                {data.tours.map((tour: any) => (
                  <TableRow key={tour.tourId} hover>
                    <TableCell><Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>{tour.title}</Typography><Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{tour.destination}</Typography></TableCell>
                    <TableCell><Chip label={`${tour.percent}% platform`} size="small" sx={{ height: 21, borderRadius: "4px", bgcolor: "#eff6ff", color: "#2563eb", fontWeight: 700 }} /></TableCell>
                    <TableCell align="right">{tour.bookings}</TableCell><TableCell align="right">{inr(tour.paid)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#059669" }}>{inr(tour.payoutPaid)}</TableCell>
                  </TableRow>
                ))}
                {data.tours.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "#94a3b8" }}>No partner tour bookings yet.</TableCell></TableRow>}
              </TableBody>
            </Table></TableContainer>
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, gap: 1.5, flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>Booking details</Typography>
            <TextField size="small" placeholder="Search bookings or tours…" value={search} onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
          </Box>
          <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "4px" }}>
            <TableContainer><Table size="small">
              <TableHead><TableRow><TableCell>Booking</TableCell><TableCell>Tour</TableCell><TableCell>Travel date</TableCell><TableCell>Status</TableCell><TableCell align="right">Paid</TableCell><TableCell align="right">Platform commission</TableCell><TableCell align="right">Your payout</TableCell></TableRow></TableHead>
              <TableBody>
                {rows.map((row: any) => (
                  <TableRow key={row.bookingId} hover>
                    <TableCell><Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{row.bookingRef}</Typography><Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{row.customer}</Typography></TableCell>
                    <TableCell><Typography noWrap sx={{ maxWidth: 220, fontSize: "0.78rem" }}>{row.tour}</Typography><Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{row.destination}</Typography></TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.78rem" }}>{fmt(row.travelDate)}</TableCell>
                    <TableCell><Chip label={row.status} size="small" sx={{ height: 20, borderRadius: "4px", fontSize: "0.68rem", textTransform: "capitalize" }} /></TableCell>
                    <TableCell align="right">{inr(row.paid)}</TableCell><TableCell align="right" sx={{ color: "#2563eb", fontWeight: 700 }}>{inr(row.platformCommission)}</TableCell><TableCell align="right" sx={{ color: "#059669", fontWeight: 700 }}>{inr(row.payoutPaid)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "#94a3b8" }}>{data.rows.length ? "No bookings match your search." : "No bookings yet."}</TableCell></TableRow>}
              </TableBody>
            </Table></TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
