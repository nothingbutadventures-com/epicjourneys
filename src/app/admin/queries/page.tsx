"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ContactSupportRoundedIcon from "@mui/icons-material/ContactSupportRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

export default function AdminQueriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // View / Response modal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [status, setStatus] = useState("open");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [statusFilter, categoryFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/queries?status=${statusFilter}&category=${categoryFilter}`);
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

  const handleOpenItem = (item: any) => {
    setSelectedItem(item);
    setStatus(item.status);
    setAdminNotes(item.adminNotes || "");
    setOpenDialog(true);
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/queries/${selectedItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer inquiry?")) return;
    try {
      await fetch(`/api/queries/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusChip = (st: string) => {
    switch (st) {
      case "resolved":
        return <Chip label="Resolved" size="small" sx={{ bgcolor: "#ecfdf5", color: "#047857", fontWeight: 700, borderRadius: "4px" }} />;
      case "in_progress":
        return <Chip label="In Progress" size="small" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, borderRadius: "4px" }} />;
      default:
        return <Chip label="Open / New" size="small" sx={{ bgcolor: "#fffbeb", color: "#b45309", fontWeight: 700, borderRadius: "4px" }} />;
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
            <ContactSupportRoundedIcon sx={{ fontSize: 22, color: "#0f172a" }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              Customer Queries & Feedback
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Inquiries and support feedback submitted through the Help & Support center
          </Typography>
        </Box>

        {/* Filters */}
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ borderRadius: "4px" }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ borderRadius: "4px" }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="General Inquiry">General Inquiry</MenuItem>
              <MenuItem value="Tour Booking">Tour Booking</MenuItem>
              <MenuItem value="Cancellation & Refund">Cancellation & Refund</MenuItem>
              <MenuItem value="Feedback & Review">Feedback & Review</MenuItem>
              <MenuItem value="Partnership">Partnership</MenuItem>
            </Select>
          </FormControl>
        </Box>
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
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Sender</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Received</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, py: 1.25 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: "#0f172a" }} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#64748b" }}>
                    No customer queries found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.82rem" }}>
                        {item.name}
                      </Typography>
                      <Typography sx={{ color: "#94a3b8", fontSize: "0.72rem" }}>
                        {item.email} {item.phone && `• ${item.phone}`}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "#0f172a", fontWeight: 500, maxWidth: 300, fontSize: "0.82rem" }}>
                      {item.subject}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.category}
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#475569",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          borderRadius: "4px",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: "0.75rem" }}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(item.status)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenItem(item)}
                        sx={{ color: "#475569", mr: 0.5 }}
                      >
                        <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item._id)}
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

      {/* Query Detail & Resolution Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px" } } }}
      >
        <form onSubmit={handleSaveResolution}>
          <DialogTitle sx={{ fontWeight: 800, color: "#0f172a", pb: 1 }}>
            Query: {selectedItem?.subject}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
            <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
              <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mb: 0.5 }}>
                From: <b style={{ color: "#0f172a" }}>{selectedItem?.name}</b> ({selectedItem?.email})
              </Typography>
              {selectedItem?.phone && (
                <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mb: 0.5 }}>
                  Phone: <b style={{ color: "#0f172a" }}>{selectedItem?.phone}</b>
                </Typography>
              )}
              <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mb: 1 }}>
                Category: <b style={{ color: "#0f172a" }}>{selectedItem?.category}</b>
              </Typography>
              <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />
              <Typography sx={{ fontSize: "0.82rem", color: "#0f172a", whiteSpace: "pre-wrap" }}>
                {selectedItem?.message}
              </Typography>
            </Box>

            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
                sx={{ borderRadius: "4px" }}
              >
                <MenuItem value="open">Open / Unresolved</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Admin Internal Notes / Resolution Log"
              placeholder="e.g. Replied to customer via email, provided manali partner contact..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "space-between" }}>
            <Button
              component={Link}
              href={`/admin/leads?search=${encodeURIComponent(selectedItem?.email || selectedItem?.name || "")}`}
              variant="outlined"
              size="small"
              sx={{ borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700 }}
            >
              View in CRM Pipeline
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={() => setOpenDialog(false)} sx={{ color: "#64748b", borderRadius: "4px" }}>
                Close
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{ borderRadius: "4px", px: 2.5 }}
              >
                {saving ? <CircularProgress size={18} sx={{ color: "#ffffff" }} /> : "Save Status"}
              </Button>
            </Box>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
