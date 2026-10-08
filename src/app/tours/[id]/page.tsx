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
  const [travelDate, setTravelDate] = useState<string>("");
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

    // Set default travel date to 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setTravelDate(defaultDate.toISOString().split("T")[0]);

    fetchTour();
  }, [id]);

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
          travelDate,
          numberOfTravelers,
          specialRequests,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setConfirmedBooking(data.data);
        setBookingDialogOpen(false);
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

  const totalPrice = (tour.priceInr || 0) * numberOfTravelers;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        {/* Back Link */}
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3, color: "#64748b", fontWeight: 500 }}
        >
          Back to Explorations
        </Button>

        {/* Hero Banner / Image */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "4px",
            overflow: "hidden",
            mb: 4,
            border: "1px solid #e2e8f0",
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
              height: { xs: 260, md: 420 },
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
              background: "linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 60%, transparent 100%)",
              color: "#ffffff",
            }}
          >
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
              <Chip
                icon={<LocationOnIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />}
                label={`${tour.startingPoint}, ${tour.state}`}
                size="small"
                sx={{ backgroundColor: "rgba(37, 99, 235, 0.9)", color: "#ffffff", fontWeight: 600, borderRadius: "4px" }}
              />
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />}
                label={`${tour.durationDays} Days / ${tour.durationNights} Nights`}
                size="small"
                sx={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#ffffff", borderRadius: "4px" }}
              />
              <Chip
                icon={<PeopleIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />}
                label={`Max ${tour.maxGroupSize || 15} travelers`}
                size="small"
                sx={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#ffffff", borderRadius: "4px" }}
              />
            </Box>
            <Typography variant="h1" sx={{ fontSize: { xs: "1.5rem", md: "2.25rem" }, fontWeight: 800 }}>
              {tour.title}
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={4}>
          {/* Left Column: Tour Details */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Overview */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: "4px", border: "1px solid #e2e8f0" }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", mb: 2 }}>
                Tour Overview
              </Typography>
              <Typography variant="body1" sx={{ color: "#334155", lineHeight: 1.7, mb: 3 }}>
                {tour.description}
              </Typography>

              {/* Destination Point Notice */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: "4px",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <LocationOnIcon sx={{ color: "#2563eb" }} />
                <Typography variant="body2" sx={{ color: "#1e293b", fontWeight: 500 }}>
                  <strong>Origin & Destination:</strong> Tour starts at <strong>{tour.startingPoint}</strong> and concludes at <strong>{tour.endingPoint}</strong> ({tour.state}).
                </Typography>
              </Box>
            </Paper>

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", mb: 2 }}>
                  Key Highlights
                </Typography>
                <Grid container spacing={1.5}>
                  {tour.highlights.map((highlight: string, index: number) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20, mt: 0.2 }} />
                        <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500 }}>
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
              <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", mb: 2 }}>
                  Day-by-Day Itinerary
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {tour.itinerary.map((day: any) => (
                    <Accordion
                      key={day.day}
                      defaultExpanded={day.day === 1}
                      sx={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px !important",
                        "&:before": { display: "none" },
                        boxShadow: "none",
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Chip
                            label={`Day ${day.day}`}
                            size="small"
                            sx={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, height: 22, borderRadius: "4px" }}
                          />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                            {day.title}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                        <Typography variant="body2" sx={{ color: "#475569", lineHeight: 1.6, mb: 2 }}>
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
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#10b981", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon /> What&apos;s Included
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {tour.inclusions?.map((inc: string, i: number) => (
                      <Typography key={i} variant="body2" sx={{ color: "#475569" }}>
                        • {inc}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ef4444", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <CancelIcon /> What&apos;s Not Included
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {tour.exclusions?.map((exc: string, i: number) => (
                      <Typography key={i} variant="body2" sx={{ color: "#475569" }}>
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
            <Box sx={{ position: "sticky", top: 88 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: "4px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                    Price Per Traveler
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: "#0f172a" }}>
                      ₹{tour.priceInr.toLocaleString("en-IN")}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      / person (all taxes incl.)
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
                  <TextField
                    label="Departure Date"
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                  />

                  <TextField
                    label="Number of Travelers"
                    type="number"
                    value={numberOfTravelers}
                    onChange={(e) => setNumberOfTravelers(Math.max(1, parseInt(e.target.value) || 1))}
                    slotProps={{ htmlInput: { min: 1, max: tour.maxGroupSize || 20 } }}
                    fullWidth
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                  />

                  <Box sx={{ p: 2, backgroundColor: "#f8fafc", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        ₹{tour.priceInr.toLocaleString("en-IN")} × {numberOfTravelers} Travelers
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ₹{totalPrice.toLocaleString("en-IN")}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1, borderTop: "1px solid #e2e8f0" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                        Total Amount:
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#2563eb" }}>
                        ₹{totalPrice.toLocaleString("en-IN")}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => setBookingDialogOpen(true)}
                  sx={{
                    py: 1.5,
                    backgroundColor: "#0f172a",
                    borderRadius: "4px",
                    "&:hover": { backgroundColor: "#1e293b" },
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  Book This Journey
                </Button>

                <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", textAlign: "center", mt: 1.5 }}>
                  Instant confirmation • Verified destination partner
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
        slotProps={{ paper: { sx: { borderRadius: "4px" } } }}
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
              <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>
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
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
              />

              <TextField
                label="Email Address"
                type="email"
                required
                fullWidth
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
              />

              <TextField
                label="Phone Number (WhatsApp preferred)"
                required
                fullWidth
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
              />

              <TextField
                label="Special Requests / Dietary Needs (Optional)"
                multiline
                rows={2}
                fullWidth
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
              />

              <Box sx={{ p: 2, borderRadius: "4px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                  Selected Date: <strong>{travelDate}</strong> • Travelers: <strong>{numberOfTravelers}</strong>
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  Grand Total: ₹{totalPrice.toLocaleString("en-IN")}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button onClick={() => setBookingDialogOpen(false)} sx={{ color: "#64748b", borderRadius: "4px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={bookingLoading}
              sx={{ backgroundColor: "#0f172a", borderRadius: "4px", "&:hover": { backgroundColor: "#1e293b" } }}
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
        slotProps={{ paper: { sx: { borderRadius: "4px", p: 2 } } }}
      >
        <Box sx={{ textAlign: "center", pt: 2, pb: 1 }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: "#10b981", mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
            Booking Confirmed!
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
            Your adventure has been reserved. Our local destination partner will contact you shortly.
          </Typography>

          <Paper elevation={0} sx={{ p: 2, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", mb: 3, borderRadius: "4px" }}>
            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", textTransform: "uppercase" }}>
              Booking Reference Number
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#2563eb", letterSpacing: "0.05em" }}>
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
            sx={{ backgroundColor: "#0f172a", borderRadius: "4px", "&:hover": { backgroundColor: "#1e293b" } }}
          >
            Explore More Journeys
          </Button>
        </Box>
      </Dialog>

      <Footer />
    </Box>
  );
}
