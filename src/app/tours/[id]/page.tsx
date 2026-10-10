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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [bookingDialogOpen, setBookingDialogOpen] = useState<boolean>(false);
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [numberOfTravelers, setNumberOfTravelers] = useState<number>(2);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

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

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour._id,
          customerName,
          customerEmail,
          customerPhone,
          departureId: selectedDepartureId,
          numberOfTravelers,
          specialRequests,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setConfirmedBooking(data.data);
        setBookingDialogOpen(false);
        fetchTour();
      } else {
        setBookingError(data.error || "Failed to complete booking");
      }
    } catch (e: any) {
      setBookingError(e.message || "Network error while submitting booking");
    } finally {
      setBookingLoading(false);
    }
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

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ pt: 3, pb: 8, flexGrow: 1 }}>
        {/* Back Link */}
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2, color: "#475569", fontWeight: 600, fontSize: "0.9rem", "&:hover": { bgcolor: "transparent", color: "#0f172a" } }}
        >
          Back to Explorations
        </Button>

        {/* Hero Banner / Image */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "6px",
            overflow: "hidden",
            mb: 3,
            border: "none",
            position: "relative",
          }}
        >
          <Box
            component="img"
            src={
              tour.coverImage ||
              "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80"
            }
            alt={tour.title}
            sx={{
              width: "100%",
              height: { xs: 300, md: 460 },
              objectFit: "cover",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              p: { xs: 2.5, md: 4 },
              background: "linear-gradient(to top, rgba(8, 13, 26, 0.92) 0%, rgba(8, 13, 26, 0.45) 60%, transparent 100%)",
              color: "#ffffff",
            }}
          >
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
              <Chip
                icon={<LocationOnIcon sx={{ fontSize: "14px !important", color: "#0f172a !important" }} />}
                label={`${tour.targetCity || tour.startingPoint}, ${tour.state}`}
                size="small"
                sx={{ backgroundColor: "#facc15", color: "#0f172a", fontWeight: 700, borderRadius: "6px" }}
              />
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />}
                label={`${tour.durationDays} Days / ${tour.durationNights} Nights`}
                size="small"
                sx={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#ffffff", borderRadius: "6px" }}
              />
              <Chip
                icon={<PeopleIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />}
                label={`Max ${tour.maxGroupSize || 15} travelers`}
                size="small"
                sx={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#ffffff", borderRadius: "6px" }}
              />
            </Box>
            <Typography variant="h1" sx={{ fontSize: { xs: "1.7rem", md: "2.6rem" }, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
              {tour.title}
            </Typography>
          </Box>
        </Paper>

        {/* Quick facts */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { icon: <AccessTimeIcon />, label: "Duration", value: `${tour.durationDays} Days / ${tour.durationNights} Nights` },
            { icon: <PeopleIcon />, label: "Group Size", value: `Up to ${tour.maxGroupSize || 15} travelers` },
            { icon: <LocationOnIcon />, label: "Based In", value: tour.targetCity || tour.startingPoint },
            { icon: <LocationOnIcon />, label: "Starts & Ends At", value: selectedCity ? selectedCity.name : "Select a city" },
          ].map((f) => (
            <Grid size={{ xs: 6, md: 3 }} key={f.label}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 1.5, height: "100%" }}>
                <Box sx={{ width: 42, height: 42, borderRadius: "6px", bgcolor: "#fefce8", color: "#ca8a04", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {f.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {f.label}
                  </Typography>
                  <Typography sx={{ fontSize: "0.92rem", color: "#0f172a", fontWeight: 700 }} noWrap>
                    {f.value}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4}>
          {/* Left Column: Tour Details */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Overview */}
            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, mb: 3, borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 2.5, fontSize: "1.35rem", letterSpacing: "-0.015em" }}>
                Tour Overview
              </Typography>
              <Typography variant="body1" sx={{ color: "#334155", lineHeight: 1.8, mb: 3, fontSize: "0.98rem" }}>
                {tour.description}
              </Typography>

              {/* Destination Point Notice */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: "6px",
                  backgroundColor: "#fefce8",
                  border: "1px solid #fef08a",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <LocationOnIcon sx={{ color: "#ca8a04" }} />
                <Typography variant="body2" sx={{ color: "#1e293b", fontWeight: 500 }}>
                  <strong>Origin & Destination:</strong> This journey is based in <strong>{tour.targetCity || tour.startingPoint}</strong> ({tour.state}). Choose your start & end city when booking{selectedCity ? <> — currently <strong>{selectedCity.name}</strong></> : null}.
                </Typography>
              </Box>
            </Paper>

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, mb: 3, borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 2.5, fontSize: "1.35rem", letterSpacing: "-0.015em" }}>
                  Key Highlights
                </Typography>
                <Grid container spacing={1.5}>
                  {tour.highlights.map((highlight: string, index: number) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20, mt: 0.2 }} />
                        <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500, fontSize: "0.92rem" }}>
                          {highlight}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* Day-by-Day Itinerary */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, mb: 3, borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 2.5, fontSize: "1.35rem", letterSpacing: "-0.015em" }}>
                  Day-by-Day Itinerary
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {tour.itinerary.map((day: any) => (
                    <Accordion
                      key={day.day}
                      defaultExpanded={day.day === 1}
                      sx={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px !important",
                        "&:before": { display: "none" },
                        boxShadow: "none",
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Chip
                            label={`Day ${day.day}`}
                            size="small"
                            sx={{ backgroundColor: "#facc15", color: "#0f172a", fontWeight: 700, height: 24, borderRadius: "6px" }}
                          />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.98rem" }}>
                            {day.title}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                        <Typography variant="body2" sx={{ color: "#475569", lineHeight: 1.7, mb: 2, fontSize: "0.92rem" }}>
                          {day.description}
                        </Typography>
                        {(day.meals || day.stay) && (
                          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", pt: 1, borderTop: "1px dashed #e2e8f0" }}>
                            {day.meals && (
                              <Typography variant="caption" sx={{ color: "#64748b" }}>
                                <strong>Meals:</strong> {day.meals}
                              </Typography>
                            )}
                            {day.stay && (
                              <Typography variant="caption" sx={{ color: "#64748b" }}>
                                <strong>Stay:</strong> {day.stay}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Inclusions and Exclusions */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#10b981", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon /> What&apos;s Included
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {tour.inclusions?.map((inc: string, i: number) => (
                      <Typography key={i} variant="body2" sx={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        • {inc}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ef4444", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <CancelIcon /> What&apos;s Not Included
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {tour.exclusions?.map((exc: string, i: number) => (
                      <Typography key={i} variant="body2" sx={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        • {exc}
                      </Typography>
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
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 18px 40px -22px rgba(15, 23, 42, 0.25)",
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
                  onClick={() => setBookingDialogOpen(true)}
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

                <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", textAlign: "center", mt: 1.5 }}>
                  Instant confirmation • Verified local partner
                </Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Booking Dialog */}
      <Dialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "6px" } } }}
      >
        <form onSubmit={handleBookingSubmit}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            Complete Your Booking
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 2.5 }}>
              Enter your details to confirm your slot for <strong>{tour.title}</strong>.
            </Typography>

            {bookingError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "6px" }}>
                {bookingError}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Full Name"
                required
                fullWidth
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
              />

              <TextField
                label="Email Address"
                type="email"
                required
                fullWidth
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
              />

              <TextField
                label="Phone Number (WhatsApp preferred)"
                required
                fullWidth
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
              />

              <TextField
                label="Special Requests / Dietary Needs (Optional)"
                multiline
                rows={2}
                fullWidth
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
              />

              <Box sx={{ p: 2, borderRadius: "6px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                  Start & end city: <strong>{selectedCity?.name}</strong> • Dates: <strong>{selectedDeparture ? `${formatDate(selectedDeparture.startDate)} – ${formatDate(selectedDeparture.endDate)}` : ""}</strong> • Travelers: <strong>{numberOfTravelers}</strong>
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  Grand Total: ₹{totalPrice.toLocaleString("en-IN")}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button onClick={() => setBookingDialogOpen(false)} sx={{ color: "#64748b", borderRadius: "6px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={bookingLoading}
              sx={{ backgroundColor: "#facc15", color: "#0f172a", fontWeight: 700, borderRadius: "6px", "&:hover": { backgroundColor: "#eab308" } }}
            >
              {bookingLoading ? "Confirming..." : "Confirm Booking"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Booking Confirmation Dialog */}
      <Dialog
        open={Boolean(confirmedBooking)}
        onClose={() => setConfirmedBooking(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "6px", p: 2 } } }}
      >
        <Box sx={{ textAlign: "center", pt: 2, pb: 1 }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: "#10b981", mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
            Booking Confirmed!
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
            Your adventure has been reserved. Our local destination partner will contact you shortly.
          </Typography>

          <Paper elevation={0} sx={{ p: 2, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", mb: 3, borderRadius: "6px" }}>
            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", textTransform: "uppercase" }}>
              Booking Reference Number
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#ca8a04", letterSpacing: "0.05em" }}>
              {confirmedBooking?.bookingRef}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" sx={{ color: "#334155" }}>
              Total Paid: <strong>₹{confirmedBooking?.totalAmountInr?.toLocaleString("en-IN")}</strong>
            </Typography>
          </Paper>

          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setConfirmedBooking(null);
              router.push("/");
            }}
            sx={{ backgroundColor: "#facc15", color: "#0f172a", fontWeight: 700, borderRadius: "6px", "&:hover": { backgroundColor: "#eab308" } }}
          >
            Explore More Journeys
          </Button>
        </Box>
      </Dialog>

      <Footer />
    </Box>
  );
}
