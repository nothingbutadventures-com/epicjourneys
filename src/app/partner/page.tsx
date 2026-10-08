"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LuggageIcon from "@mui/icons-material/Luggage";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function PartnerDashboardPage() {
  const [partner, setPartner] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  // Booking Modal State
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [numberOfTravelers, setNumberOfTravelers] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  useEffect(() => {
    // Load partner from local storage
    const userStr = localStorage.getItem("epic_partner_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setPartner(u);
      } catch {}
    }

    // Set default travel date 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setTravelDate(d.toISOString().split("T")[0]);

    fetchPartnerData();
  }, []);

  const fetchPartnerData = async () => {
    setLoading(true);
    const token = localStorage.getItem("epic_partner_token");

    try {
      // 1. Fetch bookings
      const bookingsRes = await fetch("/api/bookings", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.data || []);
      }

      // 2. Fetch tours
      const toursRes = await fetch("/api/tours?all=true");
      const toursData = await toursRes.json();
      if (toursData.success) {
        setTours(toursData.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBookingModal = (tourId?: string) => {
    if (tourId) {
      setSelectedTourId(tourId);
    } else if (tours.length > 0) {
      setSelectedTourId(tours[0]._id);
    }
    setBookingError(null);
    setBookDialogOpen(true);
  };

  const handlePartnerBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBooking(true);
    setBookingError(null);

    const token = localStorage.getItem("epic_partner_token");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tourId: selectedTourId,
          customerName,
          customerEmail,
          customerPhone,
          travelDate,
          numberOfTravelers,
          specialRequests,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmedBooking(data.data);
        setBookDialogOpen(false);
        // Reset form
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setSpecialRequests("");
        fetchPartnerData();
      } else {
        setBookingError(data.error || "Failed to create booking");
      }
    } catch (e: any) {
      setBookingError(e.message || "Network error");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const selectedTour = tours.find((t) => t._id === selectedTourId);
  const calculatedTotal = selectedTour ? selectedTour.priceInr * numberOfTravelers : 0;

  const totalPartnerBookings = bookings.length;
  const totalPartnerRevenue = bookings.reduce(
    (sum, b) => sum + (b.totalAmountInr || 0),
    0
  );

  return (
    <Box>
      {/* Welcome Banner */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3.5, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a" }}>
              Welcome, {partner?.name || "Destination Partner"}
            </Typography>
            <Chip
              label="Local Partner Panel"
              size="small"
              sx={{ backgroundColor: "#eff6ff", color: "#2563eb", fontWeight: 700 }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Book tours for customers directly from this panel and view all bookings for your location.
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => handleOpenBookingModal()}
          sx={{
            backgroundColor: "#2563eb",
            "&:hover": { backgroundColor: "#1d4ed8" },
            px: 3,
            py: 1.2,
            fontWeight: 700,
          }}
        >
          Book Tour For Customer
        </Button>
      </Box>

      {/* KPI Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                Active Location Tours
              </Typography>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                <LuggageIcon sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a" }}>
              {tours.length}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                Total Bookings Handled
              </Typography>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, backgroundColor: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                <BookOnlineIcon sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a" }}>
              {totalPartnerBookings}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                Total Booking Volume (INR)
              </Typography>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, backgroundColor: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
                <CurrencyRupeeIcon sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a" }}>
              ₹{totalPartnerRevenue.toLocaleString("en-IN")}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", mb: 4 }}>
        <Box sx={{ borderBottom: "1px solid #e2e8f0", px: 2 }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
            <Tab label={`My Bookings (${bookings.length})`} sx={{ fontWeight: 600 }} />
            <Tab label={`Available Destination Tours (${tours.length})`} sx={{ fontWeight: 600 }} />
          </Tabs>
        </Box>

        {/* Tab 0: Bookings List */}
        {tabIndex === 0 && (
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={30} />
              </Box>
            ) : bookings.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <BookOnlineIcon sx={{ fontSize: 44, color: "#cbd5e1", mb: 1 }} />
                <Typography variant="h6" sx={{ color: "#475569", fontWeight: 600 }}>
                  No Bookings Yet
                </Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
                  You haven&apos;t booked any customer tours yet. Use the button above to book your first client.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenBookingModal()}
                  sx={{ borderColor: "#2563eb", color: "#2563eb" }}
                >
                  Book Tour For Customer
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Booking Ref #</TableCell>
                      <TableCell>Customer Name</TableCell>
                      <TableCell>Contact Phone</TableCell>
                      <TableCell>Tour Name</TableCell>
                      <TableCell>Travel Date</TableCell>
                      <TableCell>Travelers</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b._id} hover>
                        <TableCell sx={{ fontWeight: 700, color: "#2563eb" }}>
                          {b.bookingRef}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{b.customerName}</TableCell>
                        <TableCell sx={{ color: "#64748b" }}>{b.customerPhone}</TableCell>
                        <TableCell>{b.tourTitle || b.tourId?.title}</TableCell>
                        <TableCell>
                          {new Date(b.travelDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>{b.numberOfTravelers}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          ₹{b.totalAmountInr?.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={b.status}
                            size="small"
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              backgroundColor:
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
          </Box>
        )}

        {/* Tab 1: Available Tours */}
        {tabIndex === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {tours.map((t) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t._id}>
                  <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardMedia
                      component="img"
                      height="150"
                      image={
                        t.coverImage ||
                        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600"
                      }
                      alt={t.title}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.8 }}>
                        <LocationOnIcon sx={{ fontSize: 16, color: "#2563eb" }} />
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                          {t.startingPoint}, {t.state}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}>
                        {t.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b", mb: 2, fontSize: "0.8rem" }}>
                        {t.durationDays} Days / {t.durationNights} Nights • Max {t.maxGroupSize} pax
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: "1px solid #f1f5f9" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          ₹{t.priceInr.toLocaleString("en-IN")}
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenBookingModal(t._id)}
                          sx={{ backgroundColor: "#0f172a", fontSize: "0.75rem" }}
                        >
                          Book Client
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Book Tour For Customer Modal */}
      <Dialog
        open={bookDialogOpen}
        onClose={() => setBookDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <form onSubmit={handlePartnerBookingSubmit}>
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
            Book Tour For Customer
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 2.5 }}>
              Register and confirm a passenger booking directly through your partner credentials.
            </Typography>

            {bookingError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {bookingError}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Tour</InputLabel>
                <Select
                  value={selectedTourId}
                  label="Select Tour"
                  onChange={(e) => setSelectedTourId(e.target.value)}
                  required
                >
                  {tours.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.title} (₹{t.priceInr} / person)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Customer Full Name"
                required
                fullWidth
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <TextField
                label="Customer Phone (WhatsApp preferred)"
                required
                fullWidth
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />

              <TextField
                label="Customer Email Address"
                type="email"
                required
                fullWidth
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Travel Departure Date"
                    type="date"
                    required
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Number of Travelers"
                    type="number"
                    required
                    fullWidth
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={numberOfTravelers}
                    onChange={(e) => setNumberOfTravelers(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Special Requests / Hotel Notes (Optional)"
                multiline
                rows={2}
                fullWidth
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />

              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Price: ₹{selectedTour?.priceInr || 0} × {numberOfTravelers} Travelers
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{calculatedTotal.toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1, borderTop: "1px solid #e2e8f0" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                    Total to Collect:
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#2563eb" }}>
                    ₹{calculatedTotal.toLocaleString("en-IN")}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button onClick={() => setBookDialogOpen(false)} sx={{ color: "#64748b" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submittingBooking}
              sx={{ backgroundColor: "#2563eb", "&:hover": { backgroundColor: "#1d4ed8" } }}
            >
              {submittingBooking ? "Confirming..." : "Confirm & Book Customer"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={Boolean(confirmedBooking)}
        onClose={() => setConfirmedBooking(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 2 } } }}
      >
        <Box sx={{ textAlign: "center", pt: 2, pb: 1 }}>
          <CheckCircleIcon sx={{ fontSize: 56, color: "#10b981", mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
            Client Booked!
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
            Booking has been registered in the system under your partner account.
          </Typography>

          <Paper elevation={0} sx={{ p: 2, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", mb: 3 }}>
            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", textTransform: "uppercase" }}>
              Booking Reference Number
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#2563eb" }}>
              {confirmedBooking?.bookingRef}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" sx={{ color: "#334155" }}>
              Customer: <strong>{confirmedBooking?.customerName}</strong> ({confirmedBooking?.customerPhone})
            </Typography>
            <Typography variant="body2" sx={{ color: "#334155" }}>
              Total: <strong>₹{confirmedBooking?.totalAmountInr?.toLocaleString("en-IN")}</strong>
            </Typography>
          </Paper>

          <Button
            fullWidth
            variant="contained"
            onClick={() => setConfirmedBooking(null)}
            sx={{ backgroundColor: "#0f172a" }}
          >
            Done
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
