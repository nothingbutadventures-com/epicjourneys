"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  AppBar,
  Toolbar,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ContactSupportRoundedIcon from "@mui/icons-material/ContactSupportRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";

export default function HelpAndSupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject,
          category,
          message,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit inquiry. Please try again.");
      }
    } catch (e: any) {
      setError(e.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FDF9EC", pb: 8 }}>
      {/* Top Bar */}
      <Box
        component="header"
        sx={{
          height: 56,
          bgcolor: "#ffffff",
          borderBottom: "1px solid #E2E2E2",
          px: { xs: 2, sm: 4 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box component="img" src="/favicon.svg" alt="EpicJourneys" sx={{ width: 30, height: 30, flexShrink: 0 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.85rem" }}>
            EpicJourneys
          </Typography>
        </Box>

        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
          size="small"
          sx={{ color: "#64748b", borderRadius: "4px" }}
        >
          Back to Home
        </Button>
      </Box>

      <Container maxWidth="md" sx={{ mt: 5 }}>
        {/* Page Heading */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Chip
            icon={<ContactSupportRoundedIcon sx={{ fontSize: "14px !important", color: "#0f172a !important" }} />}
            label="Help & Support Desk"
            size="small"
            sx={{
              bgcolor: "#ffffff",
              border: "1px solid #E2E2E2",
              fontWeight: 600,
              fontSize: "0.75rem",
              borderRadius: "4px",
              mb: 1.5,
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", mb: 1 }}>
            How can we help your journey?
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 520, mx: "auto" }}>
            Have a question about a tour, need itinerary customization, or want to share feedback? Send us your query below.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Quick Contact Info */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "4px",
                  border: "1px solid #E2E2E2",
                  bgcolor: "#ffffff",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}>
                  Contact Information
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <EmailRoundedIcon sx={{ fontSize: 16, color: "#64748b" }} />
                  <Typography sx={{ fontSize: "0.8rem", color: "#475569" }}>
                    support@epicjourneys.in
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneRoundedIcon sx={{ fontSize: 16, color: "#64748b" }} />
                  <Typography sx={{ fontSize: "0.8rem", color: "#475569" }}>
                    +91 1800 200 9988
                  </Typography>
                </Box>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "4px",
                  border: "1px solid #E2E2E2",
                  bgcolor: "#ffffff",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
                  Fast Turnaround
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.78rem" }}>
                  Our local destination partners and support coordinators review all queries within 2 to 4 business hours.
                </Typography>
              </Paper>
            </Box>
          </Grid>

          {/* Form */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: "4px",
                border: "1px solid #E2E2E2",
                bgcolor: "#ffffff",
              }}
            >
              {submitted ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 48, color: "#10b981", mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}>
                    Query Submitted Successfully!
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 440, mx: "auto", mb: 3 }}>
                    Thank you, <b>{name}</b>. Your inquiry has been received. Our support team will reach out to you via <b>{email}</b> shortly.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSubmitted(false);
                      setSubject("");
                      setMessage("");
                    }}
                    sx={{ borderRadius: "4px", borderColor: "#E2E2E2" }}
                  >
                    Send Another Query
                  </Button>
                </Box>
              ) : (
                <form onSubmit={handleSubmit}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", mb: 2 }}>
                    Submit Your Query / Feedback
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Your Full Name"
                        required
                        fullWidth
                        size="small"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Email Address"
                        type="email"
                        required
                        fullWidth
                        size="small"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rahul@example.com"
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Phone Number (Optional)"
                        fullWidth
                        size="small"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={category}
                          label="Category"
                          onChange={(e) => setCategory(e.target.value)}
                          sx={{ borderRadius: "4px" }}
                        >
                          <MenuItem value="General Inquiry">General Inquiry</MenuItem>
                          <MenuItem value="Tour Booking">Tour Booking Assistance</MenuItem>
                          <MenuItem value="Cancellation & Refund">Cancellation & Refund</MenuItem>
                          <MenuItem value="Feedback & Review">Feedback & Review</MenuItem>
                          <MenuItem value="Partnership">Destination Partnership</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Subject"
                        required
                        fullWidth
                        size="small"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of your question or feedback..."
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Detailed Message"
                        required
                        multiline
                        rows={4}
                        fullWidth
                        size="small"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe your question or feedback in detail..."
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !name || !email || !subject || !message}
                        startIcon={loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <SendRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          bgcolor: "#43149D",
                          color: "#ffffff",
                          borderRadius: "4px",
                          px: 3,
                          py: 1,
                          fontWeight: 600,
                          "&:hover": { bgcolor: "#360F7D" },
                        }}
                      >
                        {loading ? "Submitting..." : "Send Inquiry"}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
