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
  CircularProgress,
  Alert,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import StarRateRoundedIcon from "@mui/icons-material/StarRateRounded";

export default function AdminReviewsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchItems();
  }, [statusFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?all=true&status=${statusFilter}`);
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

  const handleToggleStatus = async (id: string, current: string) => {
    const nextStatus = current === "published" ? "hidden" : "published";
    try {
      await fetch(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (e) {
      console.error(e);
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
            <StarRateRoundedIcon sx={{ fontSize: 22, color: "#0f172a" }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              Traveler Reviews
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Customer ratings and testimonials displayed on tour landing pages
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ borderRadius: "4px" }}
          >
            <MenuItem value="all">All Reviews</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="hidden">Hidden</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
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
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Tour Title</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Traveler</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Feedback Review</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Date</TableCell>
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
                    No reviews found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a", maxWidth: 220, fontSize: "0.82rem" }}>
                      {item.tourTitle}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8rem" }}>
                        {item.customerName}
                      </Typography>
                      <Typography sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                        {item.location || "India"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Rating value={item.rating} readOnly size="small" sx={{ fontSize: "1rem" }} />
                        <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#0f172a" }}>
                          {item.rating}.0
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "#475569", maxWidth: 360, fontSize: "0.8rem" }}>
                      "{item.comment}"
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: "0.75rem" }}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status === "published" ? "Published" : "Hidden"}
                        size="small"
                        onClick={() => handleToggleStatus(item._id, item.status)}
                        sx={{
                          bgcolor: item.status === "published" ? "#ecfdf5" : "#f1f5f9",
                          color: item.status === "published" ? "#047857" : "#64748b",
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
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
    </Box>
  );
}
