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
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DepartureCalendar from "@/components/checkout/DepartureCalendar";
import InlineAuth from "@/components/checkout/InlineAuth";
import PaymentGateway, { type PaymentDescriptor } from "@/components/checkout/PaymentGateway";
import { computeQuote, inr, type RoomType } from "@/lib/pricing";
import { balanceDueDate, BALANCE_DUE_DAYS_BEFORE, buildSchedule, depositOption } from "@/lib/deposit";

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
  const pay: "full" | "deposit" = sp.get("pay") === "deposit" ? "deposit" : "full";
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

  const refreshUser = useCallback(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.authenticated ? d.user : null))
      .catch(() => setUser(null));
  }, []);

  // ---- Remote data ----
  const [user, setUser] = useState<{ name: string; email: string; phone?: string } | null | undefined>(undefined);
  const [tour, setTour] = useState<any>(null);
  const [tourError, setTourError] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!tourKey) return;
    fetch(`/api/tours/${tourKey}`)
      .then((r) => r.json())
      .then((d) => (d.success ? setTour(d.data) : setTourError(d.error || "Tour not found")))
      .catch(() => setTourError("Couldn't load this tour"));
  }, [tourKey]);

  const departure = useMemo(() => (tour?.departures || []).find((d: any) => d._id === departureId) || null, [tour, departureId]);
  const sameCityDepartures = useMemo(
    () => (tour?.departures || []).filter((d: any) => departure && d.cityId === departure.cityId),
    [tour, departure]
  );
  const maxTravellers = departure ? Math.min(20, departure.available) : 20;
  const singleOffered = (tour?.singleRoomPriceInr || 0) > 0;

  // ---- Traveller details (kept in sessionStorage so they survive login/register redirects) ----
  const storeKey = `ej_checkout_${tourKey}`;
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

  // ---- Pricing & deposit ----
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
  const depositInfo = useMemo(
    () =>
      quote && departure
        ? depositOption({ total: quote.total, travellers: n, startDate: departure.startDate, cfg: { type: tour?.depositType, value: tour?.depositValue } })
        : { available: false, deposit: 0, reason: "" },
    [quote, departure, tour, n]
  );
  const effectivePay: "full" | "deposit" = pay === "deposit" && depositInfo.available ? "deposit" : "full";
  const schedule = useMemo(
    () =>
      quote && departure
        ? buildSchedule({ total: quote.total, strategy: effectivePay, deposit: depositInfo.deposit, startDate: departure.startDate })
        : [],
    [quote, departure, effectivePay, depositInfo.deposit]
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
          strategy: effectivePay,
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
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const shell = (children: React.ReactNode) => (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#ffffff" }}>
      <Navbar key={user ? "in" : "out"} />
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

  // ---- Main checkout ----
  const fieldSx = { "& .MuiOutlinedInput-root": { bgcolor: "#fff" } };
  const cityName = departure.cityName;
  const stepBack = () => updateParams({ step: STEPS[Math.max(0, stepIndex - 1)].key }, "push");

  const stepper = (
    <Box sx={{ display: "flex", alignItems: "center", mb: 3.5, pb: 3, borderBottom: "1px solid #e5e7eb" }}>
      {STEPS.map((st, i) => {
        const done = i < stepIndex;
        const active = i === stepIndex;
        return (
          <React.Fragment key={st.key}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem",
                  bgcolor: done ? "#16a34a" : active ? "#facc15" : "#f3f4f6",
                  color: done ? "#fff" : active ? "#0f172a" : "#9ca3af",
                }}
              >
                {done ? <CheckRoundedIcon sx={{ fontSize: 18 }} /> : i + 1}
              </Box>
              <Box sx={{ display: { xs: active ? "block" : "none", sm: "block" } }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: active || done ? "#0f172a" : "#9ca3af", lineHeight: 1.15 }}>{st.label}</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>{st.hint}</Typography>
              </Box>
            </Box>
            {i < STEPS.length - 1 && <Box sx={{ flex: 1, mx: { xs: 1.5, md: 2.5 }, height: 2, bgcolor: i < stepIndex ? "#16a34a" : "#e5e7eb" }} />}
          </React.Fragment>
        );
      })}
    </Box>
  );

  const stepTitle = (_icon: React.ReactNode, title: string, sub: string) => (
    <Box sx={{ mb: 3 }}>
      <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.015em", lineHeight: 1.2 }}>{title}</Typography>
      <Typography sx={{ color: "#64748b", fontSize: "0.9rem", mt: 0.5 }}>{sub}</Typography>
    </Box>
  );

  const travellersStep = (
    <>
      {stepTitle(<GroupsRoundedIcon />, "Traveller details", "Enter details exactly as on each traveller's ID.")}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, mb: 2.5, borderRadius: "6px", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Number of travellers</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button size="small" variant="outlined" disabled={n <= 1} onClick={() => updateParams({ travellers: String(n - 1), rooms: null })} sx={{ minWidth: 36, px: 0 }}><RemoveRoundedIcon fontSize="small" /></Button>
          <Typography sx={{ fontWeight: 800, minWidth: 24, textAlign: "center" }}>{n}</Typography>
          <Button size="small" variant="outlined" disabled={n >= maxTravellers} onClick={() => updateParams({ travellers: String(n + 1), rooms: null })} sx={{ minWidth: 36, px: 0 }}><AddRoundedIcon fontSize="small" /></Button>
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {people.map((p, i) => {
          const valid = personValid(p);
          return (
            <Box key={i}>
              <Box sx={{ p: 2.5, borderRadius: "6px", border: "1px solid", borderColor: valid ? "#86efac" : "#e5e7eb", bgcolor: "#fff" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: "50%", bgcolor: valid ? "#16a34a" : "#f3f4f6", color: valid ? "#fff" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {valid ? <CheckRoundedIcon sx={{ fontSize: 18 }} /> : <PersonRoundedIcon sx={{ fontSize: 18 }} />}
                  </Box>
                  <Typography sx={{ fontWeight: 800 }}>Traveller {i + 1}</Typography>
                  {i === 0 && <Chip label="Primary" size="small" sx={{ bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 700 }} />}
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
                      value={user?.email ?? ""}
                      disabled
                      sx={{ ...fieldSx, gridColumn: { sm: "1 / -1" } }}
                      slotProps={{ input: { endAdornment: <VerifiedRoundedIcon sx={{ color: "#16a34a" }} /> } }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
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
      <DepartureCalendar
        departures={sameCityDepartures}
        selectedId={departureId}
        travellers={n}
        cityName={cityName}
        onSelect={(d) => d._id !== departureId && updateParams({ departure: d._id })}
      />
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
        {people.map((p, i) => (
          <Box key={i}>
            <Box sx={{ p: 2, borderRadius: "6px", border: "1px solid #e5e7eb", bgcolor: "#fff", display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 160 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "#fef9c3", color: "#854d0e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
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
                    <Box key={opt.type} sx={{ flex: 1 }}>
                      <Box
                        role="radio"
                        aria-checked={selected}
                        tabIndex={disabled ? -1 : 0}
                        onClick={() => !disabled && setRooms(rooms.map((r, j) => (j === i ? opt.type : r)))}
                        onKeyDown={(e) => !disabled && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setRooms(rooms.map((r, j) => (j === i ? opt.type : r))))}
                        sx={{
                          p: 1.5, height: "100%", borderRadius: "6px", border: "2px solid", textAlign: "center", position: "relative", outline: "none",
                          borderColor: selected ? "#facc15" : "#e5e7eb", bgcolor: selected ? "#fffbeb" : disabled ? "#f9fafb" : "#fff",
                          opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s",
                        }}
                      >
                        {selected && (
                          <Box sx={{ position: "absolute", top: -9, right: -9, width: 20, height: 20, borderRadius: "50%", bgcolor: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CheckRoundedIcon sx={{ fontSize: 14 }} />
                          </Box>
                        )}
                        <Box sx={{ color: selected ? "#ca8a04" : "#94a3b8" }}>{opt.icon}</Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{opt.title}</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: opt.type === "single" && singleOffered ? "#b45309" : "#059669", fontWeight: 700 }}>{opt.sub}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
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
    key: "full" | "deposit",
    title: string,
    badge: string,
    desc: string,
    icon: React.ReactNode,
    disabled?: boolean,
    disabledReason?: string
  ) => {
    const selected = pay === key && !disabled;
    return (
      <Box
        role="radio"
        aria-checked={selected}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && updateParams({ pay: key })}
        onKeyDown={(e) => !disabled && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), updateParams({ pay: key }))}
        sx={{
          p: 2.5, borderRadius: "6px", border: "2px solid", outline: "none", height: "100%",
          borderColor: selected ? "#facc15" : "#e5e7eb", bgcolor: selected ? "#fffbeb" : disabled ? "#f9fafb" : "#fff",
          opacity: disabled ? 0.65 : 1, cursor: disabled ? "not-allowed" : "pointer", transition: "border-color .2s, background-color .2s",
          "&:hover": disabled ? {} : { borderColor: selected ? "#facc15" : "#d1d5db" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1 }}>
          <Box sx={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid", borderColor: selected ? "#0f172a" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {selected && <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#0f172a" }} />}
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", flex: 1 }}>{title}</Typography>
          <Chip label={badge} size="small" sx={{ bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 700, height: 22 }} />
        </Box>
        <Typography sx={{ color: "#475569", fontSize: "0.88rem", lineHeight: 1.6, pl: 4 }}>{disabled ? disabledReason : desc}</Typography>
      </Box>
    );
  };

  const paymentStep = (
    <>
      {stepTitle(<PaymentsRoundedIcon />, "Choose how to pay", "Secure payments powered by Razorpay.")}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
        {payOption("full", "Complete payment", "Pay once", `Pay the full ${inr(quote!.total)} now and your seats are confirmed instantly.`, <BoltRoundedIcon />)}
        {payOption(
          "deposit",
          "Pay minimum deposit",
          "Reserve for less",
          `Pay just ${inr(depositInfo.deposit)} now to confirm your seats. The remaining ${inr(quote!.total - depositInfo.deposit)} is due by ${fmtDate(balanceDueDate(departure.startDate).toISOString())} (${BALANCE_DUE_DAYS_BEFORE} days before the tour starts).`,
          <AccountBalanceWalletRoundedIcon />,
          !depositInfo.available,
          depositInfo.reason
        )}
      </Box>

      <Box sx={{ mb: 3, borderRadius: "6px", border: "1px solid #e5e7eb", overflow: "hidden", bgcolor: "#fff" }}>
        <Box sx={{ px: 2, py: 1.25, bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: "#ca8a04" }} />
          <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>Payment schedule</Typography>
        </Box>
        {schedule.map((s, i) => (
          <Box key={s.index} sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: i < schedule.length - 1 ? "1px dashed #e2e8f0" : "none", bgcolor: i === 0 ? "#fffbeb" : "#fff" }}>
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
        <Box>
          <Button
            variant="contained"
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LockRoundedIcon />}
            onClick={startPayment}
            sx={{ px: 4, py: 1.3, bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, fontSize: "1rem", boxShadow: "none", "&:hover": { bgcolor: "#eab308" } }}
          >
            Pay {inr(payableNow)} now
          </Button>
        </Box>
      </Box>
    </>
  );

  const summary = (
    <Paper elevation={0} sx={{ overflow: "hidden", border: "1px solid #e5e7eb" }}>
      <Box component="img" src={tour.coverImage} alt={tour.title} sx={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
      <Box sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 800, lineHeight: 1.3, mb: 1.5 }}>{tour.title}</Typography>
        {[
          { icon: <EventRoundedIcon />, text: `${fmtDate(departure.startDate)} – ${fmtDate(departure.endDate)}` },
          { icon: <LocationOnIcon />, text: `Starts & ends in ${cityName}` },
          { icon: <GroupsRoundedIcon />, text: `${n} traveller${n > 1 ? "s" : ""}` },
        ].map((r, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1, color: "#334155" }}>
            <Box sx={{ color: "#a16207", display: "flex" }}>{React.cloneElement(r.icon as React.ReactElement<any>, { sx: { fontSize: 18 } })}</Box>
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{r.text}</Typography>
          </Box>
        ))}
        <Box sx={{ my: 2, borderTop: "1px solid #e5e7eb" }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75, fontSize: "0.9rem", color: "#475569" }}>
          <span>{inr(quote!.unitPrice)} × {n}</span>
          <strong>{inr(quote!.baseTotal)}</strong>
        </Box>
        {quote!.singleCount > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75, fontSize: "0.9rem", color: "#475569" }}>
            <span>Single room × {quote!.singleCount}</span>
            <strong>+{inr(quote!.roomSupplement)}</strong>
          </Box>
        )}
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Typography sx={{ fontWeight: 700 }}>Total</Typography>
          <Typography sx={{ fontSize: "1.45rem", fontWeight: 800 }}>{inr(quote!.total)}</Typography>
        </Box>
        {step === "payment" && effectivePay === "deposit" && (
          <Typography sx={{ mt: 1, fontSize: "0.8rem", color: "#64748b" }}>
            Pay {inr(payableNow)} today, balance by {fmtDate(balanceDueDate(departure.startDate).toISOString())}.
          </Typography>
        )}
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 0.75 }}>
          {[
            { icon: <LockRoundedIcon />, text: "Secure payment" },
            { icon: <VerifiedRoundedIcon />, text: "Verified local partner" },
          ].map((r) => (
            <Box key={r.text} sx={{ display: "flex", alignItems: "center", gap: 1, color: "#475569", fontSize: "0.82rem", fontWeight: 600 }}>
              {React.cloneElement(r.icon as React.ReactElement<any>, { sx: { fontSize: 17, color: "#a16207" } })}
              {r.text}
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );

  return shell(
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, flexGrow: 1 }}>
      <Typography component="h1" sx={{ fontSize: { xs: "1.6rem", md: "2.1rem" }, fontWeight: 800, letterSpacing: "-0.02em", mb: 2.5 }}>
        Complete your booking
      </Typography>
      {stepper}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 340px" }, gap: 4, alignItems: "start" }}>
        <Box>
          {user === null ? <InlineAuth onAuthed={refreshUser} tourTitle={tour.title} /> : step === "travellers" ? travellersStep : step === "rooms" ? roomsStep : paymentStep}
        </Box>
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
