"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";

interface CityOption {
  id: string;
  name: string;
  state: string;
}

const RADIUS_OPTIONS = [
  { label: "Any distance", value: "all" },
  { label: "Within 50 km", value: "50" },
  { label: "Within 100 km", value: "100" },
  { label: "Within 250 km", value: "250" },
  { label: "Within 500 km", value: "500" },
];

const SORTS = [
  { value: "nearest", label: "Nearest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "duration-asc", label: "Duration: shortest" },
  { value: "duration-desc", label: "Duration: longest" },
  { value: "discount", label: "Biggest discount" },
];

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ py: 2 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.25 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function ToggleChips({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  if (!options.length) return <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>No options available</Typography>;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <Chip
            key={o}
            label={o}
            size="small"
            onClick={() => onToggle(o)}
            sx={{
              fontWeight: on ? 700 : 500,
              fontSize: "0.75rem",
              cursor: "pointer",
              bgcolor: on ? "#FF9900" : "#fff",
              color: "#0f172a",
              border: "1px solid",
              borderColor: on ? "#FF9900" : "#E2E2E2",
              "&:hover": { bgcolor: on ? "#E68A00" : "#FDF9EC" },
            }}
          />
        );
      })}
    </Box>
  );
}

function ToursExplorer() {
  const params = useSearchParams();

  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [styleOptions, setStyleOptions] = useState<string[]>([]);
  const [ratingOptions, setRatingOptions] = useState<string[]>([]);

  // Filters
  const [query, setQuery] = useState(params.get("q") || "");
  const [fromId, setFromId] = useState<string | null>(params.get("from"));
  const [toId, setToId] = useState<string | null>(params.get("to"));
  const [state, setState] = useState(params.get("state") || "All");
  const [styles, setStyles] = useState<string[]>([]);
  const [ratings, setRatings] = useState<string[]>([]);
  const [radius, setRadius] = useState(params.get("radius") || "all");
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [priceRange, setPriceRange] = useState<number[] | null>(null);
  const [durationRange, setDurationRange] = useState<number[] | null>(null);
  const [sort, setSort] = useState("nearest");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("ej_location");
      if (cached) setLocation(JSON.parse(cached));
    } catch {}
  }, []);

  useEffect(() => {
    const get = (url: string, set: (v: string[]) => void) =>
      fetch(url)
        .then((r) => r.json())
        .then((d) => d.success && set((d.data || []).map((x: any) => x.name)))
        .catch(() => {});
    get("/api/travel-styles", setStyleOptions);
    get("/api/physical-ratings", setRatingOptions);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = location ? `?lat=${location.lat}&lng=${location.lng}` : "";
    fetch(`/api/tours${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTours(d.data || []);
        else setError(d.error || "Failed to load tours");
      })
      .catch((e) => setError(e.message || "Network error loading tours"))
      .finally(() => setLoading(false));
  }, [location]);

  // Options derived from real data
  const { fromOptions, toOptions, states, bounds } = useMemo(() => {
    const from = new Map<string, CityOption>();
    const to = new Map<string, CityOption>();
    const st = new Set<string>();
    let pMin = Infinity, pMax = 0, dMin = Infinity, dMax = 0;
    for (const t of tours) {
      for (const d of t.departures || []) {
        const c = d.cityId;
        if (c?._id && !from.has(c._id)) from.set(c._id, { id: c._id, name: c.name, state: c.state });
      }
      // Target cities: where the tour is based plus every city on its itinerary.
      for (const c of [t.destinationId, ...(t.itineraryCities || [])]) {
        if (c?._id && !to.has(c._id)) to.set(c._id, { id: c._id, name: c.name, state: c.state });
      }
      if (t.state) st.add(t.state);
      pMin = Math.min(pMin, t.priceInr); pMax = Math.max(pMax, t.priceInr);
      dMin = Math.min(dMin, t.durationDays); dMax = Math.max(dMax, t.durationDays);
    }
    const byName = (a: CityOption, b: CityOption) => a.name.localeCompare(b.name);
    const has = tours.length > 0;
    return {
      fromOptions: [...from.values()].sort(byName),
      toOptions: [...to.values()].sort(byName),
      states: [...st].sort(),
      bounds: {
        price: has ? [Math.floor(pMin / 500) * 500, Math.ceil(pMax / 500) * 500] : [0, 0],
        duration: has ? [dMin, dMax] : [0, 0],
      },
    };
  }, [tours]);

  const price = priceRange ?? bounds.price;
  const duration = durationRange ?? bounds.duration;
  const priceActive = priceRange !== null && (price[0] > bounds.price[0] || price[1] < bounds.price[1]);
  const durationActive = durationRange !== null && (duration[0] > bounds.duration[0] || duration[1] < bounds.duration[1]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tours.filter((t) => {
      if (q) {
        const hay = [t.title, t.shortDescription, t.startingPoint, t.targetCity, t.state, ...(t.travelStyles || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (toId && t.destinationId?._id !== toId && !(t.itineraryCities || []).some((c: any) => c._id === toId)) return false;
      if (fromId && !(t.departures || []).some((d: any) => d.cityId?._id === fromId)) return false;
      if (state !== "All" && t.state !== state) return false;
      if (styles.length && !styles.some((s) => (t.travelStyles || []).includes(s))) return false;
      if (ratings.length && !ratings.includes(t.physicalRating)) return false;
      if (onlyDiscounted && !t.discountPercentage) return false;
      if (priceActive && (t.priceInr < price[0] || t.priceInr > price[1])) return false;
      if (durationActive && (t.durationDays < duration[0] || t.durationDays > duration[1])) return false;
      if (radius !== "all" && location) {
        if (t.distanceKm === null || t.distanceKm === undefined || t.distanceKm > Number(radius)) return false;
      }
      return true;
    });
    const sorted = [...list];
    const nearest = (t: any) => (t.distanceKm === null || t.distanceKm === undefined ? Infinity : t.distanceKm);
    switch (sort) {
      case "price-asc": sorted.sort((a, b) => a.priceInr - b.priceInr); break;
      case "price-desc": sorted.sort((a, b) => b.priceInr - a.priceInr); break;
      case "duration-asc": sorted.sort((a, b) => a.durationDays - b.durationDays); break;
      case "duration-desc": sorted.sort((a, b) => b.durationDays - a.durationDays); break;
      case "discount": sorted.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0)); break;
      default: sorted.sort((a, b) => nearest(a) - nearest(b));
    }
    return sorted;
  }, [tours, query, toId, fromId, state, styles, ratings, onlyDiscounted, priceActive, price, durationActive, duration, radius, location, sort]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) =>
    setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const fromCity = fromOptions.find((o) => o.id === fromId) || null;
  const toCity = toOptions.find((o) => o.id === toId) || null;

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (query.trim()) activeChips.push({ key: "q", label: `“${query.trim()}”`, clear: () => setQuery("") });
  if (fromCity) activeChips.push({ key: "from", label: `From ${fromCity.name}`, clear: () => setFromId(null) });
  if (toCity) activeChips.push({ key: "to", label: `To ${toCity.name}`, clear: () => setToId(null) });
  if (state !== "All") activeChips.push({ key: "state", label: state, clear: () => setState("All") });
  styles.forEach((s) => activeChips.push({ key: `s-${s}`, label: s, clear: () => setStyles((p) => p.filter((x) => x !== s)) }));
  ratings.forEach((s) => activeChips.push({ key: `r-${s}`, label: s, clear: () => setRatings((p) => p.filter((x) => x !== s)) }));
  if (radius !== "all") activeChips.push({ key: "rad", label: `Within ${radius} km`, clear: () => setRadius("all") });
  if (onlyDiscounted) activeChips.push({ key: "disc", label: "Discounted", clear: () => setOnlyDiscounted(false) });
  if (priceActive) activeChips.push({ key: "price", label: `₹${price[0].toLocaleString("en-IN")} – ₹${price[1].toLocaleString("en-IN")}`, clear: () => setPriceRange(null) });
  if (durationActive) activeChips.push({ key: "dur", label: `${duration[0]}–${duration[1]} days`, clear: () => setDurationRange(null) });

  const clearAll = () => {
    setQuery(""); setFromId(null); setToId(null); setState("All"); setStyles([]); setRatings([]);
    setRadius("all"); setOnlyDiscounted(false); setPriceRange(null); setDurationRange(null);
  };

  const noPrice = !bounds.price[1] || bounds.price[0] === bounds.price[1];
  const noDuration = !bounds.duration[1] || bounds.duration[0] === bounds.duration[1];
  const filtersPanel = (
    <Box>
      <FilterGroup title="Travel style">
        <ToggleChips options={styleOptions} selected={styles} onToggle={toggle(setStyles)} />
      </FilterGroup>
      <Divider />
      <FilterGroup title="Physical rating">
        <ToggleChips options={ratingOptions} selected={ratings} onToggle={toggle(setRatings)} />
      </FilterGroup>
      <Divider />
      <FilterGroup title="State">
        <TextField select fullWidth value={state} onChange={(e) => setState(e.target.value)}>
          <MenuItem value="All">All Indian states</MenuItem>
          {states.map((st) => (
            <MenuItem key={st} value={st}>{st}</MenuItem>
          ))}
        </TextField>
      </FilterGroup>
      <Divider />
      <FilterGroup title="Price per person">
        <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", mb: 0.5 }}>
          {noPrice ? "No range available" : `₹${price[0].toLocaleString("en-IN")} – ₹${price[1].toLocaleString("en-IN")}`}
        </Typography>
        <Slider
          disabled={noPrice}
          value={price}
          min={bounds.price[0]}
          max={bounds.price[1] || 1}
          step={500}
          onChange={(_, v) => setPriceRange(v as number[])}
          sx={{ color: "#FF9900", mx: 0.5, width: "calc(100% - 8px)" }}
        />
      </FilterGroup>
      <Divider />
      <FilterGroup title="Duration">
        <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", mb: 0.5 }}>
          {noDuration ? "No range available" : `${duration[0]} – ${duration[1]} days`}
        </Typography>
        <Slider
          disabled={noDuration}
          value={duration}
          min={bounds.duration[0]}
          max={bounds.duration[1] || 1}
          step={1}
          marks
          onChange={(_, v) => setDurationRange(v as number[])}
          sx={{ color: "#FF9900", mx: 0.5, width: "calc(100% - 8px)" }}
        />
      </FilterGroup>
      <Divider />
      <FilterGroup title="Distance from you">
        <TextField
          select
          fullWidth
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          disabled={!location}
          helperText={location ? `From ${location.name}` : "Location not detected yet — open the homepage to set it."}
        >
          {RADIUS_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      </FilterGroup>
      <Divider />
      <FilterGroup title="Deals">
        <ToggleChips options={["Discounted tours only"]} selected={onlyDiscounted ? ["Discounted tours only"] : []} onToggle={() => setOnlyDiscounted((v) => !v)} />
      </FilterGroup>
    </Box>
  );

  const searchFields = [
    { label: "From", placeholder: "Any starting point", value: fromCity, options: fromOptions, icon: <MyLocationRoundedIcon sx={{ color: "#E68A00" }} />, onChange: (v: CityOption | null) => setFromId(v?.id || null) },
    { label: "To", placeholder: "Any destination", value: toCity, options: toOptions, icon: <LocationOnIcon sx={{ color: "#ef4444" }} />, onChange: (v: CityOption | null) => setToId(v?.id || null) },
  ];

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#ffffff" }}>
      <Navbar userLocationName={location?.name} />

      {/* Search bar — stays pinned under the header */}
      <Box sx={{ position: "sticky", top: 68, zIndex: 900, bgcolor: "#FFF3DB", borderBottom: "1px solid #FFD699", py: 1.75 }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, md: 0.75 },
              borderRadius: "4px",
              border: "1px solid #E2E2E2",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "stretch",
              gap: { xs: 1.5, md: 0 },
            }}
          >
            <Box sx={{ flex: 1.3, display: "flex", alignItems: "center", gap: 1.5, px: { md: 2 } }}>
              <SearchRoundedIcon sx={{ color: "#64748b" }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Search</Typography>
                <TextField
                  variant="standard"
                  fullWidth
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tour name, place, state, style…"
                  slotProps={{ input: { disableUnderline: true, endAdornment: query ? (
                    <InputAdornment position="end">
                      <CloseRoundedIcon onClick={() => setQuery("")} sx={{ fontSize: 18, cursor: "pointer", color: "#94a3b8" }} />
                    </InputAdornment>
                  ) : undefined } }}
                  sx={{ "& input": { fontSize: "1rem", fontWeight: 600, color: "#0f172a", py: 0.5 } }}
                />
              </Box>
            </Box>
            {searchFields.map((f) => (
              <Box key={f.label} sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5, px: { md: 2 }, borderLeft: { md: "1px solid #E2E2E2" }, minWidth: 0 }}>
                {f.icon}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.label}</Typography>
                  <Autocomplete
                    options={f.options}
                    value={f.value}
                    getOptionLabel={(o) => o.name}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    noOptionsText="No cities available"
                    onChange={(_, v) => f.onChange(v)}
                    renderInput={(p) => (
                      <TextField
                        {...p}
                        variant="standard"
                        placeholder={f.placeholder}
                        slotProps={{ ...p.slotProps, input: { ...p.slotProps.input, disableUnderline: true } }}
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
              onClick={() => document.getElementById("tour-results")?.scrollIntoView({ behavior: "smooth" })}
              sx={{ minWidth: { md: 140 }, py: 1.1, bgcolor: "#FF9900", color: "#0f172a", fontSize: "0.95rem", fontWeight: 700, borderRadius: "4px", boxShadow: "none", "&:hover": { bgcolor: "#E68A00" } }}
            >
              Search
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* Filters (left) + results (right) */}
      <Container maxWidth="lg" id="tour-results" sx={{ py: { xs: 3, md: 4 }, flexGrow: 1 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px minmax(0, 1fr)" }, gap: { xs: 2, md: 4 }, alignItems: "start" }}>
          <Box sx={{ display: { xs: "none", md: "block" }, position: "sticky", top: 160, maxHeight: "calc(100vh - 176px)", overflowY: "auto", pr: 0.5 }}>
            <Box sx={{ border: "1px solid #E2E2E2", borderRadius: "4px", px: 2, bgcolor: "#fff" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Filters</Typography>
                <Button size="small" onClick={clearAll} disabled={!activeChips.length} sx={{ color: "#64748b" }}>Reset</Button>
              </Box>
              {filtersPanel}
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <Box>
                <Typography component="h1" sx={{ fontWeight: 800, color: "#0f172a", fontSize: { xs: "1.4rem", md: "1.7rem" }, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  {loading ? "Loading tours…" : `${filtered.length} ${filtered.length === 1 ? "tour" : "tours"}`}
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.88rem", mt: 0.25 }}>
                  {toCity ? `Tours to ${toCity.name}` : "All verified tours across India"}
                  {location ? ` · distances from ${location.name}` : ""}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button variant="outlined" startIcon={<TuneRoundedIcon />} onClick={() => setDrawerOpen(true)} sx={{ display: { md: "none" }, color: "#0f172a", borderColor: "#d1d5db" }}>
                  Filters{activeChips.length ? ` (${activeChips.length})` : ""}
                </Button>
                <TextField
                  select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  slotProps={{ input: { startAdornment: <SortRoundedIcon sx={{ fontSize: 18, mr: 0.75, color: "#64748b" }} /> } }}
                  sx={{ minWidth: 200, bgcolor: "#fff" }}
                >
                  {SORTS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            {activeChips.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2.5, alignItems: "center" }}>
                {activeChips.map((c) => (
                  <Chip key={c.key} label={c.label} size="small" onDelete={c.clear} sx={{ bgcolor: "#FFF0D1", color: "#8A5200", fontWeight: 700, border: "1px solid #FFD699", "& .MuiChip-deleteIcon": { color: "#B36B00" } }} />
                ))}
                <Button size="small" onClick={clearAll} sx={{ color: "#64748b", fontSize: "0.78rem" }}>Clear all</Button>
              </Box>
            )}

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress size={32} sx={{ color: "#0f172a" }} />
              </Box>
            )}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {!loading && filtered.length > 0 && (
              <Grid container spacing={2.5}>
                {filtered.map((tour) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={tour._id}>
                    <TourCard tour={tour} fromCityId={fromId || undefined} hideDescription />
                  </Grid>
                ))}
              </Grid>
            )}

            {!loading && !error && filtered.length === 0 && (
              <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: "1px dashed #d1d5db" }}>
                <TravelExploreRoundedIcon sx={{ fontSize: 48, color: "#9ca3af", mb: 1 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", mb: 0.75 }}>No tours match these filters</Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.88rem", maxWidth: 420, mx: "auto", mb: 2.5 }}>
                  Try removing a few filters or widening the price, duration or distance range.
                </Typography>
                <Button variant="contained" onClick={clearAll} startIcon={<RestartAltRoundedIcon />} sx={{ bgcolor: "#FF9900", color: "#0f172a", "&:hover": { bgcolor: "#E68A00" } }}>
                  Reset all filters
                </Button>
              </Paper>
            )}
          </Box>
        </Box>
      </Container>

      {/* Mobile filters */}
      <Drawer anchor="bottom" open={drawerOpen} onClose={() => setDrawerOpen(false)} slotProps={{ paper: { sx: { borderRadius: "12px 12px 0 0", maxHeight: "88vh", p: 2.5 } } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>Filters</Typography>
          <Button size="small" onClick={clearAll} sx={{ color: "#64748b" }}>Reset</Button>
        </Box>
        {filtersPanel}
        <Button fullWidth variant="contained" onClick={() => setDrawerOpen(false)} sx={{ mt: 1, py: 1.1, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 700, "&:hover": { bgcolor: "#E68A00" } }}>
          Show {filtered.length} {filtered.length === 1 ? "tour" : "tours"}
        </Button>
      </Drawer>

      <Footer />
    </Box>
  );
}

export default function ToursPage() {
  return (
    <Suspense fallback={null}>
      <ToursExplorer />
    </Suspense>
  );
}
