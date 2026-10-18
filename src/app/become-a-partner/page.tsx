"use client";

import React, { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { INDIAN_STATES } from "@/lib/constants";

interface City {
  id: string;
  name: string;
  state: string;
  hasPartner: boolean;
}

const initial = {
  name: "",
  email: "",
  phone: "",
  secondaryPhone: "",
  companyName: "",
  state: "",
  address: "",
  experience: "",
  message: "",
  website: "", // honeypot
};

const steps = [
  { n: 1, title: "Send your request", text: "Tell us who you are and which city you want to look after." },
  { n: 2, title: "We review it", text: "Our team checks your details and may call you to talk through the role." },
  { n: 3, title: "Get your partner login", text: "If approved, we create your partner account for that location." },
];

export default function BecomePartnerPage() {
  const [form, setForm] = useState(initial);
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState<City | null>(null);
  const [cityText, setCityText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/destinations")
      .then((r) => r.json())
      .then((d) => d.success && setCities((d.data || []).map((x: any) => ({ id: x._id, name: x.name, state: x.state, hasPartner: Boolean(x.hasPartner) })).filter((c: City) => !c.hasPartner)))
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cityName = (city?.name || cityText).trim();
    const state = city?.state || form.state;
    if (!cityName) return setError("Enter the city you want to partner for.");
    if (!state) return setError("Select the state of that city.");
    setLoading(true);
    try {
      const res = await fetch("/api/partner-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, city: cityName, state, destinationId: city?.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't send your request");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#ffffff" }}>
      <Navbar />

      <Box sx={{ bgcolor: "#fff8dc", borderBottom: "1px solid #fde68a" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          <Typography component="h1" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Become our partner in{" "}
            <Box component="span" sx={{ bgcolor: "#facc15", px: 1 }}>your city</Box>
          </Typography>
          <Typography sx={{ mt: 2, color: "#475569", fontSize: "1.05rem", maxWidth: 620, lineHeight: 1.6 }}>
            EpicJourneys works with local partners who welcome travellers at the starting point and support them through the trip.
            Tell us about yourself and the location you&apos;d like to look after.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, flexGrow: 1 }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            {done ? (
              <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, textAlign: "center", border: "1px solid #e5e7eb" }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 56, color: "#16a34a" }} />
                <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", mt: 1 }}>Request received</Typography>
                <Typography sx={{ color: "#64748b", mt: 1, maxWidth: 420, mx: "auto" }}>
                  Thanks, {form.name.split(" ")[0]}. Our team will review your request and contact you on {form.phone} or {form.email}.
                </Typography>
                <Button
                  sx={{ mt: 3, color: "#0f172a", borderColor: "#0f172a" }}
                  variant="outlined"
                  onClick={() => {
                    setForm(initial);
                    setCity(null);
                    setCityText("");
                    setDone(false);
                  }}
                >
                  Submit another request
                </Button>
              </Paper>
            ) : (
              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: "1px solid #e5e7eb" }}>
                <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.4rem", mb: 0.5 }}>Request a location</Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.9rem", mb: 3 }}>Fields marked * are required.</Typography>
                <form onSubmit={submit}>
                  {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
                  {/* Honeypot: hidden from people, filled by bots */}
                  <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} style={{ position: "absolute", left: "-9999px", opacity: 0 }} aria-hidden="true" />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label="Full name" required fullWidth value={form.name} onChange={set("name")} autoComplete="name" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label="Company / agency (optional)" fullWidth value={form.companyName} onChange={set("companyName")} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label="Email address" type="email" required fullWidth value={form.email} onChange={set("email")} autoComplete="email" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Mobile number"
                        type="tel"
                        required
                        fullWidth
                        value={form.phone}
                        onChange={set("phone")}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> }, htmlInput: { inputMode: "numeric", maxLength: 12 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Secondary mobile (optional)"
                        type="tel"
                        fullWidth
                        value={form.secondaryPhone}
                        onChange={set("secondaryPhone")}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> }, htmlInput: { inputMode: "numeric", maxLength: 12 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Autocomplete
                        freeSolo
                        options={cities}
                        getOptionLabel={(o) => (typeof o === "string" ? o : `${o.name}, ${o.state}`)}
                        value={city}
                        inputValue={cityText}
                        onInputChange={(_, v) => {
                          setCityText(v);
                          if (city && v !== `${city.name}, ${city.state}`) setCity(null);
                        }}
                        onChange={(_, v) => {
                          if (v && typeof v !== "string") {
                            setCity(v);
                            setForm((f) => ({ ...f, state: v.state }));
                          }
                        }}
                        renderInput={(p) => <TextField {...p} label="City you want to partner for" required helperText="Locations that already have a partner aren't listed. You can also type a new city." />}
                      />
                    </Grid>
                    {!city && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField select label="State" required fullWidth value={form.state} onChange={set("state")}>
                          {INDIAN_STATES.map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    )}
                    <Grid size={{ xs: 12 }}>
                      <TextField label="Your address (optional)" fullWidth multiline minRows={2} value={form.address} onChange={set("address")} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField label="Relevant experience (optional)" fullWidth multiline minRows={2} value={form.experience} onChange={set("experience")} placeholder="Years in travel, transport, hospitality, local guiding…" />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField label="Anything else? (optional)" fullWidth multiline minRows={2} value={form.message} onChange={set("message")} />
                    </Grid>
                  </Grid>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />}
                    sx={{ mt: 3, px: 4, py: 1.2, bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#eab308" } }}
                  >
                    Send request
                  </Button>
                </form>
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.4rem", mb: 2.5 }}>How it works</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {steps.map((s) => (
                <Box key={s.n} sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {s.n}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{s.title}</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.6 }}>{s.text}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: 4, p: 2.5, bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px" }}>
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>What partners do</Typography>
              <Typography sx={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.65 }}>
                Receive travellers at the starting address, be the local contact on departure days, and manage bookings for your city from the partner portal.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
}
