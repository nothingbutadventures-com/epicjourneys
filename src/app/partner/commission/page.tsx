"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const TOKEN = "epic_partner_token";
const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN) : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const monthLabel = (m: string) => new Date(`${m}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const statusColors: Record<string, [string, string]> = { confirmed: ["#ecfdf5", "#059669"], pending: ["#fffbeb", "#d97706"], cancelled: ["#fef2f2", "#dc2626"] };

export default function PartnerCommissionPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/partner/commission", { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => (d.success ? setData(d.data) : setError(d.error || "Couldn't load your commission")))
      .catch(() => setError("Couldn't load your commission"));
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.rows || []).filter((r: any) => !q || `${r.bookingRef} ${r.customer} ${r.tour}`.toLowerCase().includes(q));
  }, [data, search]);

  const cards = data
    ? [
        { label: "Commission earned", value: inr(data.totals.earned), sub: `on ${inr(data.totals.sales)} paid by customers`, color: "#059669" },
        { label: "Pending commission", value: inr(data.totals.pending), sub: "when remaining balances are paid", color: "#d97706" },
        { label: "Your commission rate", value: `${data.percent}%`, sub: "set by EpicJourneys", color: "#0f172a" },
        { label: "Bookings counted", value: data.totals.bookings, sub: "for your location", color: "#0f172a" },
      ]
    : [];

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>Commission</Typography>
        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
          You earn a share of every booking made for your location, whoever booked it. It grows as customers pay.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>{error}</Alert>}
      {!data && !error && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={26} /></Box>}

      {data && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5, mb: 2.5 }}>
            {cards.map((c) => (
              <Paper key={c.label} elevation={0} sx={{ p: 1.75, borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</Typography>
                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: c.color, lineHeight: 1.3 }}>{c.value}</Typography>
                <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>{c.sub}</Typography>
              </Paper>
            ))}
          </Box>

          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 1 }}>By month</Typography>
          <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", mb: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Bookings</TableCell>
                    <TableCell align="right">Customer payments</TableCell>
                    <TableCell align="right">Commission earned</TableCell>
                    <TableCell align="right">Pending</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.months.map((m: any) => (
                    <TableRow key={m.month} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.82rem" }}>{monthLabel(m.month)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.82rem" }}>{m.bookings}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.82rem" }}>{inr(m.sales)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#059669" }}>{inr(m.earned)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.82rem", color: "#d97706" }}>{inr(m.pending)}</TableCell>
                    </TableRow>
                  ))}
                  {data.months.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3.5, color: "#94a3b8", fontSize: "0.8rem" }}>No commission yet. It appears as soon as a booking is made for your location.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, gap: 1.5, flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>Every booking</Typography>
            <TextField size="small" placeholder="Search bookings…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
          </Box>
          <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0" }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Booking</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Tour</TableCell>
                    <TableCell>Travel date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Booking total</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Earned ({data.percent}%)</TableCell>
                    <TableCell align="right">Pending</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r: any) => {
                    const [bg, fg] = statusColors[r.status] || statusColors.pending;
                    return (
                      <TableRow key={r.bookingId} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem", whiteSpace: "nowrap" }}>{r.bookingRef}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{r.customer}</TableCell>
                        <TableCell sx={{ maxWidth: 220 }}><Typography noWrap sx={{ fontSize: "0.8rem" }}>{r.tour}</Typography></TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{fmt(r.travelDate)}</TableCell>
                        <TableCell><Chip label={r.status} size="small" sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", fontWeight: 600, textTransform: "capitalize", bgcolor: bg, color: fg }} /></TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.8rem" }}>{inr(r.total)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.8rem" }}>{inr(r.paid)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.82rem", fontWeight: 700, color: r.status === "cancelled" ? "#94a3b8" : "#059669" }}>{inr(r.earned)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.8rem", color: "#d97706" }}>{inr(r.pending)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>{data.rows.length === 0 ? "No bookings yet" : "No bookings match your search"}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
