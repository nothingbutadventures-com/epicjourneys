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
  CircularProgress,
  Alert,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

export default function AdminToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tours?all=true");
      const data = await res.json();
      if (data.success) {
        setTours(data.data || []);
      } else {
        setError(data.error || "Failed to load tours");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load tours");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete tour "${title}"?`)) return;

    const token = localStorage.getItem("epic_token");
    try {
      const res = await fetch(`/api/tours/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        fetchTours();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Tours Management
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Curated Indian tour itineraries, pricing in INR (₹) and departure cities
          </Typography>
        </Box>

        <Button
          component={Link}
          href="/admin/tours/create"
          variant="contained"
          size="small"
          startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
          sx={{
            bgcolor: "#0f172a",
            color: "#ffffff",
            borderRadius: "4px",
            height: 30,
            fontSize: "0.78rem",
            "&:hover": { bgcolor: "#1e293b" },
          }}
        >
          Create New Tour
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>
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
                  <TableCell>Tour Details</TableCell>
                  <TableCell>Target City</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Price (INR)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tours.map((tour) => (
                  <TableRow key={tour._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Box
                          component="img"
                          src={tour.coverImage || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200"}
                          alt={tour.title}
                          sx={{ width: 36, height: 36, borderRadius: "4px", objectFit: "cover" }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.82rem" }}>
                            {tour.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem", display: "block" }}>
                            Max {tour.maxGroupSize || 15} travelers
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tour.targetCity || tour.startingPoint}
                        size="small"
                        sx={{
                          borderRadius: "4px",
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          bgcolor: "#f1f5f9",
                          color: "#0f172a",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", color: "#475569" }}>
                      {tour.state}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                      {tour.durationDays}D / {tour.durationNights}N
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>
                      ₹{tour.priceInr?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tour.isActive ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                          borderRadius: "4px",
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          bgcolor: tour.isActive ? "#ecfdf5" : "#f1f5f9",
                          color: tour.isActive ? "#059669" : "#64748b",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        component={Link}
                        href={`/tours/${tour.slug || tour._id}`}
                        target="_blank"
                        size="small"
                        sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", mr: 0.5 }}
                      >
                        <VisibilityRoundedIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        component={Link}
                        href={`/admin/tours/${tour._id}/edit`}
                        size="small"
                        aria-label="Edit tour"
                        sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", mr: 0.5 }}
                      >
                        <EditRoundedIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(tour._id, tour.title)}
                        sx={{ color: "#ef4444", p: 0.5, borderRadius: "4px" }}
                      >
                        <DeleteRoundedIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
