"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LocationCityRoundedIcon from "@mui/icons-material/LocationCityRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import Link from "next/link";
import { Reveal } from "@/components/home/HomeSections";
import HeroSection from "@/components/home/HeroSection";
import OfferSection from "@/components/home/OfferSection";
import ContinueSection from "@/components/home/ContinueSection";
import HomeHeader from "@/components/home/HomeHeader";
import Footer from "@/components/Footer";
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

  // Free-text search from the hero box: what is typed, and what was last submitted.
  const [searchText, setSearchText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
      const res = await fetch("/api/geo/ip-location", { signal: AbortSignal.timeout(5000) });
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
  }, [userLocation, selectedRadius, selectedState, fromCity?.id, toCity?.id, searchQuery]);

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

      if (searchQuery) queryParams.set("search", searchQuery);

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

  // Start & end cities (departure cities) with the number of tours departing from each.
  const nearbyDestinations = useMemo(() => {
    const map = new Map<string, { id: string; name: string; state: string; tourCount: number; lat?: number; lng?: number }>();
    for (const t of allTours) {
      const seen = new Set<string>();
      for (const d of t.departures || []) {
        const c = d.cityId;
        if (!c?._id || seen.has(c._id)) continue;
        seen.add(c._id);
        const e = map.get(c._id) || { id: c._id, name: c.name, state: c.state, tourCount: 0, lat: c.coordinates?.lat, lng: c.coordinates?.lng };
        e.tourCount += 1;
        map.set(c._id, e);
      }
    }
    const covers = new Map<string, string>(dbDestinations.map((d: any) => [String(d._id), d.coverImage as string]));
    const entries = [...map.values()].map((c) => ({
      id: c.id,
      name: c.name,
      state: c.state,
      tourCount: c.tourCount,
      coverImage: covers.get(c.id) || "",
      distance:
        userLocation && c.lat !== undefined && c.lng !== undefined
          ? calculateDistanceKm(userLocation.lat, userLocation.lng, c.lat, c.lng)
          : null,
    }));
    if (userLocation) entries.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    else entries.sort((a, b) => b.tourCount - a.tourCount);
    return entries.slice(0, 8);
  }, [allTours, dbDestinations, userLocation]);

  const scrollToResults = () => document.getElementById("tour-results")?.scrollIntoView({ behavior: "smooth" });

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

  const sectionTitle = (title: React.ReactNode, sub?: string, action?: React.ReactNode) => (
    <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: 3, flexWrap: "wrap" }}>
      <Box>
        <Typography component="h2" sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" }, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          {title}
        </Typography>
        {sub && <Typography sx={{ color: "#64748b", fontSize: "0.95rem", mt: 0.5 }}>{sub}</Typography>}
      </Box>
      {action}
    </Box>
  );

  const reasons = [
    { icon: VerifiedUserOutlinedIcon, title: "Verified tours", text: "Every itinerary is checked by our team before it is listed." },
    { icon: Groups2OutlinedIcon, title: "Local operators", text: "Trips are run by partners who live and work in the destination." },
    { icon: PaymentsOutlinedIcon, title: "Clear pricing", text: "Per-person prices in rupees. Reserve with a small deposit on many tours." },
    { icon: SupportAgentOutlinedIcon, title: "Help when you need it", text: "Questions before or during your trip? Our team is a message away." },
  ];

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#ffffff" }}>
      <HomeHeader
        userLocationName={userLocation?.name}
        onLocationClick={() => setLocationDialogOpen(true)}
      />

      <HeroSection
        city={userLocation ? userLocation.name.split(",")[0].replace(/^Near\s+/i, "") : "your town"}
        onCityClick={() => setLocationDialogOpen(true)}
        query={searchText}
        onQueryChange={setSearchText}
        onSearch={() => {
          setSearchQuery(searchText.trim());
          scrollToResults();
        }}
      />

      <OfferSection tours={allTours} city={nearbyDestinations[0] ? { id: nearbyDestinations[0].id, name: nearbyDestinations[0].name } : null} />
      <ContinueSection />

      {/* Tours starting near you */}
      {nearbyDestinations.length > 0 && (
        <Container maxWidth="lg" id="destinations" sx={{ pt: { xs: 6, md: 8 } }}>
          <Reveal>
            {sectionTitle(
              <>Tours starting near {userLocation ? userLocation.name.split(",")[0] : "you"}</>,
              "Departure cities, nearest first.",
              <Button component={Link} href="/tours" endIcon={<ArrowForwardRoundedIcon />} sx={{ color: "#0f172a", fontWeight: 700 }}>
                View all tours
              </Button>
            )}
          </Reveal>
          <Grid container spacing={2.5}>
            {nearbyDestinations.map(({ id, name, state, distance, tourCount }) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={id}>
                <Box
                  component={Link}
                  href={`/tours?${new URLSearchParams({
                    from: id,
                    ...(selectedState !== "All" ? { state: selectedState } : {}),
                    ...(selectedRadius !== "all" ? { radius: selectedRadius } : {}),
                  }).toString()}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.75,
                    p: 2,
                    height: "100%",
                    bgcolor: "#fff",
                    border: "1px solid #E2E2E2",
                    borderRadius: "4px",
                    transition: "border-color .2s, box-shadow .2s",
                    "&:hover": { borderColor: "#FF9900", boxShadow: "0 6px 16px -10px rgba(15,23,42,0.25)" },
                    "&:hover .city-arrow": { transform: "translateX(3px)", color: "#0f172a" },
                  }}
                >
                  <Box sx={{ width: 46, height: 46, borderRadius: "4px", bgcolor: "#FFF0D1", color: "#B36B00", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <LocationCityRoundedIcon />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.25 }} noWrap>{name}</Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }} noWrap>
                      {tourCount} {tourCount === 1 ? "tour" : "tours"}
                      {distance !== null ? ` · ${formatDistance(distance)} away` : ` · ${state}`}
                    </Typography>
                  </Box>
                  <ArrowForwardRoundedIcon className="city-arrow" sx={{ fontSize: 20, color: "#94a3b8", transition: "all .2s" }} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* Tours */}
      <Container maxWidth="lg" id="tour-results" sx={{ pt: { xs: 6, md: 8 }, pb: { xs: 6, md: 8 }, flexGrow: 1 }}>
        {sectionTitle(
          selectedRadius !== "all" ? `Tours starting within ${selectedRadius} km` : "Upcoming tours",
          `${tours.length} ${tours.length === 1 ? "tour" : "tours"}, nearest to ${userLocation?.name || "your location"} first.`,
          <Button size="small" startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />} onClick={fetchTours} sx={{ color: "#64748b" }}>
            Refresh
          </Button>
        )}

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", gap: 2, mb: 3, pb: 3, borderBottom: "1px solid #E2E2E2" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <LocationOnIcon sx={{ fontSize: 18, color: "#E68A00" }} />
            <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>{userLocation?.name || "Detecting location…"}</Typography>
            <Box component="span" onClick={() => setLocationDialogOpen(true)} sx={{ color: "#B36B00", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>
              Change city
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {radiusOptions.map((opt) => {
              const active = selectedRadius === opt.value;
              return (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  onClick={() => setSelectedRadius(opt.value)}
                  size="small"
                  sx={{ fontWeight: 600, bgcolor: active ? "#FF9900" : "#fff", color: "#0f172a", border: "1px solid", borderColor: active ? "#FF9900" : "#E2E2E2", "&:hover": { bgcolor: active ? "#E68A00" : "#FDF9EC" } }}
                />
              );
            })}
          </Box>
        </Box>

        <Box sx={{ mb: 3, display: "flex", gap: 0.75, overflowX: "auto", pb: 0.5 }}>
          {popularStates.map((st) => {
            const active = selectedState === st;
            return (
              <Chip
                key={st}
                label={st === "All" ? "All states" : st}
                onClick={() => setSelectedState(st)}
                sx={{ fontWeight: 600, bgcolor: active ? "#0f172a" : "#fff", color: active ? "#fff" : "#334155", border: "1px solid", borderColor: active ? "#0f172a" : "#E2E2E2", "&:hover": { bgcolor: active ? "#1e293b" : "#FDF9EC" } }}
              />
            );
          })}
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={32} sx={{ color: "#0f172a" }} />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {!loading && tours.length > 0 && (
          <Grid container spacing={2.5}>
            {tours.map((tour) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tour._id}>
                <TourCard tour={tour} fromCityId={fromCity?.id} />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && tours.length === 0 && (
          <Paper elevation={0} sx={{ p: 5, textAlign: "center", border: "1px dashed #d1d5db", my: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", mb: 1 }}>
              No tours found within {selectedRadius} km of {userLocation?.name || "your location"}
            </Typography>
            <Typography sx={{ color: "#64748b", maxWidth: 460, mx: "auto", mb: 2.5, fontSize: "0.88rem" }}>
              Try a wider distance to see tours from other cities.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              <Button variant="outlined" onClick={() => setSelectedRadius("250")}>Try 250 km</Button>
              <Button variant="contained" onClick={() => setSelectedRadius("all")} sx={{ bgcolor: "#FF9900", color: "#0f172a", "&:hover": { bgcolor: "#E68A00" } }}>
                View all India
              </Button>
            </Box>
          </Paper>
        )}

        {!loading && tours.length > 0 && (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button component={Link} href="/tours" variant="outlined" endIcon={<ArrowForwardRoundedIcon />} sx={{ px: 4, py: 1.1, fontWeight: 700, color: "#0f172a", borderColor: "#0f172a" }}>
              Browse all tours with filters
            </Button>
          </Box>
        )}
      </Container>

      {/* Why us */}
      <Box sx={{ bgcolor: "#FFF6E5", borderTop: "1px solid #FFD699" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          {sectionTitle("Why travel with EpicJourneys")}
          <Grid container spacing={4}>
            {reasons.map(({ icon: Icon, title, text }) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={title}>
                <Icon sx={{ fontSize: 34, color: "#B36B00", mb: 1.25 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", mb: 0.5 }}>{title}</Typography>
                <Typography sx={{ color: "#475569", fontSize: "0.92rem", lineHeight: 1.65 }}>{text}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

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
              borderColor: "#cbd5e1",
              color: "#E68A00",
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
                  bgcolor: "#F2F4F7",
                  border: "1px solid #E2E2E2",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#E2E2E2" },
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
