"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import BookOnlineRoundedIcon from "@mui/icons-material/BookOnlineRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalTours: 0,
    totalDestinations: 0,
    totalPartners: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const [toursRes, destsRes, partnersRes, bookingsRes] = await Promise.all([
        fetch("/api/tours?all=true"),
        fetch("/api/destinations?all=true"),
        fetch("/api/partners"),
        fetch("/api/bookings"),
      ]);

      const [toursData, destsData, partnersData, bookingsData] = await Promise.all([
        toursRes.json(),
        destsRes.json(),
        partnersRes.json(),
        bookingsRes.json(),
      ]);

      const bookings = bookingsData.data || [];
      const totalRev = bookings.reduce(
        (sum: number, b: any) => sum + (b.totalAmountInr || 0),
        0
      );

      setStats({
        totalTours: toursData.data?.length || 0,
        totalDestinations: destsData.data?.length || 0,
        totalPartners: partnersData.data?.length || 0,
        totalBookings: bookings.length,
        totalRevenue: totalRev,
      });

      setRecentBookings(bookings.slice(0, 6));
    } catch (e) {
      console.error("Dashboard data load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const kpis = [
    {
      label: "Active Tours",
      value: stats.totalTours,
      tag: "Tours",
      icon: <LuggageRoundedIcon sx={{ fontSize: 16, color: "#0f172a" }} />,
    },
    {
      label: "Destinations",
      value: stats.totalDestinations,
      tag: "Cities",
      icon: <MapRoundedIcon sx={{ fontSize: 16, color: "#0f172a" }} />,
    },
    {
      label: "Partners",
      value: stats.totalPartners,
      tag: "Agents",
      icon: <HandshakeRoundedIcon sx={{ fontSize: 16, color: "#0f172a" }} />,
    },
    {
      label: "Total Bookings",
      value: stats.totalBookings,
      tag: "Confirmed",
      icon: <BookOnlineRoundedIcon sx={{ fontSize: 16, color: "#0f172a" }} />,
    },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      tag: "INR",
      icon: <CurrencyRupeeRoundedIcon sx={{ fontSize: 16, color: "#0f172a" }} />,
    },
  ];

  return (
    <Box>
      {/* Top Bar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Operations Overview
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            {currentDate} • Real-time platform metrics for epicjourneys.in
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Refresh data" arrow>
            <IconButton
              size="small"
              onClick={fetchDashboardData}
              disabled={refreshing}
              sx={{
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                borderRadius: "4px",
                p: 0.6,
                color: "#64748b",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f172a" },
              }}
            >
              <RefreshRoundedIcon
                fontSize="small"
                sx={{
                  transform: refreshing ? "rotate(180deg)" : "none",
                  transition: "transform 0.4s ease",
                }}
              />
            </IconButton>
          </Tooltip>

          <Button
            component={Link}
            href="/admin/locations"
            variant="outlined"
            size="small"
            startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{
              borderColor: "#e2e8f0",
              color: "#334155",
              borderRadius: "4px",
              height: 30,
              fontSize: "0.78rem",
            }}
          >
            Add City
          </Button>

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
            Create Tour
          </Button>
        </Box>
      </Box>

      {/* 5 Minimal KPI Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {kpis.map((kpi, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={idx}>
            <Card sx={{ p: 1.75, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
              <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      fontSize: "0.68rem",
                    }}
                  >
                    {kpi.label}
                  </Typography>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "4px",
                      bgcolor: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {kpi.icon}
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.25rem" }}>
                    {loading ? <CircularProgress size={16} /> : kpi.value}
                  </Typography>
                  <Chip
                    label={kpi.tag}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600, borderRadius: "4px", borderColor: "#e2e8f0", color: "#64748b" }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Bookings Table */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.85rem" }}>
              Latest Passenger Bookings
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
              Direct client reservations and destination partner bookings
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/admin/bookings"
            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />}
            size="small"
            sx={{ color: "#2563eb", fontWeight: 600, fontSize: "0.75rem", p: 0.5 }}
          >
            All Bookings
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : recentBookings.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              No passenger bookings recorded yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ border: "1px solid #f1f5f9", borderRadius: "4px" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ref #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Tour</TableCell>
                  <TableCell>Travel Date</TableCell>
                  <TableCell>Pax</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentBookings.map((b) => (
                  <TableRow key={b._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a", fontFamily: "monospace", fontSize: "0.78rem" }}>
                      {b.bookingRef}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#0f172a" }}>
                        {b.customerName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                        {b.customerPhone}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>
                      {b.tourTitle || b.tourId?.title}
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
                        label={b.bookedByRole === "partner" ? "Partner" : "Direct"}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.65rem",
                          borderRadius: "4px",
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
                          height: 18,
                          fontSize: "0.65rem",
                          borderRadius: "4px",
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
