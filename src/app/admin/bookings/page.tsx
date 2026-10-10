"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

const fmt = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const idOf = (v: any): string => (v && typeof v === "object" ? String(v._id) : String(v || ""));

const statusSx = (status: string) => ({
  borderRadius: "4px",
  height: 18,
  fontSize: "0.65rem",
  fontWeight: 600,
  textTransform: "capitalize" as const,
  bgcolor: status === "confirmed" ? "#ecfdf5" : status === "pending" ? "#fffbeb" : "#fef2f2",
  color: status === "confirmed" ? "#059669" : status === "pending" ? "#d97706" : "#dc2626",
});

interface DateGroup {
  key: string;
  label: string;
  seats: number | null; // null for legacy, unscheduled bookings
  bookings: any[];
  booked: number;
}

export default function AdminBookingsPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Drill-down: tour -> date -> traveller
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);

  const [newStatus, setNewStatus] = useState("confirmed");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const token = localStorage.getItem("epic_token");
    try {
      const [tRes, bRes] = await Promise.all([
        fetch("/api/tours?all=true").then((r) => r.json()),
        fetch("/api/bookings", { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then((r) => r.json()),
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

  // Group each tour's bookings by scheduled date (departure), plus legacy unscheduled bookings.
  const groupsByTour = useMemo(() => {
    const map: Record<string, DateGroup[]> = {};
    for (const t of tours) {
      const tid = String(t._id);
      const tourBookings = bookings.filter((b) => idOf(b.tourId) === tid);
      const groups: DateGroup[] = [];

      for (const d of t.departures || []) {
        const list = tourBookings.filter((b) => b.departureId && String(b.departureId) === String(d._id));
        groups.push({
          key: String(d._id),
          label: `${d.cityId?.name ? d.cityId.name + " · " : ""}${fmt(d.startDate)} – ${fmt(d.endDate)}`,
          seats: d.seats,
          bookings: list,
          booked: list.filter((b) => b.status !== "cancelled").reduce((n, b) => n + b.numberOfTravelers, 0),
        });
      }

      const legacy: Record<string, any[]> = {};
      for (const b of tourBookings.filter((b) => !b.departureId)) {
        const day = new Date(b.travelDate).toISOString().split("T")[0];
        (legacy[day] = legacy[day] || []).push(b);
      }
      for (const [day, list] of Object.entries(legacy)) {
        groups.push({
          key: `legacy:${day}`,
          label: `${fmt(day)} (unscheduled)`,
          seats: null,
          bookings: list,
          booked: list.filter((b) => b.status !== "cancelled").reduce((n, b) => n + b.numberOfTravelers, 0),
        });
      }

      groups.sort((a, b) => a.label.localeCompare(b.label));
      map[tid] = groups;
    }
    return map;
  }, [tours, bookings]);

  const visibleTours = tours.filter((t) =>
    `${t.title} ${t.destinationId?.name || ""} ${t.state}`.toLowerCase().includes(search.toLowerCase())
  );

  const activeTour = tours.find((t) => String(t._id) === activeTourId) || null;
  const activeGroups = activeTourId ? groupsByTour[activeTourId] || [] : [];
  const activeGroup = activeGroups.find((g) => g.key === activeDateKey) || null;

  const closeAll = () => {
    setActiveTourId(null);
    setActiveDateKey(null);
  };

  const handleStatusUpdate = async () => {
    if (!activeBooking) return;
    setUpdating(true);
    const token = localStorage.getItem("epic_token");
    try {
      const res = await fetch(`/api/bookings/${activeBooking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b._id === activeBooking._id ? { ...b, status: newStatus } : b)));
        setActiveBooking({ ...activeBooking, status: newStatus });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Passenger Bookings
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Select a tour to see its dates, then a date to see its travellers
          </Typography>
        </Box>
        <TextField size="small" placeholder="Search tours..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tour</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Bookings</TableCell>
                  <TableCell>Travellers Booked</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleTours.map((t) => {
                  const groups = groupsByTour[String(t._id)] || [];
                  const all = groups.flatMap((g) => g.bookings);
                  const active = all.filter((b) => b.status !== "cancelled");
                  return (
                    <TableRow
                      key={t._id}
                      hover
                      onClick={() => setActiveTourId(String(t._id))}
                      sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#0f172a" }}>
                          {t.title}
                        </Typography>
                        {!t.isActive && (
                          <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.68rem" }}>
                            Inactive
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", color: "#475569" }}>
                        {t.destinationId?.name} ({t.state})
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{(t.departures || []).length}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{all.length}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{active.reduce((n, b) => n + b.numberOfTravelers, 0)}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>
                        ₹{active.reduce((n, b) => n + (b.totalAmountInr || 0), 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell align="right">
                        <ChevronRightRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {visibleTours.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>
                      No tours found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Tour dates / travellers dialog */}
      <Dialog
        open={Boolean(activeTour)}
        onClose={closeAll}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          {activeGroup && (
            <IconButton size="small" onClick={() => setActiveDateKey(null)} aria-label="Back to dates">
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
          )}
          <Box>
            {activeTour?.title}
            <Typography variant="caption" sx={{ display: "block", color: "#64748b", fontWeight: 400 }}>
              {activeGroup ? `Travellers on ${activeGroup.label}` : "Dates for this tour"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {!activeGroup ? (
            activeGroups.length === 0 ? (
              <Typography sx={{ color: "#94a3b8", fontSize: "0.82rem", py: 2 }}>This tour has no dates yet.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Dates</TableCell>
                      <TableCell>Seats</TableCell>
                      <TableCell>Booked</TableCell>
                      <TableCell>Available</TableCell>
                      <TableCell>Bookings</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeGroups.map((g) => (
                      <TableRow key={g.key} hover onClick={() => setActiveDateKey(g.key)} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>{g.label}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{g.seats ?? "-"}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{g.booked}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>
                          {g.seats === null ? "-" : (
                            <Chip
                              label={g.seats - g.booked <= 0 ? "Sold out" : g.seats - g.booked}
                              size="small"
                              sx={{
                                borderRadius: "4px",
                                height: 18,
                                fontSize: "0.65rem",
                                fontWeight: 600,
                                bgcolor: g.seats - g.booked <= 0 ? "#fef2f2" : "#ecfdf5",
                                color: g.seats - g.booked <= 0 ? "#dc2626" : "#059669",
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{g.bookings.length}</TableCell>
                        <TableCell align="right">
                          <ChevronRightRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : activeGroup.bookings.length === 0 ? (
            <Typography sx={{ color: "#94a3b8", fontSize: "0.82rem", py: 2 }}>No bookings for this date yet.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Traveller</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Pax</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeGroup.bookings.map((b) => (
                    <TableRow
                      key={b._id}
                      hover
                      onClick={() => {
                        setActiveBooking(b);
                        setNewStatus(b.status);
                      }}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>{b.customerName}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", color: "#64748b" }}>{b.customerPhone}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{b.numberOfTravelers}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>₹{b.totalAmountInr?.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Chip label={b.status} size="small" sx={statusSx(b.status)} />
                      </TableCell>
                      <TableCell align="right">
                        <ChevronRightRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={closeAll} sx={{ color: "#64748b" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Traveller booking details */}
      <Dialog
        open={Boolean(activeBooking)}
        onClose={() => setActiveBooking(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
          Booking {activeBooking?.bookingRef}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {activeBooking && (
            <>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                  ["Traveller", activeBooking.customerName],
                  ["Phone", activeBooking.customerPhone],
                  ["Email", activeBooking.customerEmail],
                  ["Tour", activeBooking.tourTitle],
                  ["Start & end city", activeBooking.departureCity || "-"],
                  [
                    "Travel dates",
                    activeBooking.travelEndDate
                      ? `${fmt(activeBooking.travelDate)} – ${fmt(activeBooking.travelEndDate)}`
                      : fmt(activeBooking.travelDate),
                  ],
                  ["Travellers", String(activeBooking.numberOfTravelers)],
                  ["Price per person", `₹${activeBooking.pricePerPerson?.toLocaleString("en-IN")}`],
                  ["Total amount", `₹${activeBooking.totalAmountInr?.toLocaleString("en-IN")}`],
                  [
                    "Channel",
                    activeBooking.bookedByRole === "partner"
                      ? `Partner: ${activeBooking.partnerId?.name || "Local Agent"}`
                      : "Direct Website",
                  ],
                  ["Booked on", fmt(activeBooking.createdAt)],
                ].map(([label, value]) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={label}>
                    <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 500, wordBreak: "break-word" }}>
                      {value}
                    </Typography>
                  </Grid>
                ))}
                {activeBooking.specialRequests && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>
                      Special requests
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#0f172a" }}>{activeBooking.specialRequests}</Typography>
                  </Grid>
                )}
              </Grid>

              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={newStatus} label="Status" onChange={(e) => setNewStatus(e.target.value)}>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setActiveBooking(null)} sx={{ color: "#64748b" }}>
            Close
          </Button>
          <Button
            variant="contained"
            disabled={updating || newStatus === activeBooking?.status}
            onClick={handleStatusUpdate}
            sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
          >
            {updating ? "Saving..." : "Save Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
