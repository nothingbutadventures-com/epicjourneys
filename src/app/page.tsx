"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import SyncAltRoundedIcon from "@mui/icons-material/SyncAltRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { KNOWN_DESTINATION_COORDINATES } from "@/lib/constants";

interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  source: "gps" | "ip" | "manual";
}

export default function HomePage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User location state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState<boolean>(false);

  // Filters
  const [selectedRadius, setSelectedRadius] = useState<string>("50"); // 50km default
  const [selectedState, setSelectedState] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Location selector dialog
  const [locationDialogOpen, setLocationDialogOpen] = useState<boolean>(false);

  // 1. Initial Location Resolution on page load
  useEffect(() => {
    resolveUserLocation();
  }, []);

  const resolveUserLocation = () => {
    setLocating(true);

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({
            lat: latitude,
            lng: longitude,
            name: "GPS Location",
            source: "gps",
          });
          setLocating(false);
        },
        async () => {
          // Geolocation denied or failed -> Fallback to IP address automatically
          await fetchLocationFromIp();
        },
        { timeout: 7000 }
      );
    } else {
      fetchLocationFromIp();
    }
  };

  const fetchLocationFromIp = async () => {
    try {
      const res = await fetch("/api/geo/ip-location");
      const data = await res.json();
      if (data.success && data.data) {
        setUserLocation({
          lat: data.data.lat,
          lng: data.data.lng,
          name: `${data.data.city || "Detected City"}, ${data.data.region || "India"}`,
          source: "ip",
        });
      } else {
        setUserLocation({
          lat: 28.6139,
          lng: 77.209,
          name: "New Delhi (Central)",
          source: "manual",
        });
      }
    } catch {
      setUserLocation({
        lat: 28.6139,
        lng: 77.209,
        name: "New Delhi (Central)",
        source: "manual",
      });
    } finally {
      setLocating(false);
    }
  };

  // 2. Fetch tours from MongoDB with distance calculation
  useEffect(() => {
    fetchTours();
  }, [userLocation, selectedRadius, selectedState, searchQuery]);

  const fetchTours = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (userLocation) {
        queryParams.set("userLat", userLocation.lat.toString());
        queryParams.set("userLng", userLocation.lng.toString());
      }

      if (selectedRadius && selectedRadius !== "all") {
        queryParams.set("radiusKm", selectedRadius);
      }

      if (selectedState && selectedState !== "All") {
        queryParams.set("state", selectedState);
      }

      if (searchQuery.trim()) {
        queryParams.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/tours?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTours(data.data || []);
      } else {
        setError(data.error || "Failed to load tours");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading tours");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectKnownCity = (cityName: string) => {
    const city = KNOWN_DESTINATION_COORDINATES[cityName];
    if (city) {
      setUserLocation({
        lat: city.lat,
        lng: city.lng,
        name: `${cityName}, ${city.state}`,
        source: "manual",
      });
      setLocationDialogOpen(false);
    }
  };

  const radiusOptions = [
    { label: "Within 50 km (Default)", value: "50" },
    { label: "100 km", value: "100" },
    { label: "250 km", value: "250" },
    { label: "500 km", value: "500" },
    { label: "All India", value: "all" },
  ];

  const popularStates = [
    "All",
    "Himachal Pradesh",
    "Rajasthan",
    "Uttarakhand",
    "Kerala",
    "Goa",
  ];

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f8fafc" }}>
      <Navbar
        userLocationName={userLocation?.name}
        onLocationClick={() => setLocationDialogOpen(true)}
      />

      {/* Hero Section */}
      <Box
        component="section"
        sx={{
          bgcolor: "#0f172a",
          color: "#ffffff",
          backgroundImage:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.68) 0%, rgba(15, 23, 42, 0.84) 62%, #0f172a 100%), url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 32%",
          backgroundRepeat: "no-repeat",
          pt: { xs: 7, sm: 9, md: 10 },
          pb: { xs: 8, sm: 10, md: 11 },
          borderBottom: "1px solid #1e293b",
          position: "relative",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 840, mx: "auto", textAlign: "center" }}>
            {/* Hero Main Heading */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.2rem", sm: "3.1rem", md: "3.7rem" },
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                mb: 2,
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
              }}
            >
              Curated Indian Journeys,{" "}
              <Box component="span" sx={{ color: "#38bdf8" }}>
                Starting Near You.
              </Box>
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="body1"
              sx={{
                color: "#cbd5e1",
                fontSize: { xs: "0.95rem", sm: "1.08rem" },
                lineHeight: 1.6,
                maxWidth: 680,
                mx: "auto",
                mb: 4.5,
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.5)",
              }}
            >
              Every tour starts and concludes at the same destination city with verified local partners.
              Real-time driving distance computed directly from your current location in India.
            </Typography>

            {/* Integrated Search & Location Bar */}
            <Paper
              elevation={0}
              sx={{
                p: 1,
                borderRadius: "4px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                bgcolor: "#ffffff",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                alignItems: "center",
                maxWidth: 800,
                mx: "auto",
                mb: 3.5,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.35)",
              }}
            >
              {/* Search text input */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search tour title, city, or Indian state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ color: "#64748b", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#f8fafc",
                    borderRadius: "4px",
                    fontSize: "0.82rem",
                  },
                }}
              />

              {/* Location Pill Button */}
              <Button
                variant="outlined"
                size="small"
                onClick={() => setLocationDialogOpen(true)}
                startIcon={<LocationOnIcon sx={{ color: "#2563eb", fontSize: 18 }} />}
                sx={{
                  whiteSpace: "nowrap",
                  minWidth: { xs: "100%", sm: 200 },
                  borderColor: "#e2e8f0",
                  color: "#0f172a",
                  height: 40,
                  borderRadius: "4px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  bgcolor: "#ffffff",
                  "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
                }}
              >
                {locating ? "Detecting GPS..." : userLocation ? userLocation.name : "Choose City"}
              </Button>

              {/* Search Action Button */}
              <Button
                variant="contained"
                size="small"
                onClick={fetchTours}
                sx={{
                  whiteSpace: "nowrap",
                  minWidth: { xs: "100%", sm: 120 },
                  bgcolor: "#0f172a",
                  color: "#ffffff",
                  height: 40,
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  px: 2.5,
                  "&:hover": { bgcolor: "#1e293b" },
                }}
              >
                Find Tours
              </Button>
            </Paper>

            {/* Trust Badges */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: { xs: 1.5, sm: 3 },
                color: "#e2e8f0",
                fontSize: "0.75rem",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: "rgba(15, 23, 42, 0.55)",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <CheckCircleRoundedIcon sx={{ fontSize: 15, color: "#10b981" }} />
                <span>50 km Default Distance Filter</span>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: "rgba(15, 23, 42, 0.55)",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <SyncAltRoundedIcon sx={{ fontSize: 15, color: "#38bdf8" }} />
                <span>Roundtrip Departure & End</span>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: "rgba(15, 23, 42, 0.55)",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <CurrencyRupeeRoundedIcon sx={{ fontSize: 15, color: "#fbbf24" }} />
                <span>100% Indian Currency (₹)</span>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: "rgba(15, 23, 42, 0.55)",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <HandshakeRoundedIcon sx={{ fontSize: 15, color: "#c084fc" }} />
                <span>Verified City Partners</span>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Catalog Area */}
      <Container maxWidth="lg" sx={{ py: 4.5, flexGrow: 1 }}>
        {/* Distance Filter Console Paper */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: "4px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* Current location origin indicator */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "4px",
                bgcolor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LocationOnIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.82rem", lineHeight: 1.2 }}>
                Origin: {userLocation?.name || "Detecting Location..."}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.72rem" }}>
                {userLocation?.source === "gps"
                  ? "Live GPS Coordinates"
                  : userLocation?.source === "ip"
                  ? "Network IP Location"
                  : "Manual City Selection"}
                {" • "}
                <Box
                  component="span"
                  onClick={() => setLocationDialogOpen(true)}
                  sx={{ color: "#2563eb", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                >
                  Change City
                </Box>
              </Typography>
            </Box>
          </Box>

          {/* Radius Filter Pills */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", mr: 0.5 }}>
              Radius:
            </Typography>
            {radiusOptions.map((opt) => {
              const active = selectedRadius === opt.value;
              return (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  onClick={() => setSelectedRadius(opt.value)}
                  size="small"
                  sx={{
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.72rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    bgcolor: active ? "#0f172a" : "#f1f5f9",
                    color: active ? "#ffffff" : "#475569",
                    border: active ? "1px solid #0f172a" : "1px solid #e2e8f0",
                    "&:hover": {
                      bgcolor: active ? "#1e293b" : "#e2e8f0",
                    },
                  }}
                />
              );
            })}
          </Box>
        </Paper>

        {/* State Filter Pills */}
        <Box sx={{ mb: 3, display: "flex", gap: 0.75, overflowX: "auto", pb: 0.5 }}>
          {popularStates.map((st) => {
            const active = selectedState === st;
            return (
              <Chip
                key={st}
                label={st === "All" ? "All Indian States" : st}
                onClick={() => setSelectedState(st)}
                size="small"
                sx={{
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.75rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  bgcolor: active ? "#0f172a" : "#ffffff",
                  color: active ? "#ffffff" : "#475569",
                  border: "1px solid #e2e8f0",
                  "&:hover": {
                    bgcolor: active ? "#1e293b" : "#f8fafc",
                  },
                }}
              />
            );
          })}
        </Box>

        {/* Section Heading & Tour Count */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem" }}>
              {selectedRadius !== "all"
                ? `Tours Starting Within ${selectedRadius} km`
                : "All India Available Tours"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Showing {tours.length} verified tours sorted nearest to {userLocation?.name || "your location"}
            </Typography>
          </Box>

          <Button
            size="small"
            startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={fetchTours}
            sx={{ color: "#64748b", borderRadius: "4px", fontSize: "0.75rem" }}
          >
            Refresh
          </Button>
        </Box>

        {/* Loading / Error States */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={32} sx={{ color: "#0f172a" }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "4px" }}>
            {error}
          </Alert>
        )}

        {/* Tours Grid */}
        {!loading && tours.length > 0 && (
          <Grid container spacing={2.5}>
            {tours.map((tour) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tour._id}>
                <TourCard tour={tour} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty State */}
        {!loading && tours.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: "center",
              borderRadius: "4px",
              border: "1px dashed #cbd5e1",
              bgcolor: "#ffffff",
              my: 3,
            }}
          >
            <LocationOnIcon sx={{ fontSize: 40, color: "#94a3b8", mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 1, fontSize: "1.05rem" }}>
              No tours found within {selectedRadius} km of {userLocation?.name || "your location"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 460, mx: "auto", mb: 2.5, fontSize: "0.82rem" }}>
              Expand your distance filter to 100 km, 250 km, 500 km or All India to discover verified tours across other regions.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedRadius("250")}
                sx={{ borderRadius: "4px", borderColor: "#e2e8f0", color: "#0f172a" }}
              >
                Try 250 km
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => setSelectedRadius("all")}
                sx={{ borderRadius: "4px", bgcolor: "#0f172a" }}
              >
                View All India
              </Button>
            </Box>
          </Paper>
        )}
      </Container>

      {/* Location Change Dialog */}
      <Dialog
        open={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px", p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#0f172a", pb: 1, fontSize: "1rem" }}>
          Select Starting City
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2, fontSize: "0.8rem" }}>
            Select a reference city in India to calculate real driving distance to tour starting points:
          </Typography>

          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<MyLocationRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              resolveUserLocation();
              setLocationDialogOpen(false);
            }}
            sx={{
              mb: 2.5,
              borderColor: "#2563eb",
              color: "#2563eb",
              borderRadius: "4px",
              fontWeight: 600,
              fontSize: "0.78rem",
            }}
          >
            Auto-Detect My GPS / IP Location
          </Button>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "#475569",
              textTransform: "uppercase",
              display: "block",
              mb: 1,
              fontSize: "0.7rem",
            }}
          >
            Popular Indian Starting Cities:
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {Object.keys(KNOWN_DESTINATION_COORDINATES).map((city) => (
              <Chip
                key={city}
                label={city}
                onClick={() => handleSelectKnownCity(city)}
                size="small"
                sx={{
                  bgcolor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#e2e8f0" },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setLocationDialogOpen(false)}
            sx={{ color: "#64748b", borderRadius: "4px" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
}
