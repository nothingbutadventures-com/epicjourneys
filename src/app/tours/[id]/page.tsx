"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Grid,
  Chip,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  LinearProgress,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HikingRoundedIcon from "@mui/icons-material/HikingRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const dkey = (iso: string) => String(iso).slice(0, 10);
const utc = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString("en-IN", { ...o, timeZone: "UTC" });

/** All departure dates for every city, grouped by month, with a city filter. */
function DepartureDates({
  departures,
  selectedId,
  onPick,
}: {
  departures: any[];
  selectedId: string;
  onPick: (d: any) => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const cities: { id: string; name: string }[] = [];
  for (const d of departures) if (d.cityId && !cities.some((c) => c.id === d.cityId)) cities.push({ id: d.cityId, name: d.cityName });

  const list = departures.filter((d) => filter === "all" || d.cityId === filter);
  const months: { key: string; label: string; items: any[] }[] = [];
  for (const d of list) {
    const k = dkey(d.startDate).slice(0, 7);
    let m = months.find((x) => x.key === k);
    if (!m) months.push((m = { key: k, label: utc(d.startDate, { month: "short", year: "numeric" }), items: [] }));
    m.items.push(d);
  }

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, mb: 3, borderRadius: "6px", border: "1px solid #e5e7eb" }}>
      <Typography component="h2" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.4rem", letterSpacing: "-0.015em", mb: 0.5 }}>
        All departure dates ({departures.length})
      </Typography>
      <Typography sx={{ color: "#64748b", fontSize: "0.9rem", mb: 2.5 }}>As seats fill, prices can change — pick your city and date, then book.</Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
        {[{ id: "all", name: "All departures" }, ...cities].map((c) => {
          const on = filter === c.id;
          return (
            <Chip
              key={c.id}
              icon={on ? <CheckCircleIcon sx={{ fontSize: "18px !important", color: "#facc15 !important" }} /> : undefined}
              label={c.name}
              onClick={() => setFilter(c.id)}
              sx={{ fontWeight: 700, borderRadius: "6px", bgcolor: on ? "#0f172a" : "#f1f5f9", color: on ? "#facc15" : "#475569", border: "1px solid", borderColor: on ? "#0f172a" : "#e2e8f0", "&:hover": { bgcolor: on ? "#1e293b" : "#e2e8f0" } }}
            />
          );
        })}
      </Box>

      {months.length === 0 && <Typography sx={{ color: "#94a3b8" }}>No upcoming departures.</Typography>}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, rowGap: 2, alignItems: "stretch" }}>
        {months.map((m) => (
          <React.Fragment key={m.key}>
            <Box sx={{ width: 64, minHeight: 86, mt: 1.25, borderRadius: "6px", bgcolor: "#0f172a", color: "#facc15", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.3, textAlign: "center" }}>
              {m.label.split(" ").map((w) => (
                <span key={w}>{w}</span>
              ))}
            </Box>
            {m.items.map((d) => {
              const soldOut = d.available <= 0;
              const low = !soldOut && d.available <= 5;
              const sel = d._id === selectedId;
              const price = Math.round(d.price * (1 - (d.discountPercentage || 0) / 100));
              return (
                <Box key={d._id} sx={{ position: "relative", pt: 1.25 }}>
                  {low && (
                    <Box sx={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 1, px: 1, py: 0.1, borderRadius: "4px", bgcolor: "#dc2626", color: "#fff", fontSize: "0.68rem", fontWeight: 800, whiteSpace: "nowrap" }}>
                      {d.available} seat{d.available === 1 ? "" : "s"}
                    </Box>
                  )}
                  <Box>
                    <Box
                      role="button"
                      tabIndex={soldOut ? -1 : 0}
                      aria-pressed={sel}
                      onClick={() => !soldOut && onPick(d)}
                      onKeyDown={(e) => !soldOut && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick(d))}
                      sx={{
                        width: 112,
                        borderRadius: "6px",
                        border: "2px solid",
                        borderColor: sel ? "#0f172a" : low ? "#fca5a5" : "#e2e8f0",
                        bgcolor: sel ? "#fefce8" : soldOut ? "#f8fafc" : "#fff",
                        opacity: soldOut ? 0.55 : 1,
                        cursor: soldOut ? "not-allowed" : "pointer",
                        textAlign: "center",
                        overflow: "hidden",
                        outline: "none",
                        transition: "border-color .2s, background-color .2s",
                        "&:hover": soldOut ? {} : { borderColor: sel ? "#0f172a" : "#facc15" },
                      }}
                    >
                      <Box sx={{ py: 0.4, bgcolor: sel ? "#facc15" : "#f1f5f9", fontSize: "0.72rem", fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                        {utc(d.startDate, { weekday: "short" })}
                      </Box>
                      <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.2, mt: 0.5, textDecoration: soldOut ? "line-through" : "none" }}>
                        {utc(d.startDate, { day: "2-digit" })}
                      </Typography>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>₹{price.toLocaleString("en-IN")}</Typography>
                      <Typography sx={{ fontSize: "0.66rem", color: soldOut ? "#dc2626" : "#64748b", fontWeight: 600, pb: 0.75, px: 0.5 }} noWrap>
                        {soldOut ? "Sold out" : filter === "all" ? d.cityName : d.discountPercentage > 0 ? `${d.discountPercentage}% off` : "\u00a0"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </React.Fragment>
        ))}
      </Box>
    </Paper>
  );
}

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [numberOfTravelers, setNumberOfTravelers] = useState<number>(2);

  useEffect(() => {
    if (!id) return;

    fetchTour();
  }, [id]);

  // Start & end city picked on the homepage arrives as ?from=<cityId>
  const cityFromUrlApplied = React.useRef(false);
  useEffect(() => {
    if (!tour || cityFromUrlApplied.current) return;
    cityFromUrlApplied.current = true;
    const from = new URLSearchParams(window.location.search).get("from");
    if (from && (tour.departures || []).some((d: any) => d.cityId === from)) {
      setSelectedCityId(from);
    }
  }, [tour]);

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedDepartureId("");
    const url = new URL(window.location.href);
    if (cityId) url.searchParams.set("from", cityId);
    else url.searchParams.delete("from");
    window.history.replaceState(null, "", url.toString());
  };

  const fetchTour = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tours/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTour(data.data);
      } else {
        setError(data.error || "Tour not found");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load tour details");
    } finally {
      setLoading(false);
    }
  };

  const goToCheckout = () => {
    if (!tour || !selectedDeparture) return;
    const qs = new URLSearchParams({
      tour: tour.slug || tour._id,
      from: selectedCityId,
      departure: selectedDepartureId,
      travellers: String(numberOfTravelers),
      step: "travellers",
    });
    router.push(`/checkout?${qs.toString()}`);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CircularProgress sx={{ color: "#0f172a" }} />
        </Box>
        <Footer />
      </Box>
    );
  }

  if (error || !tour) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 8, flexGrow: 1 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || "Tour not found"}
          </Alert>
          <Button
            component={Link}
            href="/"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back to All Tours
          </Button>
        </Container>
        <Footer />
      </Box>
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const allDepartures: any[] = tour.departures || [];
  const cityOptions: { id: string; name: string }[] = [];
  for (const d of allDepartures) {
    if (d.cityId && !cityOptions.some((c) => c.id === d.cityId)) cityOptions.push({ id: d.cityId, name: d.cityName });
  }
  const selectedCity = cityOptions.find((c) => c.id === selectedCityId) || null;
  const departures: any[] = selectedCity ? allDepartures.filter((d) => d.cityId === selectedCityId) : [];
  const selectedDeparture = departures.find((d) => d._id === selectedDepartureId) || null;
  const discount = selectedDeparture?.discountPercentage || 0;
  const pricePool = (selectedCity ? departures : allDepartures).map((d) => d.price);
  const basePrice = selectedDeparture ? selectedDeparture.price : pricePool.length ? Math.min(...pricePool) : tour.priceInr || 0;
  const unitPrice = Math.round(basePrice * (1 - discount / 100));
  const totalPrice = unitPrice * numberOfTravelers;
  const maxTravelers = selectedDeparture ? selectedDeparture.available : 0;
  const canBook = Boolean(selectedDeparture) && maxTravelers >= numberOfTravelers && numberOfTravelers >= 1;

  const selectDeparture = (d: any) => {
    if (d.available <= 0) return;
    setSelectedDepartureId(d._id);
    setNumberOfTravelers((n) => Math.min(Math.max(1, n), d.available));
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <Typography component="h2" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.4rem", letterSpacing: "-0.015em", mb: 2.5 }}>
      {children}
    </Typography>
  );

  const cardSx = { p: { xs: 2.5, md: 3.5 }, mb: 3, borderRadius: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff" } as const;
  const gallery: string[] = [...new Set<string>([tour.coverImage, ...(tour.images || [])].filter(Boolean))].slice(0, 5);
  if (gallery.length === 0) gallery.push("https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80");

  const facts = [
    { icon: <AccessTimeIcon />, label: "Duration", value: `${tour.durationDays} days / ${tour.durationNights} nights` },
    { icon: <PeopleIcon />, label: "Group size", value: `Up to ${tour.maxGroupSize || 15} travellers` },
    { icon: <LocationOnIcon />, label: "Starts & ends", value: selectedCity ? selectedCity.name : "Select a city" },
    ...(tour.physicalRating ? [{ icon: <HikingRoundedIcon />, label: "Physical rating", value: tour.physicalRating }] : []),
  ];

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ pt: 3, pb: 8, flexGrow: 1 }}>
        {/* Breadcrumb */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 2, fontSize: "0.85rem", color: "#64748b", flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#64748b" }}>Home</Link>
          <span>/</span>
          <Link href="/tours" style={{ color: "#64748b" }}>Tours</Link>
          <span>/</span>
          <Box component="span" sx={{ color: "#0f172a", fontWeight: 600 }}>{tour.title}</Box>
        </Box>

        {/* Title */}
        <Typography component="h1" sx={{ fontSize: { xs: "1.7rem", md: "2.4rem" }, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, color: "#0f172a" }}>
          {tour.title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap", mt: 1.5, mb: 2.5, color: "#475569", fontSize: "0.92rem", fontWeight: 600 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: 18, color: "#ca8a04" }} />
            {tour.targetCity || tour.startingPoint}, {tour.state}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 18, color: "#ca8a04" }} />
            {tour.durationDays} days / {tour.durationNights} nights
          </Box>
          {tour.discountPercentage ? (
            <Chip label={`${tour.discountPercentage}% off`} size="small" sx={{ bgcolor: "#ef4444", color: "#fff", fontWeight: 700 }} />
          ) : null}
        </Box>

        {/* Gallery */}
        <Box
          sx={{
            display: "grid",
            gap: 1,
            mb: 3,
            borderRadius: "6px",
            overflow: "hidden",
            gridTemplateColumns: { xs: "1fr", md: gallery.length >= 3 ? "2fr 1fr 1fr" : gallery.length === 2 ? "2fr 1fr" : "1fr" },
            gridTemplateRows: { md: gallery.length >= 3 ? "210px 210px" : "420px" },
          }}
        >
          {gallery.map((src, i) => (
            <Box
              key={src}
              component="img"
              src={src}
              alt={i === 0 ? tour.title : ""}
              sx={{
                width: "100%",
                height: { xs: i === 0 ? 260 : 0, md: "100%" },
                display: { xs: i === 0 ? "block" : "none", md: "block" },
                objectFit: "cover",
                gridRow: { md: i === 0 && gallery.length >= 3 ? "1 / span 2" : "auto" },
              }}
            />
          ))}
        </Box>

        {/* Quick facts */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: `repeat(${facts.length}, 1fr)` }, border: "1px solid #e5e7eb", borderRadius: "6px", mb: 4, bgcolor: "#fffbeb" }}>
          {facts.map((f, i) => (
            <Box key={f.label} sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderLeft: { md: i ? "1px solid #fde68a" : "none" }, borderTop: { xs: i > 1 ? "1px solid #fde68a" : "none", md: "none" }, minWidth: 0 }}>
              <Box sx={{ color: "#a16207", display: "flex" }}>{f.icon}</Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</Typography>
                <Typography sx={{ fontSize: "0.92rem", color: "#0f172a", fontWeight: 700 }} noWrap>{f.value}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Grid container spacing={4}>
          {/* Left Column: Tour Details */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Overview */}
            <Paper elevation={0} sx={cardSx}>
              <SectionTitle>Tour overview</SectionTitle>
              {tour.shortDescription && (
                <Typography sx={{ color: "#0f172a", fontWeight: 600, lineHeight: 1.7, mb: 1.5, fontSize: "1.02rem" }}>{tour.shortDescription}</Typography>
              )}
              <Typography variant="body1" sx={{ color: "#334155", lineHeight: 1.8, fontSize: "0.98rem", whiteSpace: "pre-line" }}>
                {tour.description}
              </Typography>
              {tour.travelStyles && tour.travelStyles.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 2.5 }}>
                  {tour.travelStyles.map((st: string) => (
                    <Chip key={st} label={st} size="small" sx={{ bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 700, border: "1px solid #fde68a" }} />
                  ))}
                </Box>
              )}
              <Box sx={{ mt: 2.5, p: 2, borderRadius: "6px", bgcolor: "#fffbeb", border: "1px solid #fde68a", display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                <LocationOnIcon sx={{ color: "#a16207", fontSize: 20, mt: 0.15 }} />
                <Typography variant="body2" sx={{ color: "#1e293b" }}>
                  Based in <strong>{tour.targetCity || tour.startingPoint}</strong> ({tour.state}). Choose your start &amp; end city when booking{selectedCity ? <> — currently <strong>{selectedCity.name}</strong></> : null}.
                </Typography>
              </Box>
            </Paper>

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <Paper elevation={0} sx={cardSx}>
                <SectionTitle>Key highlights</SectionTitle>
                <Grid container spacing={1.75}>
                  {tour.highlights.map((highlight: string, index: number) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 20, mt: 0.2 }} />
                        <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500, fontSize: "0.94rem" }}>{highlight}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* Day-by-Day Itinerary */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <Paper elevation={0} sx={cardSx}>
                <SectionTitle>Day-by-day itinerary</SectionTitle>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  {tour.itinerary.map((day: any) => (
                    <Accordion
                      key={day.day}
                      defaultExpanded={day.day === 1}
                      disableGutters
                      sx={{ border: "1px solid #e5e7eb", borderRadius: "6px !important", "&:before": { display: "none" }, boxShadow: "none", "&.Mui-expanded": { borderColor: "#fde047" } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Chip label={`Day ${day.day}`} size="small" sx={{ backgroundColor: "#facc15", color: "#0f172a", fontWeight: 700, height: 24 }} />
                          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.98rem" }}>{day.title}</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                        <Typography variant="body2" sx={{ color: "#475569", lineHeight: 1.7, mb: 1.5, fontSize: "0.92rem" }}>{day.description}</Typography>
                        {(day.meals || day.stay) && (
                          <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", pt: 1.25, borderTop: "1px dashed #e5e7eb", color: "#64748b", fontSize: "0.82rem" }}>
                            {day.meals && <span><strong style={{ color: "#334155" }}>Meals:</strong> {day.meals}</span>}
                            {day.stay && <span><strong style={{ color: "#334155" }}>Stay:</strong> {day.stay}</span>}
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </Paper>
            )}

            {/* All departure dates (every city) */}
            {allDepartures.length > 0 && (
              <DepartureDates
                departures={allDepartures}
                selectedId={selectedDepartureId}
                onPick={(d) => {
                  handleCityChange(d.cityId);
                  selectDeparture(d);
                }}
              />
            )}

            {/* Inclusions and Exclusions */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                  <Typography component="h2" sx={{ fontWeight: 800, mb: 2, fontSize: "1.15rem" }}>What&apos;s included</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1 }}>
                    {tour.inclusions?.map((inc: string, i: number) => (
                      <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: "#16a34a", mt: 0.3 }} />
                        <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.6 }}>{inc}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                  <Typography component="h2" sx={{ fontWeight: 800, mb: 2, fontSize: "1.15rem" }}>What&apos;s not included</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1 }}>
                    {tour.exclusions?.map((exc: string, i: number) => (
                      <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                        <CancelIcon sx={{ fontSize: 18, color: "#dc2626", mt: 0.3 }} />
                        <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.6 }}>{exc}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Right Column: Sticky Booking Widget */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: "sticky", top: 92 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                    {selectedDeparture ? "Price Per Traveler" : "Starting From"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "2rem", letterSpacing: "-0.02em" }}>
                      ₹{unitPrice.toLocaleString("en-IN")}
                    </Typography>
                    {discount > 0 && (
                      <Typography sx={{ color: "#94a3b8", textDecoration: "line-through", fontSize: "0.95rem" }}>
                        ₹{basePrice.toLocaleString("en-IN")}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      / person (all taxes incl.)
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Start & end city */}
                <TextField
                  select
                  label="Start & End City"
                  value={selectedCityId}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={cityOptions.length === 0}
                  helperText={cityOptions.length === 0 ? "No cities available yet" : "Where you begin and finish the journey"}
                  fullWidth
                  sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                >
                  {cityOptions.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Available dates */}
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", mb: 1.25 }}>
                  Select your dates
                </Typography>

                {!selectedCity ? (
                  <Alert severity="info" sx={{ mb: 3, borderRadius: "6px" }}>
                    {cityOptions.length === 0
                      ? "No upcoming dates are open for this journey right now. Please check back soon."
                      : "Select your start & end city to see available dates."}
                  </Alert>
                ) : departures.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 3, borderRadius: "6px" }}>
                    No upcoming dates from {selectedCity.name}. Try another city.
                  </Alert>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2.5, maxHeight: 320, overflowY: "auto", pr: 0.5 }}>
                    {departures.map((d) => {
                      const soldOut = d.available <= 0;
                      const selected = d._id === selectedDepartureId;
                      const pct = Math.min(100, Math.round((d.booked / d.seats) * 100));
                      return (
                        <Box
                          key={d._id}
                          role="radio"
                          aria-checked={selected}
                          aria-disabled={soldOut}
                          tabIndex={soldOut ? -1 : 0}
                          onClick={() => selectDeparture(d)}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), selectDeparture(d))}
                          sx={{
                            p: 1.5,
                            borderRadius: "6px",
                            border: "1px solid",
                            borderColor: selected ? "#0f172a" : "#e2e8f0",
                            bgcolor: selected ? "#fefce8" : soldOut ? "#f8fafc" : "#ffffff",
                            opacity: soldOut ? 0.65 : 1,
                            cursor: soldOut ? "not-allowed" : "pointer",
                            outline: "none",
                            transition: "background-color .15s, border-color .15s",
                            "&:hover": soldOut ? {} : { bgcolor: selected ? "#fefce8" : "#f8fafc" },
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 0.75 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                              {formatDate(d.startDate)} – {formatDate(d.endDate)}
                            </Typography>
                            {d.discountPercentage > 0 && !soldOut && (
                              <Chip label={`${d.discountPercentage}% OFF`} size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#ef4444", color: "#fff", borderRadius: "6px" }} />
                            )}
                            {soldOut && (
                              <Chip label="Sold out" size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#e2e8f0", color: "#475569", borderRadius: "6px" }} />
                            )}
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              height: 6,
                              borderRadius: "6px",
                              bgcolor: "#e2e8f0",
                              "& .MuiLinearProgress-bar": { bgcolor: soldOut ? "#94a3b8" : d.available <= 3 ? "#ef4444" : "#10b981" },
                            }}
                          />
                          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
                            <Typography sx={{ fontSize: "0.74rem", color: soldOut ? "#64748b" : d.available <= 3 ? "#dc2626" : "#059669", fontWeight: 700 }}>
                              {soldOut ? "No seats left" : `${d.available} seat${d.available === 1 ? "" : "s"} left`}
                            </Typography>
                            <Typography sx={{ fontSize: "0.74rem", color: "#64748b" }}>
                              {d.booked} booked of {d.seats}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
                  <TextField
                    label="Number of Travelers"
                    type="number"
                    value={numberOfTravelers}
                    disabled={!selectedDeparture}
                    onChange={(e) =>
                      setNumberOfTravelers(Math.min(Math.max(1, parseInt(e.target.value) || 1), Math.max(1, maxTravelers)))
                    }
                    helperText={selectedDeparture ? `Up to ${maxTravelers} on this date` : "Choose a date first"}
                    slotProps={{ htmlInput: { min: 1, max: Math.max(1, maxTravelers) } }}
                    fullWidth
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                  />

                  <Box sx={{ p: 2, backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        ₹{unitPrice.toLocaleString("en-IN")} × {numberOfTravelers} Travelers
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ₹{totalPrice.toLocaleString("en-IN")}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1, borderTop: "1px solid #e2e8f0" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                        Total Amount:
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0f172a" }}>
                        ₹{totalPrice.toLocaleString("en-IN")}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={!canBook}
                  onClick={goToCheckout}
                  sx={{
                    py: 1.5,
                    backgroundColor: "#facc15",
                    color: "#0f172a",
                    borderRadius: "6px",
                    "&:hover": { backgroundColor: "#eab308" },
                    "&.Mui-disabled": { backgroundColor: "#f1f5f9", color: "#94a3b8" },
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  {selectedDeparture ? "Book This Journey" : "Select a date to book"}
                </Button>

                <Box sx={{ mt: 1.75, display: "flex", flexDirection: "column", gap: 0.75 }}>
                  {[
                    { icon: <BoltRoundedIcon />, text: "Instant confirmation" },
                    { icon: <VerifiedRoundedIcon />, text: "Verified local partner" },
                  ].map((r) => (
                    <Box key={r.text} sx={{ display: "flex", alignItems: "center", gap: 1, color: "#475569", fontSize: "0.82rem", fontWeight: 600 }}>
                      {React.cloneElement(r.icon as React.ReactElement<any>, { sx: { fontSize: 17, color: "#a16207" } })}
                      {r.text}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
}
