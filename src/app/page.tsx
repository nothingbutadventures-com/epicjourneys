"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Autocomplete,
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
import HeroSlider from "@/components/HeroSlider";
import TourCard from "@/components/TourCard";
import { calculateDistanceKm, formatDistance } from "@/lib/geo";
import { KNOWN_DESTINATION_COORDINATES } from "@/lib/constants";

interface CityOption {
  id: string;
  name: string;
  state: string;
  lat?: number;
  lng?: number;
}

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

  // Search: start & end city (From) and target city (To)
  const [fromCity, setFromCity] = useState<CityOption | null>(null);
  const [toCity, setToCity] = useState<CityOption | null>(null);

  // Filters
  const [selectedRadius, setSelectedRadius] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("All");

  // Location selector dialog
  const [locationDialogOpen, setLocationDialogOpen] = useState<boolean>(false);

  // 1. Location: cached value renders instantly, IP lookup runs in parallel with the
  // browser GPS prompt, and a GPS fix (more precise) overrides the IP estimate.
  useEffect(() => {
    try {
      const cached = localStorage.getItem("ej_location");
      if (cached) setUserLocation(JSON.parse(cached));
    } catch {}
    resolveUserLocation();
  }, []);

  const updateLocation = (loc: UserLocation) => {
    setUserLocation(loc);
    try {
      localStorage.setItem("ej_location", JSON.stringify(loc));
    } catch {}
  };

  const nearestCityName = (lat: number, lng: number) => {
    let best = "";
    let bestD = Infinity;
    for (const [name, c] of Object.entries(KNOWN_DESTINATION_COORDINATES)) {
      const d = calculateDistanceKm(lat, lng, c.lat, c.lng);
      if (d < bestD) {
        bestD = d;
        best = name;
      }
    }
    return bestD < 60 ? best : `Near ${best}`;
  };

  const resolveUserLocation = () => {
    setLocating(true);
    let gpsDone = false;

    fetchLocationFromIp(() => gpsDone);

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          gpsDone = true;
          updateLocation({
            lat: coords.latitude,
            lng: coords.longitude,
            name: nearestCityName(coords.latitude, coords.longitude),
            source: "gps",
          });
          setLocating(false);
        },
        () => setLocating(false),
        { timeout: 10000, maximumAge: 600000 }
      );
    }
  };

  const fetchLocationFromIp = async (gpsResolved: () => boolean) => {
    try {
      const res = await fetch("/api/geo/ip-location");
      const data = await res.json();
      if (gpsResolved()) return;
      if (data.success && data.data) {
        updateLocation({
          lat: data.data.lat,
          lng: data.data.lng,
          name: `${data.data.city || "Detected City"}, ${data.data.region || "India"}`,
          source: "ip",
        });
      }
    } catch {
      if (!gpsResolved()) {
        updateLocation({ lat: 28.6139, lng: 77.209, name: "New Delhi (Central)", source: "manual" });
      }
    }
  };

  // 2. Fetch tours from MongoDB with distance calculation
  useEffect(() => {
    fetchTours();
  }, [userLocation, selectedRadius, selectedState, fromCity?.id, toCity?.id]);

  const fetchTours = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (userLocation) {
        queryParams.set("lat", userLocation.lat.toString());
        queryParams.set("lng", userLocation.lng.toString());
      }

      if (selectedRadius && selectedRadius !== "all") {
        queryParams.set("radius", selectedRadius);
      }

      if (selectedState && selectedState !== "All") {
        queryParams.set("state", selectedState);
      }

      if (fromCity) queryParams.set("from", fromCity.id);
      if (toCity) queryParams.set("to", toCity.id);

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

  const [allTours, setAllTours] = useState<any[]>([]);
  const [dbDestinations, setDbDestinations] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/tours")
      .then((r) => r.json())
      .then((d) => d.success && setAllTours(d.data || []))
      .catch(() => {});
    fetch("/api/destinations")
      .then((r) => r.json())
      .then((d) => d.success && setDbDestinations(d.data || []))
      .catch(() => {});
  }, []);

  // "From" = every start & end city used by a tour date; "To" = every tour's target city.
  const fromOptions = useMemo<CityOption[]>(() => {
    const map = new Map<string, CityOption>();
    for (const t of allTours) {
      for (const d of t.departures || []) {
        const c = d.cityId;
        if (c?._id && !map.has(c._id)) {
          map.set(c._id, { id: c._id, name: c.name, state: c.state, lat: c.coordinates?.lat, lng: c.coordinates?.lng });
        }
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allTours]);

  const toOptions = useMemo<CityOption[]>(() => {
    const map = new Map<string, CityOption>();
    for (const t of allTours) {
      const c = t.destinationId;
      if (c?._id && !map.has(c._id)) {
        map.set(c._id, { id: c._id, name: c.name, state: c.state, lat: c.coordinates?.lat, lng: c.coordinates?.lng });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allTours]);

  const nearbyDestinations = useMemo(() => {
    const entries = dbDestinations
      .filter((d) => d.tourCount > 0)
      .map((d) => ({
        id: d._id as string,
        name: d.name as string,
        state: d.state as string,
        tourCount: d.tourCount as number,
        distance: userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, d.coordinates?.lat, d.coordinates?.lng) : null,
      }));
    if (userLocation) entries.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    return entries.slice(0, 8);
  }, [dbDestinations, userLocation]);

  const selectFromCity = (c: CityOption | null) => {
    setFromCity(c);
    if (c && c.lat !== undefined && c.lng !== undefined) {
      setUserLocation({ lat: c.lat, lng: c.lng, name: `${c.name}, ${c.state}`, source: "manual" });
    }
  };

  const radiusOptions = [
    { label: "Within 50 km", value: "50" },
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

      <HeroSlider onBook={() => document.getElementById("journey-search")?.scrollIntoView({ behavior: "smooth" })} />

      {/* Search Your Journey */}
      <Container maxWidth="lg" id="journey-search" sx={{ pt: 2.5 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, md: 1 },
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "stretch",
            gap: { xs: 2, md: 0 },
            boxShadow: "0 12px 32px -12px rgba(15, 23, 42, 0.18)",
          }}
        >
          {[
            { label: "From", placeholder: "Select Starting point", value: fromCity, options: fromOptions, icon: <MyLocationRoundedIcon sx={{ color: "#ca8a04" }} />,
              onChange: selectFromCity },
            { label: "To", placeholder: "Select Destination", value: toCity, options: toOptions, icon: <LocationOnIcon sx={{ color: "#ef4444" }} />,
              onChange: setToCity },
          ].map((f, i) => (
            <Box
              key={f.label}
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: { md: 2.5 },
                borderLeft: { md: i ? "1px solid #e2e8f0" : "none" },
              }}
            >
              {f.icon}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {f.label}
                </Typography>
                <Autocomplete
                  options={f.options}
                  value={f.value}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  noOptionsText="No cities available"
                  onChange={(_, v) => f.onChange(v)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="standard"
                      placeholder={f.placeholder}
                      slotProps={{
                        ...params.slotProps,
                        input: { ...params.slotProps.input, disableUnderline: true },
                      }}
                      sx={{ "& input": { fontSize: "1rem", fontWeight: 600, color: "#0f172a", py: 0.5 } }}
                    />
                  )}
                />
              </Box>
            </Box>
          ))}
          <Button
            variant="contained"
            startIcon={<SearchRoundedIcon />}
            onClick={() => {
              fetchTours();
              document.getElementById("tour-results")?.scrollIntoView({ behavior: "smooth" });
            }}
            sx={{ minWidth: { md: 170 }, py: 1.1, bgcolor: "#facc15", color: "#0f172a", fontSize: "0.95rem", fontWeight: 700, borderRadius: "6px", boxShadow: "none", "&:hover": { bgcolor: "#eab308" } }}
          >
            Search
          </Button>
        </Paper>
      </Container>

      {/* Nearby Destinations */}
      <Container maxWidth="lg" id="destinations" sx={{ pt: 8 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" }, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            {userLocation ? "Destinations Near " : "Popular Destinations"}
            {userLocation && (
              <Box component="span" sx={{ color: "#ca8a04" }}>{userLocation.name.split(",")[0]}</Box>
            )}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: "0.95rem", mt: 0.75 }}>
            Sorted by distance from your location, nearest first.
          </Typography>
        </Box>
        <Grid container spacing={2.5}>
          {nearbyDestinations.map(({ id, name, state, distance, tourCount }) => {
            const count = tourCount;
            const active = toCity?.id === id;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: "6px",
                    border: active ? "1px solid #94a3b8" : "1px solid #e2e8f0",
                    bgcolor: "#fff",
                    height: "100%",
                    transition: "box-shadow .2s, transform .2s",
                    "&:hover": { boxShadow: "0 14px 30px -14px rgba(15,23,42,0.25)", transform: "translateY(-2px)" },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography sx={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {state}
                    </Typography>
                    {distance !== null && (
                      <Chip
                        label={formatDistance(distance)}
                        size="small"
                        sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, bgcolor: "#fefce8", color: "#a16207", borderRadius: "6px" }}
                      />
                    )}
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.3rem", lineHeight: 1.3, mb: 2 }}>
                    {name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ color: "#475569", fontSize: "0.85rem", fontWeight: 500 }}>
                      {count} {count === 1 ? "Tour" : "Tours"}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setToCity(toOptions.find((o) => o.id === id) || { id, name, state });
                        document.getElementById("tour-results")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      sx={{ color: "#0f172a", borderColor: "#cbd5e1", fontWeight: 600, borderRadius: "6px", "&:hover": { borderColor: "#0f172a", bgcolor: "#f8fafc" } }}
                    >
                      View Tours
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* Main Catalog Area */}
      <Container maxWidth="lg" id="tour-results" sx={{ py: 4.5, flexGrow: 1 }}>
        {/* Distance Filter Console Paper */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: "6px",
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
                borderRadius: "6px",
                bgcolor: "#fefce8",
                color: "#ca8a04",
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
                  sx={{ color: "#ca8a04", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
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
                    borderRadius: "6px",
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
                  borderRadius: "6px",
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
            sx={{ color: "#64748b", borderRadius: "6px", fontSize: "0.75rem" }}
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
          <Alert severity="error" sx={{ mb: 3, borderRadius: "6px" }}>
            {error}
          </Alert>
        )}

        {/* Tours Grid */}
        {!loading && tours.length > 0 && (
          <Grid container spacing={2.5}>
            {tours.map((tour) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tour._id}>
                <TourCard tour={tour} fromCityId={fromCity?.id} />
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
              borderRadius: "6px",
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
                sx={{ borderRadius: "6px", borderColor: "#e2e8f0", color: "#0f172a" }}
              >
                Try 250 km
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => setSelectedRadius("all")}
                sx={{ borderRadius: "6px", bgcolor: "#0f172a" }}
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
        slotProps={{ paper: { sx: { borderRadius: "6px", p: 1 } } }}
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
              borderColor: "#cbd5e1",
              color: "#ca8a04",
              borderRadius: "6px",
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
                  borderRadius: "6px",
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
            sx={{ color: "#64748b", borderRadius: "6px" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
}
