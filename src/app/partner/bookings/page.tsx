"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import Link from "next/link";
import PaymentGateway, { type PaymentDescriptor } from "@/components/checkout/PaymentGateway";

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
      bgcolor: status === "confirmed" || status === "paid" ? "#ecfdf5" : status === "pending" || status === "partial" ? "#fffbeb" : "#fef2f2",
      color: status === "confirmed" || status === "paid" ? "#059669" : status === "pending" || status === "partial" ? "#d97706" : "#dc2626",
    }}
  />
);

export default function PartnerBookingsPage() {
  const [partner, setPartner] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState<PaymentDescriptor | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const load = async () => {
    try {
      const h = authHeaders();
      const me = await fetch("/api/partners", { headers: h }).then((r) => r.json());
      const p = me.data?.[0] || null;
      const b = await fetch("/api/bookings", { headers: h }).then((r) => r.json());
      if (b.success) setBookings(b.data || []);
      else setError(b.error || "Failed to load bookings");
      setPartner(p);
    } catch (e: any) {
      setError(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => (statusFilter === "all" || b.status === statusFilter) && (!q || `${b.bookingRef} ${b.customerName} ${b.customerPhone} ${b.tourTitle}`.toLowerCase().includes(q)));
  }, [bookings, search, statusFilter]);

  // Collect the next unpaid instalment of an existing booking (balance or an abandoned payment).
  const collect = async (b: any) => {
    const next = (b.installments || []).filter((i: any) => i.status !== "paid").sort((a: any, c: any) => a.index - c.index)[0];
    if (!next) return;
    setPaying(b._id);
    setError(null);
    try {
      const res = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ref: b.bookingRef, index: next.index }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't start the payment");
      setPayment(data.payment);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPaying(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>Bookings</Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Track and manage every booking you made for customers · book new ones from Book Tour
          </Typography>
        </Box>
        <Button component={Link} href="/partner/city-tours" variant="contained" size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
          sx={{ bgcolor: "#0f172a", color: "#ffffff", borderRadius: "4px", height: 30, fontSize: "0.78rem", "&:hover": { bgcolor: "#1e293b" } }}>
          Book a Tour
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, gap: 1.5, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {[["all", "All"], ["confirmed", "Confirmed"], ["pending", "Pending"], ["cancelled", "Cancelled"]].map(([v, l]) => (
            <Chip key={v} label={`${l} (${v === "all" ? bookings.length : bookings.filter((b) => b.status === v).length})`} size="small" clickable onClick={() => setStatusFilter(v)}
              sx={{ borderRadius: "4px", fontSize: "0.72rem", fontWeight: 600, bgcolor: statusFilter === v ? "#0f172a" : "#f1f5f9", color: statusFilter === v ? "#fff" : "#475569", "&:hover": { bgcolor: statusFilter === v ? "#1e293b" : "#e2e8f0" } }} />
          ))}
        </Box>
        <TextField size="small" placeholder="Search bookings…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
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
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((b) => {
                  const due = Math.max(0, (b.totalAmountInr || 0) - (b.amountPaidInr || 0));
                  const canCollect = b.status !== "cancelled" && due > 0 && (b.installments || []).some((i: any) => i.status !== "paid");
                  return (
                    <TableRow key={b._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem", whiteSpace: "nowrap" }}>{b.bookingRef}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>{b.customerName}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>{b.customerPhone}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography noWrap sx={{ fontSize: "0.8rem" }}>{b.tourTitle || b.tourId?.title}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{fmt(b.travelDate)}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{b.numberOfTravelers}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{inr(b.totalAmountInr)}</Typography>
                        {b.partnerDiscountInr > 0 && <Typography sx={{ fontSize: "0.66rem", color: "#c2410c" }}>incl. − {inr(b.partnerDiscountInr)} partner discount</Typography>}
                      </TableCell>
                      <TableCell>
                        {statusChip(b.paymentStatus || "paid")}
                        {due > 0 && b.status !== "cancelled" && <Typography sx={{ fontSize: "0.66rem", color: "#64748b" }}>{inr(due)} due</Typography>}
                      </TableCell>
                      <TableCell>{statusChip(b.status)}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Button component={Link} href={`/partner/invoice/${b.bookingRef}`} size="small" startIcon={<ReceiptLongRoundedIcon sx={{ fontSize: 14 }} />} sx={{ fontSize: "0.7rem", color: "#0f172a", mr: canCollect ? 0.5 : 0 }}>
                          Invoice
                        </Button>
                        {canCollect && (
                          <Button size="small" variant="outlined" disabled={paying === b._id} onClick={() => collect(b)} sx={{ borderRadius: "4px", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                            {paying === b._id ? "…" : "Collect payment"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>
                      {bookings.length === 0 ? "No bookings yet" : "No bookings match your search"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <PaymentGateway payment={payment} headers={authHeaders()} onSuccess={() => { setPayment(null); load(); }} onClose={() => setPayment(null)} />
    </Box>
  );
}
