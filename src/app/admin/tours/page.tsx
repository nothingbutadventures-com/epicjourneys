"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Grid,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export default function AdminToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [launches, setLaunches] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [partnerStatusFilter, setPartnerStatusFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [specificPartnerFilter, setSpecificPartnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const getHeaders = (): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const t = localStorage.getItem("epic_token");
    return t
      ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [toursRes, launchesRes, partnersRes, destsRes] = await Promise.all([
        fetch("/api/tours?all=true").then((r) => r.json()),
        fetch("/api/launches", { headers: getHeaders() })
          .then((r) => r.json())
          .catch(() => ({ success: false, data: [] })),
        fetch("/api/partners", { headers: getHeaders() })
          .then((r) => r.json())
          .catch(() => ({ success: false, data: [] })),
        fetch("/api/destinations")
          .then((r) => r.json())
          .catch(() => ({ success: false, data: [] })),
      ]);

      if (toursRes.success) {
        setTours(toursRes.data || []);
      } else {
        setError(toursRes.error || "Failed to load tours");
      }

      if (launchesRes.success) setLaunches(launchesRes.data || []);
      if (partnersRes.success) setPartners(partnersRes.data || []);
      if (destsRes.success) setDestinations(destsRes.data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load tours");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to extract partner & location info for a tour
  const getTourLocationInfo = (tour: any) => {
    const baseCityName = (
      tour.destinationId?.name ||
      tour.targetCity ||
      tour.startingPoint ||
      ""
    )
      .toLowerCase()
      .trim();

    // Map all departure cities
    const departures = tour.departures || [];
    const cityMap = new Map<
      string,
      { cityName: string; state: string; partnerNames: Set<string>; partnerIds: Set<string> }
    >();

    departures.forEach((d: any) => {
      const c = d.cityId;
      if (!c) return;
      const cName = c.name || "Departure City";
      const key = cName.toLowerCase();
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          cityName: cName,
          state: c.state || "",
          partnerNames: new Set(),
          partnerIds: new Set(),
        });
      }
      const entry = cityMap.get(key)!;
      const partner = d.partnerId || c.partnerId;
      if (partner?.name) {
        entry.partnerNames.add(partner.name);
      }
      if (partner?._id) {
        entry.partnerIds.add(String(partner._id));
      }
    });

    const uniqueDepartureCities = Array.from(cityMap.values()).map((c) => c.cityName);

    // Partner cities are departure cities with an assigned partner OR distinct from base destination
    const partnerCities = Array.from(cityMap.values()).filter(
      (c) => c.partnerNames.size > 0 || c.cityName.toLowerCase() !== baseCityName
    );

    const allPartnerNames = Array.from(
      new Set(
        Array.from(cityMap.values()).flatMap((c) => Array.from(c.partnerNames))
      )
    );

    const allPartnerIds = Array.from(
      new Set(
        Array.from(cityMap.values()).flatMap((c) => Array.from(c.partnerIds))
      )
    );

    // Pending launches for this tour
    const tourIdStr = String(tour._id);
    const tourLaunches = launches.filter(
      (l) => String(l.tourId?._id || l.tourId) === tourIdStr
    );
    const pendingLaunches = tourLaunches.filter((l) =>
      ["submitted", "awaiting_partner", "changes_requested", "partner_approved"].includes(
        l.status
      )
    );

    const hasPartnersAssigned = partnerCities.length > 0 || allPartnerNames.length > 0;
    const isMultiCity = uniqueDepartureCities.length >= 2;

    return {
      baseCityName,
      uniqueDepartureCities,
      partnerCities,
      allPartnerNames,
      allPartnerIds,
      tourLaunches,
      pendingLaunches,
      hasPartnersAssigned,
      isMultiCity,
    };
  };

  // Filtered tours
  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const info = getTourLocationInfo(tour);

      // Search query filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const titleMatch = tour.title?.toLowerCase().includes(q);
        const destMatch = (
          tour.destinationId?.name ||
          tour.targetCity ||
          tour.startingPoint ||
          ""
        )
          .toLowerCase()
          .includes(q);
        const stateMatch = tour.state?.toLowerCase().includes(q);
        const cityMatch = info.uniqueDepartureCities.some((c) =>
          c.toLowerCase().includes(q)
        );
        const partnerMatch = info.allPartnerNames.some((p) =>
          p.toLowerCase().includes(q)
        );
        if (!titleMatch && !destMatch && !stateMatch && !cityMatch && !partnerMatch) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === "active" && !tour.isActive) return false;
      if (statusFilter === "inactive" && tour.isActive) return false;

      // Destination filter
      if (destinationFilter !== "all") {
        const dId = String(tour.destinationId?._id || tour.destinationId || "");
        if (dId !== destinationFilter) return false;
      }

      // Partner Status filter
      if (partnerStatusFilter === "with_partners" && !info.hasPartnersAssigned) {
        return false;
      }
      if (partnerStatusFilter === "base_only" && info.hasPartnersAssigned) {
        return false;
      }
      if (
        partnerStatusFilter === "pending_requests" &&
        info.pendingLaunches.length === 0
      ) {
        return false;
      }
      if (partnerStatusFilter === "multi_city" && !info.isMultiCity) {
        return false;
      }

      // Specific Partner filter
      if (specificPartnerFilter !== "all") {
        const matchesDeparturePartner = info.allPartnerIds.includes(
          specificPartnerFilter
        );
        const matchesLaunchPartner = info.tourLaunches.some(
          (l) => String(l.partnerId?._id || l.partnerId) === specificPartnerFilter
        );
        if (!matchesDeparturePartner && !matchesLaunchPartner) {
          return false;
        }
      }

      return true;
    });
  }, [
    tours,
    launches,
    partners,
    search,
    statusFilter,
    destinationFilter,
    partnerStatusFilter,
    specificPartnerFilter,
  ]);

  // Counts for filter chips
  const counts = useMemo(() => {
    let withPartners = 0;
    let baseOnly = 0;
    let pendingRequests = 0;
    let multiCity = 0;
    let active = 0;
    let inactive = 0;

    tours.forEach((t) => {
      if (t.isActive) active++;
      else inactive++;

      const info = getTourLocationInfo(t);
      if (info.hasPartnersAssigned) withPartners++;
      else baseOnly++;
      if (info.pendingLaunches.length > 0) pendingRequests++;
      if (info.isMultiCity) multiCity++;
    });

    return {
      withPartners,
      baseOnly,
      pendingRequests,
      multiCity,
      active,
      inactive,
    };
  }, [tours, launches]);

  const isFiltered =
    Boolean(search.trim()) ||
    partnerStatusFilter !== "all" ||
    destinationFilter !== "all" ||
    specificPartnerFilter !== "all" ||
    statusFilter !== "all";

  const handleResetFilters = () => {
    setSearch("");
    setPartnerStatusFilter("all");
    setDestinationFilter("all");
    setSpecificPartnerFilter("all");
    setStatusFilter("all");
  };

  return (
    <Box>
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}
          >
            All Tours
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Curated Indian tour itineraries, partner location departures and base pricing in INR (₹)
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

      {/* ================= FILTERS TOOLBAR ================= */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: "4px",
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
          {/* Search Field */}
          <Grid size={{ xs: 12, md: 3.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search tours, destinations, partners, cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch("")} sx={{ p: 0.25 }}>
                        <CloseRoundedIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          </Grid>

          {/* Partner & Location Assignment Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Partner & Location Status</InputLabel>
              <Select
                value={partnerStatusFilter}
                label="Partner & Location Status"
                onChange={(e) => setPartnerStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Tours ({tours.length})</MenuItem>
                <MenuItem value="with_partners">
                  Assigned to Partner(s) ({counts.withPartners})
                </MenuItem>
                <MenuItem value="base_only">
                  Base Location Only / No Partner ({counts.baseOnly})
                </MenuItem>
                <MenuItem value="pending_requests">
                  Has Pending Tour Requests ({counts.pendingRequests})
                </MenuItem>
                <MenuItem value="multi_city">
                  Multi-Location Departures ({counts.multiCity})
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Tour Destination Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tour Destination</InputLabel>
              <Select
                value={destinationFilter}
                label="Tour Destination"
                onChange={(e) => setDestinationFilter(e.target.value)}
              >
                <MenuItem value="all">All Destinations</MenuItem>
                {destinations.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.name} ({d.state})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filter by Specific Partner */}
          <Grid size={{ xs: 12, sm: 6, md: 2.2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Partner</InputLabel>
              <Select
                value={specificPartnerFilter}
                label="Filter by Partner"
                onChange={(e) => setSpecificPartnerFilter(e.target.value)}
              >
                <MenuItem value="all">All Partners</MenuItem>
                {partners.map((p) => {
                  const loc = p.assignedDestination?.name || p.address || "";
                  return (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name} {loc ? `(📍 ${loc})` : ""}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 1.8 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active ({counts.active})</MenuItem>
                <MenuItem value="inactive">Inactive ({counts.inactive})</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Filter Summary & Reset Bar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            pt: 1,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
              Showing {filteredTours.length} of {tours.length} tours
            </Typography>

            {partnerStatusFilter !== "all" && (
              <Chip
                label={`Filter: ${
                  partnerStatusFilter === "with_partners"
                    ? "Assigned to Partner(s)"
                    : partnerStatusFilter === "base_only"
                    ? "Base Location Only"
                    : partnerStatusFilter === "pending_requests"
                    ? "Pending Tour Requests"
                    : "Multi-Location"
                }`}
                size="small"
                onDelete={() => setPartnerStatusFilter("all")}
                sx={{ height: 22, fontSize: "0.7rem", borderRadius: "4px", bgcolor: "#f1f5f9" }}
              />
            )}

            {destinationFilter !== "all" && (
              <Chip
                label={`Destination: ${
                  destinations.find((d) => d._id === destinationFilter)?.name || "Selected"
                }`}
                size="small"
                onDelete={() => setDestinationFilter("all")}
                sx={{ height: 22, fontSize: "0.7rem", borderRadius: "4px", bgcolor: "#f1f5f9" }}
              />
            )}

            {specificPartnerFilter !== "all" && (
              <Chip
                label={`Partner: ${
                  partners.find((p) => p._id === specificPartnerFilter)?.name || "Selected"
                }`}
                size="small"
                onDelete={() => setSpecificPartnerFilter("all")}
                sx={{ height: 22, fontSize: "0.7rem", borderRadius: "4px", bgcolor: "#f1f5f9" }}
              />
            )}

            {statusFilter !== "all" && (
              <Chip
                label={`Status: ${statusFilter}`}
                size="small"
                onDelete={() => setStatusFilter("all")}
                sx={{ height: 22, fontSize: "0.7rem", borderRadius: "4px", bgcolor: "#f1f5f9" }}
              />
            )}
          </Box>

          {isFiltered && (
            <Button
              size="small"
              onClick={handleResetFilters}
              sx={{
                color: "#64748b",
                fontSize: "0.74rem",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { color: "#0f172a" },
              }}
            >
              Reset all filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* ================= TOURS TABLE ================= */}
      <Paper
        elevation={0}
        sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Tour Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Tour Destination</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#334155" }}>
                    Partner Locations & Departures
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Base Price (INR)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#334155" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 5 }}>
                      <Typography sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                        No tours found matching the selected filters.
                      </Typography>
                      {isFiltered && (
                        <Button
                          size="small"
                          onClick={handleResetFilters}
                          sx={{ mt: 1, fontSize: "0.75rem", textTransform: "none" }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTours.map((tour) => {
                    const info = getTourLocationInfo(tour);
                    return (
                      <TableRow
                        key={tour._id}
                        hover
                        sx={{ "&:last-child td": { borderBottom: 0 } }}
                      >
                        {/* Tour Details */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                            <Box
                              component="img"
                              src={
                                tour.coverImage ||
                                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200"
                              }
                              alt={tour.title}
                              sx={{
                                width: 38,
                                height: 38,
                                borderRadius: "4px",
                                objectFit: "cover",
                                border: "1px solid #e2e8f0",
                              }}
                            />
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: "#0f172a",
                                  fontSize: "0.82rem",
                                  lineHeight: 1.25,
                                }}
                              >
                                {tour.title}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "#64748b", fontSize: "0.7rem", display: "block" }}
                              >
                                Max {tour.maxGroupSize || 15} travelers
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Tour Destination */}
                        <TableCell>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                            <Chip
                              label={tour.targetCity || tour.destinationId?.name || tour.startingPoint}
                              size="small"
                              sx={{
                                borderRadius: "4px",
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                bgcolor: "#f1f5f9",
                                color: "#0f172a",
                                width: "fit-content",
                              }}
                            />
                            {tour.state && (
                              <Typography
                                variant="caption"
                                sx={{ color: "#64748b", fontSize: "0.7rem" }}
                              >
                                {tour.state}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* Partner Locations & Departure Cities */}
                        <TableCell>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            {info.partnerCities.length > 0 ? (
                              <>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {info.partnerCities
                                    .slice(0, 2)
                                    .map((c, idx) => (
                                      <Chip
                                        key={idx}
                                        icon={
                                          <LocationOnRoundedIcon
                                            sx={{ fontSize: "0.75rem !important" }}
                                          />
                                        }
                                        label={c.cityName}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: "0.68rem",
                                          fontWeight: 600,
                                          bgcolor: "#f0fdf4",
                                          color: "#166534",
                                          border: "1px solid #bbf7d0",
                                          borderRadius: "4px",
                                        }}
                                      />
                                    ))}
                                  {info.partnerCities.length > 2 && (
                                    <Tooltip
                                      title={info.partnerCities
                                        .map((c) => c.cityName)
                                        .join(", ")}
                                    >
                                      <Chip
                                        label={`+${info.partnerCities.length - 2} more`}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: "0.65rem",
                                          borderRadius: "4px",
                                          bgcolor: "#f1f5f9",
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>

                                {info.allPartnerNames.length > 0 && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#475569",
                                      fontSize: "0.7rem",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <HandshakeRoundedIcon
                                      sx={{ fontSize: 13, color: "#64748b" }}
                                    />
                                    Partner:{" "}
                                    <b>{info.allPartnerNames.slice(0, 2).join(", ")}</b>
                                    {info.allPartnerNames.length > 2
                                      ? ` (+${info.allPartnerNames.length - 2})`
                                      : ""}
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#64748b",
                                    fontSize: "0.72rem",
                                    display: "block",
                                  }}
                                >
                                  Base destination only
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#94a3b8", fontSize: "0.68rem" }}
                                >
                                  No partner locations added
                                </Typography>
                              </Box>
                            )}

                            {/* Pending partner requests badge */}
                            {info.pendingLaunches.length > 0 && (
                              <Chip
                                icon={
                                  <RocketLaunchRoundedIcon
                                    sx={{ fontSize: "0.72rem !important" }}
                                  />
                                }
                                label={`${info.pendingLaunches.length} Pending Partner Request${
                                  info.pendingLaunches.length > 1 ? "s" : ""
                                }`}
                                size="small"
                                component={Link}
                                href="/admin/launches"
                                clickable
                                sx={{
                                  height: 18,
                                  fontSize: "0.62rem",
                                  fontWeight: 600,
                                  bgcolor: "#fffbeb",
                                  color: "#b45309",
                                  border: "1px solid #fde68a",
                                  borderRadius: "4px",
                                  width: "fit-content",
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>

                        {/* Duration */}
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                          {tour.durationDays}D / {tour.durationNights}N
                        </TableCell>

                        {/* Base Price */}
                        <TableCell
                          sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}
                        >
                          ₹{(tour.basePriceInr || tour.priceInr)?.toLocaleString("en-IN")}
                        </TableCell>

                        {/* Status */}
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

                        {/* Actions */}
                        <TableCell align="right">
                          <Tooltip title="View live page">
                            <IconButton
                              component={Link}
                              href={`/tours/${tour.slug || tour._id}`}
                              target="_blank"
                              size="small"
                              sx={{
                                color: "#64748b",
                                p: 0.5,
                                borderRadius: "4px",
                                mr: 0.5,
                              }}
                            >
                              <VisibilityRoundedIcon
                                fontSize="small"
                                sx={{ fontSize: 16 }}
                              />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit tour">
                            <IconButton
                              component={Link}
                              href={`/admin/tours/${tour._id}/edit`}
                              size="small"
                              aria-label="Edit tour"
                              sx={{
                                color: "#64748b",
                                p: 0.5,
                                borderRadius: "4px",
                                mr: 0.5,
                              }}
                            >
                              <EditRoundedIcon fontSize="small" sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete tour">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(tour._id, tour.title)}
                              sx={{ color: "#ef4444", p: 0.5, borderRadius: "4px" }}
                            >
                              <DeleteRoundedIcon fontSize="small" sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
