"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Tab,
  Tabs,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BedroomParentRoundedIcon from "@mui/icons-material/BedroomParentRounded";
import KingBedRoundedIcon from "@mui/icons-material/KingBedRounded";
import PaymentGateway, { type PaymentDescriptor } from "@/components/checkout/PaymentGateway";
import { computeQuote, discountUsable, inr, partnerDiscountAmount, type RoomType } from "@/lib/pricing";
import { isBaseDeparture, isMyCityDeparture, partnerCanBook } from "@/lib/partner-booking";
import { balanceDueDate, buildSchedule, depositOption } from "@/lib/deposit";

const TOKEN = "epic_partner_token";
const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN) : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const cleanPhone = (v: string) => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

interface Person { firstName: string; lastName: string; phone: string; age: string }
const blank = (): Person => ({ firstName: "", lastName: "", phone: "", age: "" });
const personValid = (p: Person) =>
  p.firstName.trim() && p.lastName.trim() && /^[6-9]\d{9}$/.test(cleanPhone(p.phone)) && Number(p.age) >= 1 && Number(p.age) <= 100;

const STEPS = ["Trip", "Travellers", "Rooms", "Payment"];

export default function PartnerBookingDialog({
  open,
  onClose,
  tour: pickedTour,
  mode,
  partner,
  onBooked,
}: {
  open: boolean;
  onClose: () => void;
  /** The tour chosen on the Book Tour page. */
  tour: any | null;
  /** "mine": dates launched from the partner's city. "all": the tour's own dates plus the partner's city. */
  mode: "mine" | "all";
  partner: any;
  onBooked: () => void;
}) {
  const cityId = partner?.assignedDestination?._id;
  const [step, setStep] = useState(0);
  const [tour, setTour] = useState<any>(null);
  const [tourLoading, setTourLoading] = useState(false);
  const [departureId, setDepartureId] = useState("");
  const [people, setPeople] = useState<Person[]>([blank()]);
  const [email, setEmail] = useState("");
  const [rooms, setRooms] = useState<RoomType[]>(["shared"]);
  const [pay, setPay] = useState<"full" | "deposit">("full");
  const [discountId, setDiscountId] = useState("");
  const [requests, setRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentDescriptor | null>(null);
  const [done, setDone] = useState<{ ref: string; total: number; paid: number } | null>(null);
  const [pendingRef, setPendingRef] = useState<string | null>(null);

  const n = people.length;

  // Reset every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDepartureId("");
    setPeople([blank()]);
    setEmail("");
    setRooms(["shared"]);
    setPay("full");
    setDiscountId("");
    setRequests("");
    setError(null);
    setPayment(null);
    setDone(null);
    setPendingRef(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load the tour with live seat availability and its deposit / single-room settings.
  useEffect(() => {
    const tourId = pickedTour?._id;
    if (!open || !tourId) return;
    let cancelled = false;
    setTourLoading(true);
    setTour(null);
    fetch(`/api/tours/${tourId}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setTour(d.success ? d.data : null))
      .catch(() => !cancelled && setTour(null))
      .finally(() => !cancelled && setTourLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, pickedTour]);

  const departures: any[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (tour?.departures || [])
      .filter((d: any) => (mode === "mine" ? isMyCityDeparture(d, cityId) : partnerCanBook(d, cityId)) && new Date(d.startDate) >= today && d.available > 0)
      .sort((a: any, b: any) => +new Date(a.startDate) - +new Date(b.startDate));
  }, [tour, cityId, mode]);
  const departure = departures.find((d) => d._id === departureId) || null;

  useEffect(() => {
    if (!departures.some((d) => d._id === departureId)) setDepartureId(departures[0]?._id || "");
  }, [departures, departureId]);

  const singleOffered = (tour?.singleRoomPriceInr || 0) > 0;
  const maxTravellers = departure ? Math.min(20, departure.available) : 20;

  const setCount = (next: number) => {
    const c = Math.min(maxTravellers, Math.max(1, next));
    setPeople((prev) => Array.from({ length: c }, (_, i) => prev[i] || blank()));
    setRooms((prev) => Array.from({ length: c }, (_, i) => prev[i] || "shared"));
  };
  useEffect(() => {
    if (n > maxTravellers) setCount(maxTravellers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxTravellers]);

  const setPerson = (i: number, patch: Partial<Person>) => setPeople((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const myDiscounts: any[] = useMemo(() => (partner?.partnerDiscountIds || []).filter((d: any) => d && discountUsable(d)), [partner]);
  const chosenDiscount = myDiscounts.find((d) => d._id === discountId) || null;

  // ---- Pricing: tour discount → room supplement → partner discount, same as the server ----
  const quote = useMemo(
    () => (departure ? computeQuote({ price: departure.price, discountPercentage: departure.discountPercentage, singleRoomPrice: tour?.singleRoomPriceInr || 0, rooms }) : null),
    [departure, tour, rooms]
  );
  const partnerOff = quote && chosenDiscount ? partnerDiscountAmount(quote.total, chosenDiscount) : 0;
  const payTotal = quote ? quote.total - partnerOff : 0;
  const depositInfo = useMemo(
    () => (quote && departure ? depositOption({ total: payTotal, travellers: n, startDate: departure.startDate, cfg: { type: tour?.depositType, value: tour?.depositValue } }) : { available: false, deposit: 0, reason: "" }),
    [quote, departure, tour, n, payTotal]
  );
  const effectivePay: "full" | "deposit" = pay === "deposit" && depositInfo.available ? "deposit" : "full";
  const schedule = useMemo(
    () => (quote && departure ? buildSchedule({ total: payTotal, strategy: effectivePay, deposit: depositInfo.deposit, startDate: departure.startDate }) : []),
    [quote, departure, effectivePay, depositInfo.deposit, payTotal]
  );
  const listTotal = departure ? departure.price * n : 0;
  const tourOff = quote ? listTotal - quote.baseTotal : 0;

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const peopleOk = people.every(personValid) && emailOk;
  const canNext = step === 0 ? Boolean(departure) && n >= 1 : step === 1 ? peopleOk : true;

  const next = () => {
    setError(null);
    // Skip the rooms step when the tour has no single-room option.
    setStep((s) => (s === 1 && !singleOffered ? 3 : s + 1));
  };
  const back = () => setStep((s) => (s === 3 && !singleOffered ? 1 : Math.max(0, s - 1)));

  const startPayment = async () => {
    if (!tour || !departure || !quote) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          tour: tour._id,
          departureId: departure._id,
          strategy: effectivePay,
          customer: { email: email.trim() },
          specialRequests: requests,
          ...(discountId ? { partnerDiscountId: discountId } : {}),
          travellers: people.map((p, i) => ({ ...p, phone: cleanPhone(p.phone), roomType: rooms[i] })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't start the payment");
      setPendingRef(data.bookingRef);
      setPayment(data.payment);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onPaid = useCallback(
    (ref: string) => {
      setPayment(null);
      setDone({ ref, total: payTotal, paid: schedule[0]?.amountInr || 0 });
      onBooked();
    },
    [payTotal, schedule, onBooked]
  );

  const busy = submitting || Boolean(payment);
  const activeStepIndex = !singleOffered && step === 3 ? 2 : step;
  const labels = singleOffered ? STEPS : STEPS.filter((s) => s !== "Rooms");
  const row = (l: React.ReactNode, v: React.ReactNode, color = "#475569", bold = false) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5, gap: 2 }}>
      <Typography sx={{ fontSize: "0.82rem", color }}>{l}</Typography>
      <Typography sx={{ fontSize: "0.85rem", color, fontWeight: bold ? 700 : 500, whiteSpace: "nowrap" }}>{v}</Typography>
    </Box>
  );

  return (
    <>
      <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>Book Tour For Customer</Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>Same details as the website checkout, paid from here</Typography>
          </Box>
          <IconButton size="small" onClick={onClose} disabled={busy}><CloseRoundedIcon fontSize="small" /></IconButton>
        </Box>

        {done ? (
          <DialogContent sx={{ textAlign: "center", py: 5 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 64, color: "#16a34a" }} />
            <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", mt: 1 }}>Booking confirmed</Typography>
            <Typography sx={{ color: "#64748b", mt: 0.5 }}>Reference <strong style={{ color: "#0f172a" }}>{done.ref}</strong></Typography>
            <Typography sx={{ color: "#475569", mt: 1.5, fontSize: "0.9rem" }}>
              {people[0].firstName} {people[0].lastName}{n > 1 ? ` + ${n - 1}` : ""} · Total {inr(done.total)} · Paid {inr(done.paid)}
              {done.paid < done.total ? ` · Balance ${inr(done.total - done.paid)}` : ""}
            </Typography>
            {done.paid < done.total && (
              <Typography sx={{ color: "#64748b", mt: 0.5, fontSize: "0.8rem" }}>The balance can be collected later from the Bookings page.</Typography>
            )}
            <Button onClick={onClose} variant="contained" sx={{ mt: 3, bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>Done</Button>
          </DialogContent>
        ) : (
          <>
            <Box sx={{ px: 3, pt: 2.5 }}>
              <Stepper activeStep={activeStepIndex} alternativeLabel sx={{ "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": { color: "#FF9900" }, "& .MuiStepIcon-text": { fill: "#0f172a", fontWeight: 800 } }}>
                {labels.map((l) => (<Step key={l}><StepLabel>{l}</StepLabel></Step>))}
              </Stepper>
            </Box>

            <DialogContent sx={{ pt: 2.5, minHeight: 380 }}>
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>{error}</Alert>}

              {step === 0 && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ p: 1.5, border: "1px solid #E2E2E2", borderRadius: "4px", bgcolor: "#F8FAFC", display: "flex", alignItems: "center", gap: 1.5 }}>
                      {pickedTour?.coverImage && <Box component="img" src={pickedTour.coverImage} alt="" sx={{ width: 56, height: 40, objectFit: "cover", borderRadius: "3px" }} />}
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.92rem" }}>{pickedTour?.title}</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {pickedTour?.targetCity ? `${pickedTour.targetCity}, ` : ""}{pickedTour?.state} · {pickedTour?.durationDays}D / {pickedTour?.durationNights}N ·{" "}
                          {mode === "mine" ? "Dates from your city" : "Tour's own dates + your city"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    {tourLoading ? (
                      <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}><CircularProgress size={22} /></Box>
                    ) : departures.length === 0 ? (
                      <Alert severity="warning" sx={{ borderRadius: "4px" }}>No bookable dates with free seats for this tour.</Alert>
                    ) : (
                      <>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>Departure date</Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                          {departures.map((d) => {
                            const sel = d._id === departureId;
                            const unit = Math.round(d.price * (1 - (d.discountPercentage || 0) / 100));
                            return (
                              <Box key={d._id} onClick={() => setDepartureId(d._id)} sx={{ cursor: "pointer", p: 1.5, borderRadius: "4px", border: "2px solid", borderColor: sel ? "#FF9900" : "#E2E2E2", bgcolor: sel ? "#FFF6E5" : "#fff" }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>{fmt(d.startDate)} – {fmt(d.endDate)}</Typography>
                                  <Chip size="small" label={isBaseDeparture(d) ? "Tour dates" : "Your city"} sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700, borderRadius: "4px", bgcolor: isBaseDeparture(d) ? "#f1f5f9" : "#FFF0D1", color: isBaseDeparture(d) ? "#475569" : "#8A5200" }} />
                                </Box>
                                {d.cityName && <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>Joining / leaving: {d.cityName}</Typography>}
                                <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>
                                  {inr(unit)} / person{d.discountPercentage ? ` · ${d.discountPercentage}% off` : ""} · {d.available} seat{d.available === 1 ? "" : "s"} left
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </>
                    )}
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, border: "1px solid #E2E2E2", borderRadius: "4px" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", flex: 1 }}>Number of travellers</Typography>
                      <IconButton size="small" disabled={n <= 1} onClick={() => setCount(n - 1)} sx={{ border: "1px solid #E2E2E2" }}><RemoveRoundedIcon fontSize="small" /></IconButton>
                      <Typography sx={{ fontWeight: 800, minWidth: 24, textAlign: "center" }}>{n}</Typography>
                      <IconButton size="small" disabled={n >= maxTravellers} onClick={() => setCount(n + 1)} sx={{ border: "1px solid #E2E2E2" }}><AddRoundedIcon fontSize="small" /></IconButton>
                    </Box>
                  </Grid>
                  {myDiscounts.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Your partner discount (optional)</InputLabel>
                        <Select value={discountId} label="Your partner discount (optional)" onChange={(e) => setDiscountId(e.target.value)}>
                          <MenuItem value=""><em>No discount</em></MenuItem>
                          {myDiscounts.map((d) => (
                            <MenuItem key={d._id} value={d._id}>{d.name} — {d.discountType === "percentage" ? `${d.value}% off` : `${inr(d.value)} off`}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              )}

              {step === 1 && (
                <Box>
                  <TextField label="Customer email (booking updates go here)" type="email" required fullWidth size="small" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} error={Boolean(email) && !emailOk} />
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {people.map((p, i) => (
                      <Box key={i} sx={{ p: 2, border: "1px solid #E2E2E2", borderRadius: "4px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                          <Typography sx={{ fontWeight: 800 }}>Traveller {i + 1}</Typography>
                          {i === 0 && <Chip label="Primary" size="small" sx={{ bgcolor: "#FFF0D1", color: "#8A5200", fontWeight: 700 }} />}
                        </Box>
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 12, sm: 6 }}><TextField label="First name" required fullWidth size="small" value={p.firstName} onChange={(e) => setPerson(i, { firstName: e.target.value })} /></Grid>
                          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Last name" required fullWidth size="small" value={p.lastName} onChange={(e) => setPerson(i, { lastName: e.target.value })} /></Grid>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField label="Mobile number" required fullWidth size="small" value={p.phone} onChange={(e) => setPerson(i, { phone: e.target.value })}
                              error={Boolean(p.phone) && !/^[6-9]\d{9}$/.test(cleanPhone(p.phone))}
                              slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> }, htmlInput: { inputMode: "numeric", maxLength: 12 } }} />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Age" type="number" required fullWidth size="small" value={p.age} onChange={(e) => setPerson(i, { age: e.target.value })} slotProps={{ htmlInput: { min: 1, max: 100 } }} /></Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {step === 2 && (
                <Box>
                  <Typography sx={{ color: "#64748b", fontSize: "0.88rem", mb: 1.5 }}>Shared rooms are included in the tour price.</Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <Button size="small" variant="outlined" onClick={() => setRooms(rooms.map(() => "shared"))}>All shared</Button>
                    <Button size="small" variant="outlined" onClick={() => setRooms(rooms.map(() => "single"))}>All single (+{inr((tour?.singleRoomPriceInr || 0) * n)})</Button>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    {people.map((p, i) => (
                      <Box key={i} sx={{ p: 1.5, border: "1px solid #E2E2E2", borderRadius: "4px", display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                        <Box sx={{ flex: 1, minWidth: 140 }}>
                          <Typography sx={{ fontWeight: 800 }}>{p.firstName} {p.lastName}</Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>Traveller {i + 1}{i === 0 ? " · Primary" : ""}</Typography>
                        </Box>
                        {([
                          { type: "shared" as RoomType, title: "Shared room", sub: "Included", icon: <BedroomParentRoundedIcon /> },
                          { type: "single" as RoomType, title: "Single room", sub: `+${inr(tour?.singleRoomPriceInr || 0)}`, icon: <KingBedRoundedIcon /> },
                        ]).map((o) => {
                          const sel = rooms[i] === o.type;
                          return (
                            <Box key={o.type} onClick={() => setRooms((r) => r.map((x, j) => (j === i ? o.type : x)))}
                              sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderRadius: "4px", border: "2px solid", borderColor: sel ? "#FF9900" : "#E2E2E2", bgcolor: sel ? "#FFF6E5" : "#fff" }}>
                              {o.icon}
                              <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{o.title}</Typography>
                                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: o.type === "single" ? "#B36B00" : "#059669" }}>{o.sub}</Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {step === 3 && quote && departure && (
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 1 }}>How will the customer pay?</Typography>
                    {([
                      { key: "full" as const, title: "Pay in full", desc: `Pay ${inr(payTotal)} now and the booking is fully paid.`, disabled: false },
                      { key: "deposit" as const, title: "Pay a deposit", desc: depositInfo.available ? `Pay ${inr(depositInfo.deposit)} now, the remaining ${inr(payTotal - depositInfo.deposit)} is due ${fmt(balanceDueDate(departure.startDate))}.` : depositInfo.reason || "", disabled: !depositInfo.available },
                    ]).map((o) => {
                      const sel = effectivePay === o.key;
                      return (
                        <Box key={o.key} onClick={() => !o.disabled && setPay(o.key)} sx={{ mb: 1, p: 1.75, borderRadius: "4px", border: "2px solid", cursor: o.disabled ? "not-allowed" : "pointer", opacity: o.disabled ? 0.55 : 1, borderColor: sel ? "#FF9900" : "#E2E2E2", bgcolor: sel ? "#FFF6E5" : "#fff" }}>
                          <Typography sx={{ fontWeight: 800 }}>{o.title}</Typography>
                          <Typography sx={{ color: "#475569", fontSize: "0.85rem" }}>{o.desc}</Typography>
                        </Box>
                      );
                    })}
                    <Box sx={{ mt: 1.5, p: 1.5, border: "1px solid #E2E2E2", borderRadius: "4px" }}>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", mb: 0.5 }}>Payment schedule</Typography>
                      {schedule.map((s, i) => (
                        <Box key={s.index} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>{s.label}</Typography>
                            <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>{i === 0 ? "Collected now" : `Due ${fmt(s.dueDate)}`}</Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 800 }}>{inr(s.amountInr)}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <TextField label="Special requests (optional)" fullWidth multiline minRows={2} size="small" value={requests} onChange={(e) => setRequests(e.target.value)} sx={{ mt: 1.5 }} slotProps={{ htmlInput: { maxLength: 1000 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{ p: 2, border: "1px solid #E2E2E2", borderRadius: "4px", bgcolor: "#F8FAFC" }}>
                      <Typography sx={{ fontWeight: 800, mb: 0.25 }}>{tour?.title}</Typography>
                      <Typography sx={{ fontSize: "0.78rem", color: "#64748b", mb: 1 }}>
                        {fmt(departure.startDate)} – {fmt(departure.endDate)} · {n} traveller{n === 1 ? "" : "s"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.78rem", color: "#64748b", mb: 1 }}>
                        {people[0].firstName} {people[0].lastName}{n > 1 ? ` + ${n - 1} more` : ""} · {email}
                      </Typography>
                      {row(`Tour price ${inr(departure.price)} × ${n}`, inr(listTotal))}
                      {tourOff > 0 && row(`Tour discount (${departure.discountPercentage}%)`, `− ${inr(tourOff)}`, "#059669")}
                      {quote.singleCount > 0 && row(`Single room × ${quote.singleCount}`, `+ ${inr(quote.roomSupplement)}`)}
                      {chosenDiscount && row(`Your discount: ${chosenDiscount.name}`, `− ${inr(partnerOff)}`, "#c2410c")}
                      <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid #E2E2E2" }}>{row("Total", inr(payTotal), "#0f172a", true)}</Box>
                      <Box sx={{ mt: 1 }}>{row("Due now", inr(schedule[0]?.amountInr || 0), "#0f172a", true)}</Box>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", justifyContent: "space-between" }}>
              <Button onClick={step === 0 ? onClose : back} disabled={busy} sx={{ color: "#64748b" }}>{step === 0 ? "Cancel" : "Back"}</Button>
              {step < 3 ? (
                <Button variant="contained" onClick={next} disabled={!canNext} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>Continue</Button>
              ) : (
                <Button variant="contained" onClick={startPayment} disabled={busy || !quote} sx={{ bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" } }}>
                  {submitting ? <CircularProgress size={20} color="inherit" /> : `Pay ${inr(schedule[0]?.amountInr || 0)} & confirm`}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <PaymentGateway payment={payment} headers={authHeaders()} onSuccess={onPaid} onClose={() => { setPayment(null); if (pendingRef) setError("Payment wasn't completed. The seats are held for 20 minutes — press the pay button to try again."); }} />
    </>
  );
}
