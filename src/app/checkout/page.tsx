"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import KingBedRoundedIcon from "@mui/icons-material/KingBedRounded";
import BedroomParentRoundedIcon from "@mui/icons-material/BedroomParentRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentGateway, { type PaymentDescriptor } from "@/components/checkout/PaymentGateway";
import { CompassRose, MountainScene } from "@/components/home/Illustrations";
import { rise, stagger } from "@/components/home/HomeSections";
import { computeQuote, inr, type RoomType } from "@/lib/pricing";
import { availableEmiMonths, buildSchedule, EMI_DOWN_PCT } from "@/lib/emi";
import { withRedirect } from "@/lib/redirect";

type Step = "travellers" | "rooms" | "payment";
const STEPS: { key: Step; label: string; hint: string; icon: React.ReactNode }[] = [
  { key: "travellers", label: "Travellers", hint: "Who's going", icon: <GroupsRoundedIcon /> },
  { key: "rooms", label: "Rooms", hint: "Where you'll stay", icon: <KingBedRoundedIcon /> },
  { key: "payment", label: "Payment", hint: "Lock it in", icon: <PaymentsRoundedIcon /> },
];

interface Person {
  firstName: string;
  lastName: string;
  phone: string;
  age: string;
}
const blank = (): Person => ({ firstName: "", lastName: "", phone: "", age: "" });
const cleanPhone = (v: string) => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
const personValid = (p: Person) =>
  p.firstName.trim().length > 0 &&
  p.lastName.trim().length > 0 &&
  /^[6-9]\d{9}$/.test(cleanPhone(p.phone)) &&
  Number(p.age) >= 1 &&
  Number(p.age) <= 100;

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function CheckoutInner() {
  const router = useRouter();
  const sp = useSearchParams();

  // ---- URL is the source of truth for the booking state ----
  const tourKey = sp.get("tour") || "";
  const departureId = sp.get("departure") || "";
  const fromCityId = sp.get("from") || "";
  const n = Math.min(20, Math.max(1, parseInt(sp.get("travellers") || "1", 10) || 1));
  const stepParam = sp.get("step");
  const step: Step = stepParam === "rooms" || stepParam === "payment" ? stepParam : "travellers";
  const pay: "full" | "emi" = sp.get("pay") === "emi" ? "emi" : "full";
  const emiParam = parseInt(sp.get("emi") || "0", 10) || 0;
  const roomsParam = sp.get("rooms");

  const updateParams = useCallback(
    (patch: Record<string, string | null>, mode: "push" | "replace" = "replace") => {
      const q = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(patch)) (v === null ? q.delete(k) : q.set(k, v));
      const url = `/checkout?${q.toString()}`;
      mode === "push" ? router.push(url, { scroll: true }) : router.replace(url, { scroll: false });
    },
    [router]
  );

  // ---- Remote data ----
  const [user, setUser] = useState<{ name: string; email: string; phone?: string } | null | undefined>(undefined);
  const [tour, setTour] = useState<any>(null);
  const [tourError, setTourError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.authenticated ? d.user : null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!tourKey) return;
    fetch(`/api/tours/${tourKey}`)
      .then((r) => r.json())
      .then((d) => (d.success ? setTour(d.data) : setTourError(d.error || "Tour not found")))
      .catch(() => setTourError("Couldn't load this tour"));
  }, [tourKey]);

  const departure = useMemo(() => (tour?.departures || []).find((d: any) => d._id === departureId) || null, [tour, departureId]);
  const maxTravellers = departure ? Math.min(20, departure.available) : 20;
  const singleOffered = (tour?.singleRoomPriceInr || 0) > 0;

  // ---- Traveller details (kept in sessionStorage so they survive login/register redirects) ----
  const storeKey = `ej_checkout_${tourKey}_${departureId}`;
  const [people, setPeople] = useState<Person[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let saved: Person[] = [];
    try {
      saved = JSON.parse(sessionStorage.getItem(storeKey) || "[]");
    } catch {}
    setPeople(Array.from({ length: n }, (_, i) => saved[i] || blank()));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey]);

  // Keep the list length in sync with the traveller count in the URL.
  useEffect(() => {
    if (!hydrated) return;
    setPeople((prev) => (prev.length === n ? prev : Array.from({ length: n }, (_, i) => prev[i] || blank())));
  }, [n, hydrated]);

  // Prefill the primary traveller from the signed-in account.
  useEffect(() => {
    if (!hydrated || !user || people.length === 0) return;
    setPeople((prev) => {
      const p = prev[0];
      if (!p || p.firstName || p.lastName) return prev;
      const [first, ...rest] = user.name.trim().split(/\s+/);
      const next = [...prev];
      next[0] = { ...p, firstName: first || "", lastName: rest.join(" "), phone: p.phone || cleanPhone(user.phone || "") };
      return next;
    });
  }, [hydrated, user, people.length]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(storeKey, JSON.stringify(people));
    } catch {}
  }, [people, hydrated, storeKey]);

  const setPerson = (i: number, patch: Partial<Person>) =>
    setPeople((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const allValid = people.length === n && people.every(personValid);

  // ---- Rooms ----
  const rooms: RoomType[] = useMemo(() => {
    const parts = (roomsParam || "").split(",");
    return Array.from({ length: n }, (_, i) => (singleOffered && parts[i] === "single" ? "single" : "shared"));
  }, [roomsParam, n, singleOffered]);
  const setRooms = (next: RoomType[]) => updateParams({ rooms: next.join(",") });

  // ---- Pricing & EMI ----
  const quote = useMemo(
    () =>
      departure
        ? computeQuote({
            price: departure.price,
            discountPercentage: departure.discountPercentage,
            singleRoomPrice: tour?.singleRoomPriceInr || 0,
            rooms,
          })
        : null,
    [departure, tour, rooms]
  );
  const emiMonthsOptions = useMemo(() => (departure ? availableEmiMonths(departure.startDate) : []), [departure]);
  const emiMonths = emiMonthsOptions.includes(emiParam) ? emiParam : emiMonthsOptions[0] || 0;
  const schedule = useMemo(
    () => (quote ? buildSchedule(quote.total, pay === "emi" && emiMonths ? "emi" : "full", emiMonths) : []),
    [quote, pay, emiMonths]
  );
  const payableNow = schedule[0]?.amountInr || 0;

  // Step guard: later steps need valid traveller details.
  useEffect(() => {
    if (hydrated && user && tour && step !== "travellers" && !allValid) updateParams({ step: "travellers" });
  }, [hydrated, user, tour, step, allValid, updateParams]);

  // ---- Submit ----
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentDescriptor | null>(null);
  const [pendingRef, setPendingRef] = useState<string | null>(null);

  const startPayment = async () => {
    if (!tour || !departure) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tour: tour.slug || tour._id,
          departureId: departure._id,
          strategy: pay === "emi" && emiMonths ? "emi" : "full",
          emiMonths,
          travellers: people.map((p, i) => ({ ...p, phone: cleanPhone(p.phone), roomType: rooms[i] })),
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setUser(null);
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't start the payment");
      setPendingRef(data.bookingRef);
      setPayment(data.payment);
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onPaid = useCallback(
    (ref: string) => {
      try {
        sessionStorage.removeItem(storeKey);
      } catch {}
      router.push(`/booking/${ref}?status=success`);
    },
    [router, storeKey]
  );

  // ---- Render helpers ----
  const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout";
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const shell = (children: React.ReactNode) => (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f8fafc" }}>
      <Navbar />
      {children}
      <Footer />
    </Box>
  );

  if (!tourKey || !departureId) {
    return shell(
      <Container maxWidth="sm" sx={{ py: 10, flexGrow: 1 }}>
        <Alert severity="info" sx={{ mb: 3 }}>Pick a tour and a date first, then continue to booking.</Alert>
        <Button component={Link} href="/tours" variant="contained" startIcon={<ArrowBackRoundedIcon />}>Browse tours</Button>
      </Container>
    );
  }

  if (tourError || (tour && !departure)) {
    return shell(
      <Container maxWidth="sm" sx={{ py: 10, flexGrow: 1 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{tourError || "That date is no longer available for this tour."}</Alert>
        <Button component={Link} href={tour ? `/tours/${tour.slug}` : "/tours"} variant="contained" startIcon={<ArrowBackRoundedIcon />}>
          Choose another date
        </Button>
      </Container>
    );
  }

  if (user === undefined || !tour || !hydrated) {
    return shell(
      <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: "#0f172a" }} />
      </Box>
    );
  }

  // ---- Login / register gate ----
  if (user === null) {
    return shell(
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 }, flexGrow: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Paper elevation={0} sx={{ position: "relative", overflow: "hidden", borderTop: "4px solid #facc15", textAlign: "center", pt: { xs: 4, md: 6 }, px: { xs: 2.5, md: 6 } }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ display: "inline-block" }}>
              <CompassRose size={88} />
            </motion.div>
            <Typography sx={{ mt: 2, fontSize: { xs: "1.6rem", md: "2.1rem" }, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Log in to book <Box component="span" sx={{ color: "#ca8a04" }}>{tour.title}</Box>
            </Typography>
            <Typography sx={{ color: "#64748b", mt: 1, maxWidth: 480, mx: "auto" }}>
              Your date, city and {n} traveller{n > 1 ? "s" : ""} are saved — you&apos;ll land right back here after you sign in.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap", mt: 3, mb: 4 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Button component={Link} href={withRedirect("/login", currentUrl)} variant="contained" startIcon={<LoginRoundedIcon />}
                  sx={{ px: 4, py: 1.2, bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#eab308" } }}>
                  Login
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Button component={Link} href={withRedirect("/register", currentUrl)} variant="outlined" startIcon={<RocketLaunchRoundedIcon />}
                  sx={{ px: 4, py: 1.2, fontWeight: 800, color: "#0f172a", borderColor: "#0f172a" }}>
                  Register
                </Button>
              </motion.div>
            </Box>
            <Box sx={{ mx: { xs: -2.5, md: -6 }, lineHeight: 0 }}>
              <MountainScene height={150} />
            </Box>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  // ---- Main checkout ----
  const fieldSx = { "& .MuiOutlinedInput-root": { bgcolor: "#fff" } };
  const cityName = departure.cityName;
  const stepBack = () => updateParams({ step: STEPS[Math.max(0, stepIndex - 1)].key }, "push");

  const stepper = (
    <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2.5 }, mb: 3, position: "relative", overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {STEPS.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <React.Fragment key={s.key}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
                <motion.div
                  animate={{ scale: active ? 1.1 : 1 }}
                  style={{
                    width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? "#10b981" : active ? "#facc15" : "#f1f5f9",
                    color: done ? "#fff" : active ? "#0f172a" : "#94a3b8",
                    boxShadow: active ? "0 10px 22px -8px rgba(250,204,21,0.8)" : "none",
                  }}
                >
                  {done ? <CheckRoundedIcon /> : s.icon}
                </motion.div>
                <Box sx={{ display: { xs: active ? "block" : "none", sm: "block" } }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Step {i + 1}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: active || done ? "#0f172a" : "#94a3b8", lineHeight: 1.1 }}>{s.label}</Typography>
                </Box>
              </Box>
              {i < STEPS.length - 1 && (
                <Box sx={{ flex: 1, mx: { xs: 1, md: 2 }, height: 4, borderRadius: 2, bgcolor: "#e2e8f0", overflow: "hidden" }}>
                  <motion.div initial={false} animate={{ width: i < stepIndex ? "100%" : "0%" }} transition={{ duration: 0.5 }} style={{ height: "100%", background: "#10b981" }} />
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </Box>
    </Paper>
  );

  const stepTitle = (icon: React.ReactNode, title: string, sub: string) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: "8px", bgcolor: "#facc15", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", letterSpacing: "-0.015em", lineHeight: 1.15 }}>{title}</Typography>
        <Typography sx={{ color: "#64748b", fontSize: "0.88rem" }}>{sub}</Typography>
      </Box>
    </Box>
  );

  const travellersStep = (
    <>
      {stepTitle(<GroupsRoundedIcon />, "Traveller details", "Enter details exactly as on each traveller's ID.")}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, mb: 2.5, borderRadius: "6px", bgcolor: "#fefce8", border: "1px solid #fef08a" }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Number of travellers</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button size="small" variant="outlined" disabled={n <= 1} onClick={() => updateParams({ travellers: String(n - 1), rooms: null })} sx={{ minWidth: 36, px: 0 }}><RemoveRoundedIcon fontSize="small" /></Button>
          <Typography sx={{ fontWeight: 800, minWidth: 24, textAlign: "center" }}>{n}</Typography>
          <Button size="small" variant="outlined" disabled={n >= maxTravellers} onClick={() => updateParams({ travellers: String(n + 1), rooms: null })} sx={{ minWidth: 36, px: 0 }}><AddRoundedIcon fontSize="small" /></Button>
        </Box>
      </Box>
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {people.map((p, i) => {
          const valid = personValid(p);
          return (
            <motion.div key={i} variants={rise}>
              <Box sx={{ p: 2.5, borderRadius: "6px", border: "1px solid", borderColor: valid ? "#bbf7d0" : "#e2e8f0", bgcolor: valid ? "#f7fef9" : "#fff", transition: "all .25s" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: i === 0 ? "#facc15" : "#e0f2fe", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {valid ? <CheckRoundedIcon fontSize="small" /> : <PersonRoundedIcon fontSize="small" />}
                  </Box>
                  <Typography sx={{ fontWeight: 800 }}>Traveller {i + 1}</Typography>
                  {i === 0 && <Chip label="Primary" size="small" sx={{ bgcolor: "#0f172a", color: "#facc15", fontWeight: 700 }} />}
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <TextField label="First name" value={p.firstName} onChange={(e) => setPerson(i, { firstName: e.target.value })} sx={fieldSx} required />
                  <TextField label="Last name" value={p.lastName} onChange={(e) => setPerson(i, { lastName: e.target.value })} sx={fieldSx} required />
                  <TextField
                    label="Mobile number"
                    type="tel"
                    value={p.phone}
                    onChange={(e) => setPerson(i, { phone: e.target.value })}
                    error={Boolean(p.phone) && !/^[6-9]\d{9}$/.test(cleanPhone(p.phone))}
                    helperText={p.phone && !/^[6-9]\d{9}$/.test(cleanPhone(p.phone)) ? "Enter a valid 10-digit mobile number" : " "}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> }, htmlInput: { inputMode: "numeric", maxLength: 12 } }}
                    sx={fieldSx}
                    required
                  />
                  <TextField
                    label="Age"
                    type="number"
                    value={p.age}
                    onChange={(e) => setPerson(i, { age: e.target.value })}
                    error={p.age !== "" && !(Number(p.age) >= 1 && Number(p.age) <= 100)}
                    helperText={p.age !== "" && !(Number(p.age) >= 1 && Number(p.age) <= 100) ? "Age must be between 1 and 100" : " "}
                    slotProps={{ htmlInput: { min: 1, max: 100 } }}
                    sx={fieldSx}
                    required
                  />
                  {i === 0 && (
                    <TextField
                      label="Email (from your account)"
                      value={user.email}
                      disabled
                      sx={{ ...fieldSx, gridColumn: { sm: "1 / -1" } }}
                      slotProps={{ input: { endAdornment: <VerifiedRoundedIcon sx={{ color: "#10b981" }} /> } }}
                    />
                  )}
                </Box>
              </Box>
            </motion.div>
          );
        })}
      </motion.div>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, gap: 2, flexWrap: "wrap" }}>
        <Button component={Link} href={`/tours/${tour.slug}?from=${fromCityId || departure.cityId}`} startIcon={<ArrowBackRoundedIcon />} sx={{ color: "#475569" }}>
          Back to tour
        </Button>
        <Button
          variant="contained"
          size="large"
          disabled={!allValid}
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={() => updateParams({ step: "rooms" }, "push")}
          sx={{ px: 4, py: 1.2, bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#eab308" }, "&.Mui-disabled": { bgcolor: "#f1f5f9", color: "#94a3b8" } }}
        >
          Continue to rooms
        </Button>
      </Box>
      {!allValid && (
        <Typography sx={{ mt: 1.5, textAlign: "right", color: "#94a3b8", fontSize: "0.8rem" }}>
          Fill in every traveller&apos;s details to continue.
        </Typography>
      )}
    </>
  );

  const roomsStep = (
    <>
      {stepTitle(<KingBedRoundedIcon />, "Choose rooms", "Shared rooms are included in your tour price.")}
      {!singleOffered && (
        <Alert severity="info" sx={{ mb: 2.5 }}>Single rooms aren&apos;t offered on this tour — everyone stays in shared rooms (included in the price).</Alert>
      )}
      {singleOffered && (
        <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap" }}>
          <Button size="small" variant="outlined" onClick={() => setRooms(rooms.map(() => "shared"))}>All shared</Button>
          <Button size="small" variant="outlined" onClick={() => setRooms(rooms.map(() => "single"))}>All single (+{inr(tour.singleRoomPriceInr * n)})</Button>
        </Box>
      )}
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {people.map((p, i) => (
          <motion.div key={i} variants={rise}>
            <Box sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 160 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: "50%", bgcolor: i === 0 ? "#facc15" : "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                  {(p.firstName[0] || "?").toUpperCase()}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>{p.firstName} {p.lastName}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>Traveller {i + 1}{i === 0 ? " · Primary" : ""}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1.25, flex: 1, minWidth: 280, maxWidth: 440 }}>
                {([
                  { type: "shared" as RoomType, title: "Shared room", sub: "Included", icon: <BedroomParentRoundedIcon /> },
                  { type: "single" as RoomType, title: "Single room", sub: singleOffered ? `+${inr(tour.singleRoomPriceInr)}` : "Not offered", icon: <KingBedRoundedIcon /> },
                ]).map((opt) => {
                  const selected = rooms[i] === opt.type;
                  const disabled = opt.type === "single" && !singleOffered;
                  return (
                    <motion.div key={opt.type} whileHover={disabled ? undefined : { y: -3 }} whileTap={disabled ? undefined : { scale: 0.97 }} style={{ flex: 1 }}>
                      <Box
                        role="radio"
                        aria-checked={selected}
                        tabIndex={disabled ? -1 : 0}
                        onClick={() => !disabled && setRooms(rooms.map((r, j) => (j === i ? opt.type : r)))}
                        onKeyDown={(e) => !disabled && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setRooms(rooms.map((r, j) => (j === i ? opt.type : r))))}
                        sx={{
                          p: 1.5, height: "100%", borderRadius: "6px", border: "2px solid", textAlign: "center", position: "relative", outline: "none",
                          borderColor: selected ? "#0f172a" : "#e2e8f0", bgcolor: selected ? "#fefce8" : disabled ? "#f8fafc" : "#fff",
                          opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s",
                        }}
                      >
                        {selected && (
                          <Box sx={{ position: "absolute", top: -9, right: -9, width: 20, height: 20, borderRadius: "50%", bgcolor: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CheckRoundedIcon sx={{ fontSize: 14 }} />
                          </Box>
                        )}
                        <Box sx={{ color: selected ? "#ca8a04" : "#94a3b8" }}>{opt.icon}</Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{opt.title}</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: opt.type === "single" && singleOffered ? "#b45309" : "#059669", fontWeight: 700 }}>{opt.sub}</Typography>
                      </Box>
                    </motion.div>
                  );
                })}
              </Box>
            </Box>
          </motion.div>
        ))}
      </motion.div>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={stepBack} sx={{ color: "#475569" }}>Back</Button>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={() => updateParams({ step: "payment" }, "push")}
          sx={{ px: 4, py: 1.2, bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#eab308" } }}
        >
          Continue to payment
        </Button>
      </Box>
    </>
  );

  const payOption = (
    key: "full" | "emi",
    title: string,
    badge: string,
    desc: string,
    icon: React.ReactNode,
    disabled?: boolean,
    disabledReason?: string
  ) => {
    const selected = pay === key && !disabled;
    return (
      <motion.div whileHover={disabled ? undefined : { y: -4 }} whileTap={disabled ? undefined : { scale: 0.99 }}>
        <Box
          role="radio"
          aria-checked={selected}
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && updateParams({ pay: key, emi: key === "emi" ? String(emiMonths) : null })}
          onKeyDown={(e) => !disabled && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), updateParams({ pay: key, emi: key === "emi" ? String(emiMonths) : null }))}
          sx={{
            position: "relative", overflow: "hidden", p: 2.5, borderRadius: "6px", border: "2px solid", outline: "none", height: "100%",
            borderColor: selected ? "#0f172a" : "#e2e8f0", bgcolor: selected ? "#fefce8" : disabled ? "#f8fafc" : "#fff",
            opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s",
          }}
        >
          <Box sx={{ position: "absolute", right: -24, top: -24, width: 90, height: 90, borderRadius: "50%", bgcolor: key === "full" ? "#34d399" : "#38bdf8", opacity: 0.18 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, position: "relative" }}>
            <Box sx={{ width: 46, height: 46, borderRadius: "8px", bgcolor: key === "full" ? "#34d399" : "#38bdf8", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>{title}</Typography>
              <Chip label={badge} size="small" sx={{ bgcolor: "#0f172a", color: "#facc15", fontWeight: 700, height: 20 }} />
            </Box>
            {selected && <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckRoundedIcon sx={{ fontSize: 18 }} /></Box>}
          </Box>
          <Typography sx={{ color: "#475569", fontSize: "0.86rem", lineHeight: 1.6, position: "relative" }}>{disabled ? disabledReason : desc}</Typography>
        </Box>
      </motion.div>
    );
  };

  const paymentStep = (
    <>
      {stepTitle(<PaymentsRoundedIcon />, "Choose how to pay", "Secure payments powered by Razorpay.")}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
        {payOption("full", "Complete payment", "Pay once", `Pay the full ${inr(quote!.total)} now and your seats are confirmed instantly.`, <BoltRoundedIcon />)}
        {payOption(
          "emi",
          "Pay in EMI",
          "No-cost EMI",
          `Pay ${EMI_DOWN_PCT}% now to confirm, then equal monthly instalments — no extra charges.`,
          <AccountBalanceWalletRoundedIcon />,
          emiMonthsOptions.length === 0,
          "EMI isn't available for this date — the journey starts too soon to finish instalments at least 14 days before departure."
        )}
      </Box>

      {pay === "emi" && emiMonthsOptions.length > 0 && (
        <Box sx={{ mb: 3, p: 2.5, borderRadius: "6px", border: "1px solid #bae6fd", bgcolor: "#f0f9ff" }}>
          <Typography sx={{ fontWeight: 800, mb: 1.25 }}>Pick your plan</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {emiMonthsOptions.map((m) => (
              <Chip
                key={m}
                label={`${m} monthly EMIs`}
                onClick={() => updateParams({ emi: String(m) })}
                sx={{ fontWeight: 700, bgcolor: emiMonths === m ? "#0f172a" : "#fff", color: emiMonths === m ? "#facc15" : "#334155", border: "1px solid", borderColor: emiMonths === m ? "#0f172a" : "#cbd5e1", cursor: "pointer" }}
              />
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ mb: 3, borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden", bgcolor: "#fff" }}>
        <Box sx={{ px: 2, py: 1.25, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: "#ca8a04" }} />
          <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>Payment schedule</Typography>
        </Box>
        {schedule.map((s, i) => (
          <Box key={s.index} sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: i < schedule.length - 1 ? "1px dashed #e2e8f0" : "none", bgcolor: i === 0 ? "#fefce8" : "#fff" }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{s.label}</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>{i === 0 ? "Due today" : `Due ${fmtDate(s.dueDate.toISOString())}`}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 800 }}>{inr(s.amountInr)}</Typography>
          </Box>
        ))}
      </Box>

      {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
      {pendingRef && !payment && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Payment wasn&apos;t completed. Your seats are held for a short while —{" "}
          <Link href={`/booking/${pendingRef}`} style={{ fontWeight: 700, textDecoration: "underline" }}>resume payment</Link>.
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={stepBack} sx={{ color: "#475569" }}>Back</Button>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="contained"
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LockRoundedIcon />}
            onClick={startPayment}
            sx={{ px: 4, py: 1.3, bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, fontSize: "1rem", boxShadow: "0 12px 26px -10px rgba(250,204,21,0.8)", "&:hover": { bgcolor: "#eab308" } }}
          >
            Pay {inr(payableNow)} now
          </Button>
        </motion.div>
      </Box>
    </>
  );

  const summary = (
    <Paper elevation={0} sx={{ position: "relative", overflow: "hidden", borderTop: "4px solid #facc15" }}>
      <Box sx={{ position: "relative", height: 130 }}>
        <Box component="img" src={tour.coverImage} alt={tour.title} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,13,26,0.85), transparent 70%)" }} />
        <Typography sx={{ position: "absolute", left: 14, right: 14, bottom: 10, color: "#fff", fontWeight: 800, lineHeight: 1.25 }}>{tour.title}</Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>
        {[
          { icon: <EventRoundedIcon />, text: `${fmtDate(departure.startDate)} – ${fmtDate(departure.endDate)}` },
          { icon: <LocationOnIcon />, text: `Starts & ends in ${cityName}` },
          { icon: <GroupsRoundedIcon />, text: `${n} traveller${n > 1 ? "s" : ""}` },
        ].map((r, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.25, color: "#334155" }}>
            <Box sx={{ color: "#ca8a04", display: "flex" }}>{React.cloneElement(r.icon as React.ReactElement<any>, { sx: { fontSize: 19 } })}</Box>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{r.text}</Typography>
          </Box>
        ))}
        <Box sx={{ my: 2, borderTop: "1px dashed #e2e8f0" }} />
        <AnimatePresence initial={false}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75, fontSize: "0.88rem", color: "#475569" }}>
            <span>{inr(quote!.unitPrice)} × {n}</span>
            <strong>{inr(quote!.baseTotal)}</strong>
          </Box>
          {quote!.singleCount > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75, fontSize: "0.88rem", color: "#475569" }}>
                <span>Single room × {quote!.singleCount}</span>
                <strong>+{inr(quote!.roomSupplement)}</strong>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
        <Box sx={{ mt: 1.5, p: 1.75, borderRadius: "6px", bgcolor: "#0f172a", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontWeight: 700 }}>Total</Typography>
          <motion.span key={quote!.total} initial={{ scale: 1.2, color: "#fff" }} animate={{ scale: 1, color: "#facc15" }} style={{ fontSize: "1.4rem", fontWeight: 800 }}>
            {inr(quote!.total)}
          </motion.span>
        </Box>
        {step === "payment" && pay === "emi" && emiMonths > 0 && (
          <Typography sx={{ mt: 1, fontSize: "0.78rem", color: "#64748b", textAlign: "center" }}>
            Pay {inr(payableNow)} today, rest in {emiMonths} monthly instalments.
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 2, justifyContent: "center" }}>
          <Chip icon={<LockRoundedIcon sx={{ fontSize: "14px !important" }} />} label="Secure payment" size="small" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700 }} />
          <Chip icon={<VerifiedRoundedIcon sx={{ fontSize: "14px !important" }} />} label="Verified partner" size="small" sx={{ bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 700 }} />
        </Box>
      </Box>
    </Paper>
  );

  return shell(
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, flexGrow: 1 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography sx={{ fontSize: { xs: "1.6rem", md: "2.1rem" }, fontWeight: 800, letterSpacing: "-0.02em", mb: 2.5 }}>
          Complete your <Box component="span" sx={{ color: "#ca8a04" }}>booking</Box>
        </Typography>
        {stepper}
      </motion.div>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 340px" }, gap: 3, alignItems: "start" }}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3.5 }, overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              {step === "travellers" ? travellersStep : step === "rooms" ? roomsStep : paymentStep}
            </motion.div>
          </AnimatePresence>
        </Paper>
        <Box sx={{ position: { md: "sticky" }, top: 92 }}>{summary}</Box>
      </Box>

      <PaymentGateway payment={payment} onSuccess={onPaid} onClose={() => setPayment(null)} />
    </Container>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  );
}
