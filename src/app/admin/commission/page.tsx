"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
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
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";

const TOKEN = "epic_token";
const headers = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

interface TourSummary {
  tourId: string;
  title: string;
  destination: string;
  partner: string;
  percent: number;
  bookings: number;
  sales: number;
  commissionPaid: number;
  commissionPending: number;
  partnerPaid: number;
}

interface CommissionData {
  tours: TourSummary[];
  rows: Array<{
    bookingId: string;
    bookingRef: string;
    tourId: string;
    tour: string;
    partner: string;
    customer: string;
    travelDate: string;
    status: string;
    total: number;
    paid: number;
    percent: number;
    commissionPaid: number;
    commissionPending: number;
    partnerPaid: number;
  }>;
  totals: {
    tours: number;
    bookings: number;
    sales: number;
    commissionPaid: number;
    commissionPending: number;
    partnerPaid: number;
  };
}

export default function AdminCommissionPage() {
  const [data, setData] = useState<CommissionData | null>(null);
  const [search, setSearch] = useState("");
  const [tourFilter, setTourFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    fetch(`/api/partner-commission?status=${statusFilter}&tourId=${tourFilter === "all" ? "" : tourFilter}`, { headers: headers(), cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Could not load commissions.");
        return body;
      })
      .then((body) => setData(body.data))
      .catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, [statusFilter, tourFilter]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.rows || []).filter((row) =>
      !q || `${row.bookingRef} ${row.customer} ${row.tour} ${row.partner}`.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <Box sx={{ maxWidth: 1280 }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Partner Commission</Typography>
        <Typography sx={{ color: "#64748b", fontSize: 14 }}>
          Track platform commission and the amount paid out to partners for every partner-managed tour.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!data && !error && <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}

      {data && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5, mb: 3 }}>
            {[
              ["Partner tours", data.totals.tours, "#0f172a"],
              ["Paid bookings", data.totals.bookings, "#0f172a"],
              ["Platform commission", inr(data.totals.commissionPaid), "#2563eb"],
              ["Partner payout", inr(data.totals.partnerPaid), "#059669"],
            ].map(([label, value, color]) => (
              <Paper key={String(label)} elevation={0} sx={{ p: 1.75, border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                <Typography sx={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{label}</Typography>
                <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color }}>{value}</Typography>
              </Paper>
            ))}
          </Box>

          <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 1 }}>Commission by tour</Typography>
          <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", mb: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Tour</TableCell><TableCell>Partner</TableCell><TableCell>Rate</TableCell>
                  <TableCell align="right">Bookings</TableCell><TableCell align="right">Paid sales</TableCell>
                  <TableCell align="right">Platform commission</TableCell><TableCell align="right">Partner payout</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {data.tours.map((tour) => (
                    <TableRow key={tour.tourId} hover>
                      <TableCell><Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>{tour.title}</Typography><Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{tour.destination}</Typography></TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{tour.partner}</TableCell>
                      <TableCell><Chip label={`${tour.percent}%`} size="small" sx={{ height: 22, borderRadius: "4px", fontWeight: 700, bgcolor: "#eff6ff", color: "#2563eb" }} /></TableCell>
                      <TableCell align="right">{tour.bookings}</TableCell>
                      <TableCell align="right">{inr(tour.sales)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#2563eb" }}>{inr(tour.commissionPaid)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#059669" }}>{inr(tour.partnerPaid)}</TableCell>
                    </TableRow>
                  ))}
                  {data.tours.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "#94a3b8" }}>No partner tours found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1rem" }}>Booking-level commission</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <TextField size="small" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tour, partner, booking…" />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Tour</InputLabel>
                <Select value={tourFilter} label="Tour" onChange={(e) => setTourFilter(e.target.value)}>
                  <MenuItem value="all">All tours</MenuItem>
                  {data.tours.map((tour) => <MenuItem key={tour.tourId} value={tour.tourId}>{tour.title}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">All statuses</MenuItem><MenuItem value="confirmed">Confirmed</MenuItem><MenuItem value="pending">Pending</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "6px" }}>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Booking</TableCell><TableCell>Tour / Partner</TableCell><TableCell>Travel date</TableCell><TableCell>Status</TableCell>
                  <TableCell align="right">Paid</TableCell><TableCell align="right">Rate</TableCell><TableCell align="right">Platform commission</TableCell><TableCell align="right">Partner payout</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.bookingId} hover>
                      <TableCell><Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{row.bookingRef}</Typography><Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{row.customer}</Typography></TableCell>
                      <TableCell><Typography noWrap sx={{ maxWidth: 220, fontSize: "0.78rem" }}>{row.tour}</Typography><Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{row.partner}</Typography></TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.78rem" }}>{fmt(row.travelDate)}</TableCell>
                      <TableCell><Chip label={row.status} size="small" sx={{ height: 21, borderRadius: "4px", fontSize: "0.68rem", textTransform: "capitalize" }} /></TableCell>
                      <TableCell align="right">{inr(row.paid)}</TableCell><TableCell align="right">{row.percent}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#2563eb" }}>{inr(row.commissionPaid)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#059669" }}>{inr(row.partnerPaid)}</TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: "#94a3b8" }}>No bookings match these filters.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
