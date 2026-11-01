"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import HeroSection from "@/components/home/HeroSection";
import OfferSection from "@/components/home/OfferSection";
import ContinueSection from "@/components/home/ContinueSection";
import RibbonSection from "@/components/home/RibbonSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import WhySection from "@/components/home/WhySection";
import ToursSection from "@/components/home/ToursSection";
import OnTourSection from "@/components/home/OnTourSection";
import ScheduleSection from "@/components/home/ScheduleSection";
import ClipsSection from "@/components/home/ClipsSection";
import BlogSection from "@/components/home/BlogSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import FaqSection from "@/components/home/FaqSection";
import CompareSection from "@/components/home/CompareSection";
import LeadSection from "@/components/home/LeadSection";
import HomeHeader from "@/components/home/HomeHeader";
import Footer from "@/components/Footer";
import { calculateDistanceKm } from "@/lib/geo";
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

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#ffffff" }}>
      <HomeHeader
        overlay
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
      <RibbonSection />
      <CategoriesSection />
      <WhySection />

      <ToursSection
        tours={tours}
        allTours={allTours}
        loading={loading}
        error={error}
        cityName={userLocation ? userLocation.name.split(",")[0].replace(/^Near\s+/i, "") : "your town"}
        fromCity={fromCity}
        userLocation={userLocation}
        onFromChange={(c) => {
          setFromCity(c);
          if (c && c.lat !== undefined && c.lng !== undefined) setUserLocation({ lat: c.lat, lng: c.lng, name: `${c.name}, ${c.state}`, source: "manual" });
        }}
        onUseMyLocation={() => {
          setFromCity(null);
          resolveUserLocation();
        }}
        onRetry={fetchTours}
      />

      <OnTourSection />
      <ScheduleSection tours={allTours} />
      <ClipsSection />
      <BlogSection />
      <ReviewsSection tours={allTours} />
      <FaqSection />
      <CompareSection />
      <LeadSection />

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
