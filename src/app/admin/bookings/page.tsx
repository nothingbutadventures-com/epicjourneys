"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

const fmt = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const idOf = (v: any): string => (v && typeof v === "object" ? String(v._id) : String(v || ""));

// ---------- booking helpers ----------

const holdExpired = (b: any) => b.status === "pending" && b.holdExpiresAt && new Date(b.holdExpiresAt).getTime() < Date.now();

/** Seats a booking currently occupies (cancelled bookings and expired unpaid holds free their seats). */
const holdsSeats = (b: any) => b.status !== "cancelled" && !holdExpired(b);

/** Money summary. Older bookings (before online payments) have no instalments: confirmed = paid in full. */
function money(b: any) {
  const total = b.totalAmountInr || 0;
  const hasPlan = Array.isArray(b.installments) && b.installments.length > 0;
  const paid = hasPlan ? b.amountPaidInr || 0 : b.status === "confirmed" ? total : 0;
  const nextDue = hasPlan ? b.installments.find((i: any) => i.status !== "paid") : null;
  const overdue = Boolean(nextDue && nextDue.index > 0 && new Date(nextDue.dueDate).getTime() < Date.now());
  const pay: "paid" | "partial" | "unpaid" = paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
  return { total, paid, balance: Math.max(0, total - paid), pay, overdue, nextDue };
}

const chip = (label: string, bg: string, fg: string) => (
  <Chip label={label} size="small" sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: bg, color: fg }} />
);

const statusChip = (b: any) => {
  if (holdExpired(b)) return chip("Expired", "#f1f5f9", "#64748b");
  if (b.status === "confirmed") return chip("Confirmed", "#ecfdf5", "#059669");
  if (b.status === "pending") return chip("Pending", "#fffbeb", "#d97706");
  return chip("Cancelled", "#fef2f2", "#dc2626");
};

const payChip = (b: any) => {
  const m = money(b);
  if (m.overdue) return chip("Overdue", "#fef2f2", "#dc2626");
  if (m.pay === "paid") return chip("Paid", "#ecfdf5", "#059669");
  if (m.pay === "partial") return chip("Part paid", "#eff6ff", "#2563eb");
  return chip("Unpaid", "#f8fafc", "#64748b");
};

const travelerLine = (b: any) =>
  b.travellers?.length ? b.travellers.map((t: any) => `${t.firstName} ${t.lastName}`).join(", ") : b.customerName;

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const filterLabelSx = { fontSize: "0.8rem" };

/** Starting address attached to a departure (resolved from the city's address book). */
const addressOfDeparture = (dep: any) => {
  const city = dep?.cityId;
  if (!dep?.addressId || !city || typeof city !== "object") return null;
  const a = (city.addresses || []).find((x: any) => String(x._id) === String(dep.addressId));
  if (!a) return null;
  // Empty numbers fall back to the city partner's numbers.
  const partner = city.partnerId && typeof city.partnerId === "object" ? city.partnerId : null;
  return { ...a, mobile: a.mobile || partner?.phone || "", secondaryMobile: a.secondaryMobile || partner?.secondaryPhone || "" };
};

export default function AdminBookingsPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"bookings" | "dates">("bookings");

  // bookings view filters
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [payF, setPayF] = useState("all");
  const [tourF, setTourF] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // dates view filters
  const [dTourF, setDTourF] = useState("all");
  const [dWhen, setDWhen] = useState("upcoming");
  const [manifestKey, setManifestKey] = useState<string | null>(null);

  // detail drawer
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("confirmed");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const token = () => (typeof window !== "undefined" ? localStorage.getItem("epic_token") : null);
  const authHeaders = (): Record<string, string> => {
    const t = token();
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, bRes] = await Promise.all([
        fetch("/api/tours?all=true", { headers: authHeaders() }).then((r) => r.json()),
        fetch("/api/bookings", { headers: authHeaders() }).then((r) => r.json()),
      ]);
      if (!tRes.success) throw new Error(tRes.error || "Failed to load tours");
      if (!bRes.success) throw new Error(bRes.error || "Failed to load bookings");
      setTours(tRes.data || []);
      setBookings(bRes.data || []);
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

  // ---------- summary ----------
  const summary = useMemo(() => {
    const live = bookings.filter((b) => b.status !== "cancelled" && !holdExpired(b));
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    return {
      total: bookings.length,
      confirmed: confirmed.length,
      pending: bookings.filter((b) => b.status === "pending" && !holdExpired(b)).length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      travellers: live.reduce((n, b) => n + (b.numberOfTravelers || 0), 0),
      collected: live.reduce((n, b) => n + money(b).paid, 0),
      outstanding: confirmed.reduce((n, b) => n + money(b).balance, 0),
      overdue: confirmed.filter((b) => money(b).overdue).length,
    };
  }, [bookings]);

  // ---------- bookings view ----------
  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusF === "expired" ? !holdExpired(b) : statusF !== "all" && (b.status !== statusF || holdExpired(b))) return false;
      if (payF !== "all") {
        const m = money(b);
        if (payF === "overdue" ? !m.overdue : m.pay !== payF) return false;
      }
      if (tourF !== "all" && idOf(b.tourId) !== tourF) return false;
      if (q) {
        const hay = [b.bookingRef, b.customerName, b.customerEmail, b.customerPhone, b.tourTitle, b.departureCity, travelerLine(b)]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bookings, search, statusF, payF, tourF]);

  useEffect(() => setPage(0), [search, statusF, payF, tourF, rowsPerPage]);
  const pageRows = filteredBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const exportBookings = () =>
    downloadCsv(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Reference", "Status", "Customer", "Email", "Phone", "Tour", "Start & end city", "Travel start", "Travel end", "Travellers", "Total (INR)", "Paid (INR)", "Balance (INR)", "Payment", "Channel", "Booked on"],
      ...filteredBookings.map((b) => {
        const m = money(b);
        return [
          b.bookingRef, b.status, b.customerName, b.customerEmail, b.customerPhone, b.tourTitle, b.departureCity || "",
          fmt(b.travelDate), b.travelEndDate ? fmt(b.travelEndDate) : "", b.numberOfTravelers, m.total, m.paid, m.balance,
          m.overdue ? "overdue" : m.pay, b.bookedByRole === "partner" ? `Partner: ${b.partnerId?.name || ""}` : "Website", fmt(b.createdAt),
        ];
      }),
    ]);

  // ---------- dates view ----------
  const departureRows = useMemo(() => {
    const rows: any[] = [];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    for (const t of tours) {
      if (dTourF !== "all" && String(t._id) !== dTourF) continue;
      for (const d of t.departures || []) {
        const upcoming = new Date(d.endDate).getTime() >= startOfToday.getTime();
        if (dWhen === "upcoming" && !upcoming) continue;
        if (dWhen === "past" && upcoming) continue;
        const list = bookings.filter((b) => b.departureId && String(b.departureId) === String(d._id));
        const live = list.filter(holdsSeats);
        const booked = live.reduce((n, b) => n + (b.numberOfTravelers || 0), 0);
        rows.push({
          key: String(d._id),
          tour: t,
          dep: d,
          city: d.cityId?.name || t.startingPoint,
          bookings: list,
          booked,
          seats: d.seats,
          paid: live.reduce((n, b) => n + money(b).paid, 0),
          balance: list.filter((b) => b.status === "confirmed").reduce((n, b) => n + money(b).balance, 0),
        });
      }
    }
    rows.sort((a, b) => +new Date(a.dep.startDate) - +new Date(b.dep.startDate));
    return rows;
  }, [tours, bookings, dTourF, dWhen]);

  const manifest = departureRows.find((r) => r.key === manifestKey) || null;
  const manifestPeople = useMemo(() => {
    if (!manifest) return [];
    return manifest.bookings
      .filter(holdsSeats)
      .flatMap((b: any) =>
        b.travellers?.length
          ? b.travellers.map((t: any, i: number) => ({
              name: `${t.firstName} ${t.lastName}`, age: t.age, phone: t.phone, room: t.roomType, primary: i === 0, booking: b,
            }))
          : [{ name: b.customerName, age: "", phone: b.customerPhone, room: "", primary: true, booking: b, extra: b.numberOfTravelers - 1 }]
      );
  }, [manifest]);

  const exportManifest = () => {
    if (!manifest) return;
    downloadCsv(`manifest-${manifest.tour.slug}-${String(manifest.dep.startDate).slice(0, 10)}.csv`, [
      ["Name", "Age", "Phone", "Room", "Booking", "Booking status", "Payment"],
      ...manifestPeople.map((p: any) => [p.name, p.age, p.phone, p.room, p.booking.bookingRef, p.booking.status, money(p.booking).overdue ? "overdue" : money(p.booking).pay]),
    ]);
  };

  // ---------- detail drawer ----------
  const active = bookings.find((b) => b._id === activeId) || null;
  const openBooking = (b: any) => {
    setActiveId(b._id);
    setNewStatus(b.status);
    setActionError(null);
  };

  const patch = async (payload: Record<string, unknown>) => {
    if (!active) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/bookings/${active._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      const u = data.data;
      setBookings((prev) =>
        prev.map((b) =>
          b._id === active._id
            ? { ...b, status: u.status, installments: u.installments, amountPaidInr: u.amountPaidInr, paymentStatus: u.paymentStatus, holdExpiresAt: u.holdExpiresAt }
            : b
        )
      );
      setNewStatus(u.status);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const activeMoney = active ? money(active) : null;
  const activeAddress = useMemo(() => {
    if (!active) return null;
    const tour = tours.find((t) => String(t._id) === idOf(active.tourId));
    const dep = (tour?.departures || []).find((d: any) => String(d._id) === String(active.departureId));
    return addressOfDeparture(dep);
  }, [active, tours]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Bookings
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            All bookings, payments and departure manifests across every tour
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />} onClick={load} sx={{ borderRadius: "4px" }}>
            Refresh
          </Button>
          <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon sx={{ fontSize: 16 }} />} onClick={exportBookings} disabled={!filteredBookings.length} sx={{ borderRadius: "4px" }}>
            Export CSV
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }, gap: 1.5, mb: 2.5 }}>
        {[
          { label: "Total bookings", value: summary.total },
          { label: "Confirmed", value: summary.confirmed, sub: `${summary.pending} pending · ${summary.cancelled} cancelled` },
          { label: "Travellers", value: summary.travellers },
          { label: "Collected", value: inr(summary.collected) },
          { label: "Outstanding", value: inr(summary.outstanding), sub: summary.overdue ? `${summary.overdue} overdue` : undefined, warn: summary.overdue > 0 },
          { label: "Overdue balances", value: summary.overdue, warn: summary.overdue > 0 },
        ].map((c) => (
          <Paper key={c.label} elevation={0} sx={{ p: 1.75, borderRadius: "4px", border: "1px solid #e2e8f0" }}>
            <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</Typography>
            <Typography sx={{ fontSize: "1.3rem", fontWeight: 700, color: c.warn ? "#dc2626" : "#0f172a", lineHeight: 1.3 }}>{c.value}</Typography>
            {c.sub && <Typography sx={{ fontSize: "0.68rem", color: c.warn ? "#dc2626" : "#94a3b8" }}>{c.sub}</Typography>}
          </Paper>
        ))}
      </Box>

      <Tabs
        value={view}
        onChange={(_, v) => setView(v)}
        sx={{ mb: 2, minHeight: 36, borderBottom: "1px solid #e2e8f0", "& .MuiTab-root": { minHeight: 36, fontSize: "0.82rem", textTransform: "none", fontWeight: 600 }, "& .MuiTabs-indicator": { bgcolor: "#0f172a" } }}
      >
        <Tab value="bookings" label={`All bookings (${bookings.length})`} />
        <Tab value="dates" label="By tour & date" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={24} />
        </Box>
      ) : view === "bookings" ? (
        <>
          {/* Filters */}
          <Box sx={{ display: "flex", gap: 1.25, mb: 2, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search reference, name, email, phone, tour…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 280, flex: 1, maxWidth: 420 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={filterLabelSx}>Status</InputLabel>
              <Select value={statusF} label="Status" onChange={(e) => setStatusF(e.target.value)}>
                <MenuItem value="all">All statuses</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="pending">Pending payment</MenuItem>
                <MenuItem value="expired">Expired holds</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={filterLabelSx}>Payment</InputLabel>
              <Select value={payF} label="Payment" onChange={(e) => setPayF(e.target.value)}>
                <MenuItem value="all">All payments</MenuItem>
                <MenuItem value="paid">Paid in full</MenuItem>
                <MenuItem value="partial">Part paid</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={filterLabelSx}>Tour</InputLabel>
              <Select value={tourF} label="Tour" onChange={(e) => setTourF(e.target.value)}>
                <MenuItem value="all">All tours</MenuItem>
                {tours.map((t) => (
                  <MenuItem key={t._id} value={String(t._id)}>{t.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Tour & departure</TableCell>
                    <TableCell>Pax</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Booked</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageRows.map((b) => {
                    const m = money(b);
                    return (
                      <TableRow key={b._id} hover onClick={() => openBooking(b)} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem", whiteSpace: "nowrap" }}>{b.bookingRef}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>{b.customerName}</Typography>
                          <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>{b.customerPhone}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography sx={{ fontSize: "0.8rem", color: "#0f172a" }} noWrap>{b.tourTitle}</Typography>
                          <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }} noWrap>
                            {fmt(b.travelDate)}{b.departureCity ? ` · ${b.departureCity}` : ""}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{b.numberOfTravelers}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{inr(m.total)}</TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", color: "#475569" }}>
                          {inr(m.paid)}
                          {m.balance > 0 && b.status !== "cancelled" && (
                            <Typography component="span" sx={{ display: "block", fontSize: "0.68rem", color: "#d97706" }}>{inr(m.balance)} due</Typography>
                          )}
                        </TableCell>
                        <TableCell>{b.status === "cancelled" ? "—" : payChip(b)}</TableCell>
                        <TableCell>{statusChip(b)}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>{fmt(b.createdAt)}</TableCell>
                        <TableCell align="right"><ChevronRightRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} /></TableCell>
                      </TableRow>
                    );
                  })}
                  {pageRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>
                        No bookings match these filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredBookings.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[15, 30, 50]}
              sx={{ borderTop: "1px solid #f1f5f9", "& .MuiTablePagination-toolbar": { minHeight: 44 }, fontSize: "0.78rem" }}
            />
          </Paper>
        </>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 1.25, mb: 2, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel sx={filterLabelSx}>Tour</InputLabel>
              <Select value={dTourF} label="Tour" onChange={(e) => setDTourF(e.target.value)}>
                <MenuItem value="all">All tours</MenuItem>
                {tours.map((t) => (
                  <MenuItem key={t._id} value={String(t._id)}>{t.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={filterLabelSx}>Departures</InputLabel>
              <Select value={dWhen} label="Departures" onChange={(e) => setDWhen(e.target.value)}>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="past">Past</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tour</TableCell>
                    <TableCell>Start & end city</TableCell>
                    <TableCell>Starting address</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Seats (booked / total)</TableCell>
                    <TableCell>Availability</TableCell>
                    <TableCell>Bookings</TableCell>
                    <TableCell>Collected</TableCell>
                    <TableCell>Balance due</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departureRows.map((r) => {
                    const left = r.seats - r.booked;
                    return (
                      <TableRow key={r.key} hover onClick={() => setManifestKey(r.key)} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }} noWrap>{r.tour.title}</Typography>
                          {!r.tour.isActive && <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>Inactive tour</Typography>}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{r.city}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", color: "#64748b", maxWidth: 180 }}>
                          <Typography noWrap sx={{ fontSize: "0.75rem" }}>{addressOfDeparture(r.dep)?.label || "—"}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{fmt(r.dep.startDate)} – {fmt(r.dep.endDate)}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{r.booked} / {r.seats}</TableCell>
                        <TableCell>
                          {left <= 0 ? chip("Sold out", "#fef2f2", "#dc2626") : left <= 3 ? chip(`${left} left`, "#fffbeb", "#d97706") : chip(`${left} left`, "#ecfdf5", "#059669")}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{r.bookings.length}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{inr(r.paid)}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", color: r.balance > 0 ? "#d97706" : "#94a3b8" }}>{inr(r.balance)}</TableCell>
                        <TableCell align="right"><ChevronRightRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} /></TableCell>
                      </TableRow>
                    );
                  })}
                  {departureRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>
                        No departures found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Departure manifest */}
      <Dialog
        open={Boolean(manifest)}
        onClose={() => setManifestKey(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}
      >
        {manifest && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
              {manifest.tour.title}
              <Typography variant="caption" sx={{ display: "block", color: "#64748b", fontWeight: 400 }}>
                {manifest.city} · {fmt(manifest.dep.startDate)} – {fmt(manifest.dep.endDate)}
              </Typography>
              {addressOfDeparture(manifest.dep) && (
                <Typography variant="caption" sx={{ display: "block", color: "#64748b", fontWeight: 400 }}>
                  Starts at {addressOfDeparture(manifest.dep).label}, {addressOfDeparture(manifest.dep).address}
                </Typography>
              )}
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 1.25, mb: 2 }}>
                {[
                  ["Seats booked", `${manifest.booked} / ${manifest.seats}`],
                  ["Bookings", String(manifest.bookings.length)],
                  ["Collected", inr(manifest.paid)],
                  ["Balance due", inr(manifest.balance)],
                ].map(([l, v]) => (
                  <Box key={l} sx={{ p: 1.25, border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                    <Typography sx={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{l}</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{v}</Typography>
                  </Box>
                ))}
              </Box>
              {manifestPeople.length === 0 ? (
                <Typography sx={{ color: "#94a3b8", fontSize: "0.82rem", py: 2 }}>No travellers booked on this departure yet.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Traveller</TableCell>
                        <TableCell>Age</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Room</TableCell>
                        <TableCell>Booking</TableCell>
                        <TableCell>Payment</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {manifestPeople.map((p: any, i: number) => (
                        <TableRow key={i} hover onClick={() => { setManifestKey(null); openBooking(p.booking); }} sx={{ cursor: "pointer" }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                            {p.name}
                            {p.primary && <Typography component="span" sx={{ ml: 0.75, fontSize: "0.68rem", color: "#94a3b8" }}>primary</Typography>}
                            {p.extra > 0 && <Typography component="span" sx={{ ml: 0.75, fontSize: "0.68rem", color: "#94a3b8" }}>+{p.extra} more</Typography>}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8rem" }}>{p.age || "—"}</TableCell>
                          <TableCell sx={{ fontSize: "0.78rem", color: "#64748b" }}>{p.phone}</TableCell>
                          <TableCell sx={{ fontSize: "0.78rem", textTransform: "capitalize" }}>{p.room || "—"}</TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }}>{p.booking.bookingRef}</TableCell>
                          <TableCell>{payChip(p.booking)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 1 }}>
              <Button startIcon={<DownloadRoundedIcon sx={{ fontSize: 16 }} />} onClick={exportManifest} disabled={!manifestPeople.length} sx={{ color: "#0f172a" }}>
                Export manifest
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button onClick={() => setManifestKey(null)} sx={{ color: "#64748b" }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Booking detail drawer */}
      <Drawer anchor="right" open={Boolean(active)} onClose={() => setActiveId(null)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 540 }, borderRadius: 0 } } }}>
        {active && activeMoney && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>Booking {active.bookingRef}</Typography>
                <Box sx={{ display: "flex", gap: 0.75, mt: 0.75, alignItems: "center" }}>
                  {statusChip(active)}
                  {active.status !== "cancelled" && payChip(active)}
                  <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>Booked {fmt(active.createdAt)}</Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setActiveId(null)}><CloseRoundedIcon fontSize="small" /></IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
              {actionError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setActionError(null)}>{actionError}</Alert>}

              <Section title="Customer">
                <Fields rows={[["Name", active.customerName], ["Email", active.customerEmail], ["Phone", active.customerPhone]]} />
              </Section>

              <Section title="Trip">
                <Fields
                  rows={[
                    ["Tour", active.tourTitle],
                    ["Start & end city", active.departureCity || "—"],
                    ["Travel dates", active.travelEndDate ? `${fmt(active.travelDate)} – ${fmt(active.travelEndDate)}` : fmt(active.travelDate)],
                    ["Travellers", String(active.numberOfTravelers)],
                    ["Channel", active.bookedByRole === "partner" ? `Partner: ${active.partnerId?.name || "Local agent"}` : "Website"],
                  ]}
                />
              </Section>

              <Section title="Starting address">
                {activeAddress ? (
                  <>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{activeAddress.label}</Typography>
                    <Typography sx={{ fontSize: "0.82rem", color: "#334155", whiteSpace: "pre-line" }}>
                      {activeAddress.address}{activeAddress.pincode ? ` — ${activeAddress.pincode}` : ""}
                    </Typography>
                    {activeAddress.landmark && <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>Landmark: {activeAddress.landmark}</Typography>}
                    <Typography sx={{ fontSize: "0.8rem", color: "#475569", mt: 0.5 }}>
                      {[activeAddress.mobile && `+91 ${activeAddress.mobile}`, activeAddress.secondaryMobile && `+91 ${activeAddress.secondaryMobile}`].filter(Boolean).join(" · ") || "No contact number added"}
                    </Typography>
                  </>
                ) : (
                  <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>No starting address attached to this date.</Typography>
                )}
              </Section>

              {active.travellers?.length > 0 && (
                <Section title={`Travellers (${active.travellers.length})`}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Age</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Room</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {active.travellers.map((t: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.firstName} {t.lastName}{i === 0 ? " (primary)" : ""}</TableCell>
                          <TableCell sx={{ fontSize: "0.8rem" }}>{t.age}</TableCell>
                          <TableCell sx={{ fontSize: "0.78rem", color: "#64748b" }}>{t.phone}</TableCell>
                          <TableCell sx={{ fontSize: "0.78rem", textTransform: "capitalize" }}>{t.roomType}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Section>
              )}

              <Section title="Pricing">
                <Fields
                  rows={[
                    ["Price per person", inr(active.pricePerPerson)],
                    ["Single room supplement", active.roomSupplementInr ? inr(active.roomSupplementInr) : "—"],
                    ["Total", inr(activeMoney.total)],
                    ["Paid", inr(activeMoney.paid)],
                    ["Balance", inr(activeMoney.balance)],
                  ]}
                />
              </Section>

              <Section title={active.paymentStrategy === "deposit" ? "Payment schedule (deposit plan)" : "Payments"}>
                {active.installments?.length ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Instalment</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Due</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {active.installments.map((i: any) => {
                        const paid = i.status === "paid";
                        const late = !paid && i.index > 0 && new Date(i.dueDate).getTime() < Date.now();
                        return (
                          <TableRow key={i.index}>
                            <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{i.label}</TableCell>
                            <TableCell sx={{ fontSize: "0.8rem" }}>{inr(i.amountInr)}</TableCell>
                            <TableCell sx={{ fontSize: "0.75rem", color: late ? "#dc2626" : "#64748b" }}>{fmt(i.dueDate)}</TableCell>
                            <TableCell>
                              {paid
                                ? chip(`Paid ${i.paidAt ? fmt(i.paidAt) : ""}${i.simulated ? " · test" : i.offline ? " · offline" : ""}`, "#ecfdf5", "#059669")
                                : late ? chip("Overdue", "#fef2f2", "#dc2626") : chip("Pending", "#f8fafc", "#64748b")}
                            </TableCell>
                            <TableCell align="right">
                              {!paid && active.status !== "cancelled" && (
                                <Button
                                  size="small"
                                  disabled={saving}
                                  onClick={() => window.confirm(`Record ${inr(i.amountInr)} as received for "${i.label}"?`) && patch({ markInstallmentPaid: i.index })}
                                  sx={{ fontSize: "0.72rem", color: "#0f172a" }}
                                >
                                  Mark paid
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {active.status === "confirmed" ? "Recorded as paid in full (booking made before online payments)." : "No payment recorded."}
                  </Typography>
                )}
              </Section>

              {active.specialRequests && (
                <Section title="Special requests">
                  <Typography sx={{ fontSize: "0.85rem" }}>{active.specialRequests}</Typography>
                </Section>
              )}
            </Box>

            <Divider />
            <Box sx={{ px: 2.5, py: 2, display: "flex", gap: 1.25, alignItems: "center" }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Booking status</InputLabel>
                <Select value={newStatus} label="Booking status" onChange={(e) => setNewStatus(e.target.value)}>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                disabled={saving || newStatus === active.status}
                onClick={() =>
                  (newStatus !== "cancelled" || window.confirm("Cancel this booking? Its seats will be released.")) && patch({ status: newStatus })
                }
                sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
              >
                {saving ? "Saving…" : "Save status"}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>{title}</Typography>
      {children}
    </Box>
  );
}

function Fields({ rows }: { rows: [string, string][] }) {
  return (
    <Grid container spacing={1.25}>
      {rows.map(([label, value]) => (
        <Grid size={{ xs: 12, sm: 6 }} key={label}>
          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>{label}</Typography>
          <Typography sx={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 500, wordBreak: "break-word" }}>{value}</Typography>
        </Grid>
      ))}
    </Grid>
  );
}
