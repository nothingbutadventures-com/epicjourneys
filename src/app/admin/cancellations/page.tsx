"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

export default function AdminCancellationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit / Status modal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState<number | "">(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [statusFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cancellations?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setAdminNotes(item.adminNotes || "");
    setRefundAmount(item.refundAmountInr || 0);
    setOpenDialog(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cancellations/${selectedItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
          refundAmountInr: Number(refundAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOpenDialog(false);
        fetchItems();
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, ref: string) => {
    if (!confirm(`Delete cancellation request for ${ref}?`)) return;
    try {
      await fetch(`/api/cancellations/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusChip = (st: string) => {
    switch (st) {
      case "approved":
        return <Chip label="Approved" size="small" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, borderRadius: "4px" }} />;
      case "refunded":
        return <Chip label="Refunded" size="small" sx={{ bgcolor: "#ecfdf5", color: "#047857", fontWeight: 700, borderRadius: "4px" }} />;
      case "rejected":
        return <Chip label="Rejected" size="small" sx={{ bgcolor: "#fee2e2", color: "#b91c1c", fontWeight: 700, borderRadius: "4px" }} />;
      default:
        return <Chip label="Pending Review" size="small" sx={{ bgcolor: "#fffbeb", color: "#b45309", fontWeight: 700, borderRadius: "4px" }} />;
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <EventBusyRoundedIcon sx={{ fontSize: 22, color: "#0f172a" }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              Cancellations & Refunds
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Track cancellation claims, review customer reasons, and process refund settlements
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ borderRadius: "4px" }}
          >
            <MenuItem value="all">All Requests</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="refunded">Refunded</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table Paper */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "4px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Booking Ref</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Passenger</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Tour Title</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Cancellation Reason</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Refund Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, py: 1.25 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: "#0f172a" }} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "#64748b" }}>
                    No cancellation requests found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Chip
                        label={item.bookingRef}
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#0f172a",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          borderRadius: "4px",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.82rem" }}>
                        {item.customerName}
                      </Typography>
                      <Typography sx={{ color: "#94a3b8", fontSize: "0.72rem" }}>
                        {item.customerEmail}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "#334155", maxWidth: 220, fontSize: "0.8rem" }}>
                      {item.tourTitle}
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", maxWidth: 260, fontSize: "0.78rem" }}>
                      {item.reason}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                      ₹{item.refundAmountInr?.toLocaleString("en-IN") || 0}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(item.status)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(item)}
                        sx={{ color: "#475569", mr: 0.5 }}
                      >
                        <EditRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item._id, item.bookingRef)}
                        sx={{ color: "#94a3b8", "&:hover": { color: "#ef4444" } }}
                      >
                        <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Status Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px" } } }}
      >
        <form onSubmit={handleUpdateStatus}>
          <DialogTitle sx={{ fontWeight: 800, color: "#0f172a", pb: 1 }}>
            Process Cancellation: {selectedItem?.bookingRef}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
            <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
              <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mb: 0.5 }}>
                Passenger: <b style={{ color: "#0f172a" }}>{selectedItem?.customerName}</b> ({selectedItem?.customerEmail})
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mb: 0.5 }}>
                Tour: <b style={{ color: "#0f172a" }}>{selectedItem?.tourTitle}</b>
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>
                Reason: <i>"{selectedItem?.reason}"</i>
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                  sx={{ borderRadius: "4px" }}
                >
                  <MenuItem value="pending">Pending Review</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="refunded">Refunded / Settled</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Refund Amount (₹)"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Administrative Notes / Settlement Ref"
              placeholder="e.g. Bank transfer reference #12345 or policy deduction notes..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setOpenDialog(false)} sx={{ color: "#64748b", borderRadius: "4px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ borderRadius: "4px", px: 2.5 }}
            >
              {saving ? <CircularProgress size={18} sx={{ color: "#ffffff" }} /> : "Save Settlement"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
