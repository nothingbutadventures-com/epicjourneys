"use client";

import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");

  // Edit status modal
  const [editBooking, setEditBooking] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("confirmed");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    const token = localStorage.getItem("epic_token");

    try {
      const url =
        statusFilter === "all"
          ? "/api/bookings"
          : `/api/bookings?status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });

      const data = await res.json();
      if (data.success) {
        setBookings(data.data || []);
      } else {
        setError(data.error || "Failed to load bookings");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!editBooking) return;
    setUpdating(true);
    const token = localStorage.getItem("epic_token");

    try {
      const res = await fetch(`/api/bookings/${editBooking._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setEditBooking(null);
        fetchBookings();
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
            Complete audit trail of user-direct and partner-booked tours
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ borderRadius: "4px", height: 32 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
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
                  <TableCell>Ref #</TableCell>
                  <TableCell>Customer Details</TableCell>
                  <TableCell>Tour & Destination</TableCell>
                  <TableCell>Travel Date</TableCell>
                  <TableCell>Pax</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Channel</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a", fontFamily: "monospace", fontSize: "0.78rem" }}>
                      {b.bookingRef}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#0f172a" }}>
                        {b.customerName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem", display: "block" }}>
                        {b.customerPhone} • {b.customerEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#0f172a" }}>
                        {b.tourTitle || b.tourId?.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                        {b.destinationId?.name} ({b.destinationId?.state})
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.78rem", color: "#475569" }}>
                      {new Date(b.travelDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>{b.numberOfTravelers}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>
                      ₹{b.totalAmountInr?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          b.bookedByRole === "partner"
                            ? `Partner: ${b.partnerId?.name || "Local Agent"}`
                            : "Direct Website"
                        }
                        size="small"
                        sx={{
                          borderRadius: "4px",
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          bgcolor: b.bookedByRole === "partner" ? "#f5f3ff" : "#f1f5f9",
                          color: b.bookedByRole === "partner" ? "#7c3aed" : "#475569",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={b.status}
                        size="small"
                        sx={{
                          borderRadius: "4px",
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          textTransform: "capitalize",
                          bgcolor:
                            b.status === "confirmed"
                              ? "#ecfdf5"
                              : b.status === "pending"
                              ? "#fffbeb"
                              : "#fef2f2",
                          color:
                            b.status === "confirmed"
                              ? "#059669"
                              : b.status === "pending"
                              ? "#d97706"
                              : "#dc2626",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditBooking(b);
                          setNewStatus(b.status);
                        }}
                        sx={{ p: 0.5, borderRadius: "4px", color: "#64748b" }}
                      >
                        <EditRoundedIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Edit Status Dialog */}
      <Dialog
        open={Boolean(editBooking)}
        onClose={() => setEditBooking(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
          Update Booking Status
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1.5 }}>
            Booking reference: <strong>{editBooking?.bookingRef}</strong>
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setEditBooking(null)} sx={{ color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={updating}
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
