"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Button, Chip, CircularProgress, Container, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import KingBedRoundedIcon from "@mui/icons-material/KingBedRounded";
import BedroomParentRoundedIcon from "@mui/icons-material/BedroomParentRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentGateway, { type PaymentDescriptor } from "@/components/checkout/PaymentGateway";
import { CompassRose, MountainScene } from "@/components/home/Illustrations";
import { rise, stagger } from "@/components/home/HomeSections";
import { inr } from "@/lib/pricing";
import { withRedirect } from "@/lib/redirect";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function BookingInner() {
  const { ref } = useParams<{ ref: string }>();
  const router = useRouter();
  const justPaid = useSearchParams().get("status") === "success";

  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentDescriptor | null>(null);
  const [startingIndex, setStartingIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/checkout/booking?ref=${encodeURIComponent(ref)}`);
      const data = await res.json();
      if (res.status === 401) setNeedsLogin(true);
      else if (!res.ok || !data.success) setError(data.error || "Booking not found");
      else setBooking(data.data);
    } catch {
      setError("Couldn't load this booking");
    } finally {
      setLoading(false);
    }
  }, [ref]);

  useEffect(() => {
    load();
  }, [load]);

  const payInstalment = async (index: number) => {
    setStartingIndex(index);
    setError(null);
    try {
      const res = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, index }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't start the payment");
      setPayment(data.payment);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStartingIndex(null);
    }
  };

  const shell = (children: React.ReactNode) => (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#FDF9EC" }}>
      <Navbar />
      {children}
      <Footer />
    </Box>
  );

  if (loading) {
    return shell(
      <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: "#0f172a" }} />
      </Box>
    );
  }

  if (needsLogin) {
    return shell(
      <Container maxWidth="sm" sx={{ py: 8, flexGrow: 1, textAlign: "center" }}>
        <Paper elevation={0} sx={{ p: 4, borderTop: "4px solid #FF9900" }}>
          <CompassRose size={80} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", mt: 1.5 }}>Log in to view your booking</Typography>
          <Typography sx={{ color: "#64748b", mt: 0.5, mb: 3 }}>Booking {ref} is tied to your account.</Typography>
          <Button component={Link} href={withRedirect("/login", `/booking/${ref}`)} variant="contained" startIcon={<LoginRoundedIcon />}
            sx={{ px: 4, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" } }}>
            Login
          </Button>
        </Paper>
      </Container>
    );
  }

  if (error && !booking) {
    return shell(
      <Container maxWidth="sm" sx={{ py: 8, flexGrow: 1 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button component={Link} href="/tours" variant="outlined">Browse tours</Button>
      </Container>
    );
  }

  const b = booking;
  const confirmed = b.status === "confirmed";
  const cancelled = b.status === "cancelled";
  const nextDue = b.installments.find((i: any) => i.status !== "paid");
  const remaining = b.totalAmountInr - b.amountPaidInr;
  const holdLeftMin = b.holdExpiresAt ? Math.max(0, Math.round((new Date(b.holdExpiresAt).getTime() - Date.now()) / 60000)) : 0;
  const paidPct = Math.min(100, Math.round((b.amountPaidInr / b.totalAmountInr) * 100));

  return shell(
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, flexGrow: 1 }}>
      {/* Status banner */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Paper
          elevation={0}
          sx={{ position: "relative", overflow: "hidden", mb: 3, p: { xs: 3, md: 4 }, bgcolor: confirmed ? "#f0fdf4" : cancelled ? "#fef2f2" : "#FFF6E5", borderColor: confirmed ? "#bbf7d0" : cancelled ? "#fecaca" : "#FFD699" }}
        >
          <Box sx={{ position: "absolute", right: 0, bottom: 0, left: { md: "55%" }, lineHeight: 0, opacity: 0.8, display: { xs: "none", md: "block" } }}>
            <MountainScene height={130} />
          </Box>
          <Box sx={{ position: "relative", display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.6 }}>
              {confirmed ? <CheckCircleRoundedIcon sx={{ fontSize: 64, color: "#10b981" }} /> : <HourglassTopRoundedIcon sx={{ fontSize: 64, color: cancelled ? "#ef4444" : "#FF9900" }} />}
            </motion.div>
            <Box>
              <Typography sx={{ fontSize: { xs: "1.5rem", md: "2.1rem" }, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                {confirmed ? (justPaid ? "You're booked! 🎉" : "Booking confirmed") : cancelled ? "Booking cancelled" : "Payment pending"}
              </Typography>
              <Typography sx={{ color: "#475569", mt: 0.5 }}>
                {confirmed
                  ? remaining > 0
                    ? `Seats confirmed. ${inr(remaining)} balance is due by ${nextDue ? fmt(nextDue.dueDate) : "the due date"} (30 days before the tour starts).`
                    : "Your payment is complete. Our local partner will contact you shortly."
                  : cancelled
                  ? "This booking is no longer active."
                  : holdLeftMin > 0
                  ? `Your seats are held for about ${holdLeftMin} more minute${holdLeftMin === 1 ? "" : "s"}. Complete the payment to confirm them.`
                  : "Your hold has expired — resume payment and we'll re-check seat availability."}
              </Typography>
              <Chip icon={<ConfirmationNumberRoundedIcon sx={{ fontSize: "16px !important" }} />} label={b.bookingRef} sx={{ mt: 1.5, bgcolor: "#43149D", color: "#FF9900", fontWeight: 800, letterSpacing: "0.05em" }} />
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 360px" }, gap: 3, alignItems: "start" }}>
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Trip */}
          <motion.div variants={rise}>
            <Paper elevation={0} sx={{ overflow: "hidden", borderTop: "4px solid #FF9900" }}>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" } }}>
                {b.tour?.coverImage && <Box component="img" src={b.tour.coverImage} alt={b.tourTitle} sx={{ width: { xs: "100%", sm: 220 }, height: { xs: 160, sm: "auto" }, objectFit: "cover" }} />}
                <Box sx={{ p: 2.5, flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", mb: 1.5 }}>{b.tourTitle}</Typography>
                  {[
                    { icon: <EventRoundedIcon />, text: `${fmt(b.travelDate)}${b.travelEndDate ? ` – ${fmt(b.travelEndDate)}` : ""}` },
                    { icon: <LocationOnIcon />, text: `Starts & ends in ${b.departureCity || "—"}` },
                    { icon: <GroupsRoundedIcon />, text: `${b.numberOfTravelers} traveller${b.numberOfTravelers > 1 ? "s" : ""}` },
                  ].map((r, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1, color: "#334155" }}>
                      <Box sx={{ color: "#E68A00", display: "flex" }}>{React.cloneElement(r.icon as React.ReactElement<any>, { sx: { fontSize: 19 } })}</Box>
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>{r.text}</Typography>
                    </Box>
                  ))}
                  {b.tour?.slug && <Button component={Link} href={`/tours/${b.tour.slug}`} size="small" startIcon={<ExploreRoundedIcon />} sx={{ mt: 0.5, color: "#0f172a", fontWeight: 700 }}>View tour</Button>}
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* Starting address */}
          {b.startAddress && (
            <motion.div variants={rise}>
              <Paper elevation={0} sx={{ p: 2.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationOnIcon sx={{ color: "#E68A00" }} /> Where to report
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.85rem", mb: 2 }}>
                  Starting point in {b.startAddress.city} for {fmt(b.travelDate)}.
                </Typography>
                <Typography sx={{ fontWeight: 800 }}>{b.startAddress.label}</Typography>
                <Typography sx={{ color: "#334155", fontSize: "0.92rem", mt: 0.5, whiteSpace: "pre-line" }}>
                  {b.startAddress.address}
                  {b.startAddress.pincode ? ` — ${b.startAddress.pincode}` : ""}
                </Typography>
                {b.startAddress.landmark && (
                  <Typography sx={{ color: "#64748b", fontSize: "0.85rem", mt: 0.5 }}>Landmark: {b.startAddress.landmark}</Typography>
                )}
                {(b.startAddress.mobile || b.startAddress.secondaryMobile) && (
                  <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", mt: 1.5, fontSize: "0.9rem", fontWeight: 600 }}>
                    {b.startAddress.mobile && (
                      <Box component="a" href={`tel:+91${b.startAddress.mobile}`} sx={{ color: "#0f172a" }}>
                        Call: +91 {b.startAddress.mobile}
                      </Box>
                    )}
                    {b.startAddress.secondaryMobile && (
                      <Box component="a" href={`tel:+91${b.startAddress.secondaryMobile}`} sx={{ color: "#0f172a" }}>
                        Alternate: +91 {b.startAddress.secondaryMobile}
                      </Box>
                    )}
                  </Box>
                )}
                {b.startAddress.mapUrl && (
                  <Button component="a" href={b.startAddress.mapUrl} target="_blank" rel="noopener noreferrer" size="small" variant="outlined" sx={{ mt: 2, color: "#0f172a", borderColor: "#0f172a" }}>
                    Open in Google Maps
                  </Button>
                )}
              </Paper>
            </motion.div>
          )}

          {/* Travellers */}
          {b.travellers?.length > 0 && (
            <motion.div variants={rise}>
              <Paper elevation={0} sx={{ p: 2.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <GroupsRoundedIcon sx={{ color: "#E68A00" }} /> Travellers
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  {b.travellers.map((t: any, i: number) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "4px", border: "1px solid #E2E2E2", flexWrap: "wrap" }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: i === 0 ? "#FF9900" : "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                        {t.firstName[0]?.toUpperCase()}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 160 }}>
                        <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>{t.firstName} {t.lastName}{i === 0 ? " · Primary" : ""}</Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>{t.age} yrs · +91 {t.phone}{t.email ? ` · ${t.email}` : ""}</Typography>
                      </Box>
                      <Chip
                        icon={t.roomType === "single" ? <KingBedRoundedIcon sx={{ fontSize: "16px !important" }} /> : <BedroomParentRoundedIcon sx={{ fontSize: "16px !important" }} />}
                        label={t.roomType === "single" ? "Single room" : "Shared room"}
                        size="small"
                        sx={{ bgcolor: t.roomType === "single" ? "#ffedd5" : "#e0f2fe", color: t.roomType === "single" ? "#9a3412" : "#075985", fontWeight: 700 }}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </motion.div>
          )}

          {/* Instalments */}
          <motion.div variants={rise}>
            <Paper elevation={0} sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <PaymentsRoundedIcon sx={{ color: "#E68A00" }} /> {b.paymentStrategy === "full" ? "Payment" : "Payment schedule"}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {b.installments.map((inst: any) => {
                  const paid = inst.status === "paid";
                  const isNext = nextDue?.index === inst.index && !cancelled;
                  const overdue = !paid && inst.index > 0 && new Date(inst.dueDate).getTime() < Date.now();
                  return (
                    <Box key={inst.index} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "4px", border: "1px solid", borderColor: paid ? "#bbf7d0" : isNext ? "#FFB340" : "#E2E2E2", bgcolor: paid ? "#f0fdf4" : isNext ? "#FFF6E5" : "#fff", flexWrap: "wrap" }}>
                      <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: paid ? "#10b981" : "#F2F4F7", color: paid ? "#fff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem" }}>
                        {paid ? <CheckCircleRoundedIcon sx={{ fontSize: 20 }} /> : inst.index + 1}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 140 }}>
                        <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>{inst.label}</Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: overdue ? "#dc2626" : "#64748b", fontWeight: overdue ? 700 : 400 }}>
                          {paid ? `Paid ${inst.paidAt ? fmt(inst.paidAt) : ""}${inst.simulated ? " · simulated" : ""}` : `${overdue ? "Overdue · was due" : "Due"} ${fmt(inst.dueDate)}`}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 800 }}>{inr(inst.amountInr)}</Typography>
                      {isNext && (
                        <Button
                          variant="contained"
                          size="small"
                          disabled={startingIndex !== null}
                          onClick={() => payInstalment(inst.index)}
                          sx={{ bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" } }}
                        >
                          {startingIndex === inst.index ? <CircularProgress size={16} color="inherit" /> : confirmed ? "Pay now" : "Complete payment"}
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </motion.div>
        </motion.div>

        {/* Totals */}
        <Box sx={{ position: { md: "sticky" }, top: 92 }}>
          <Paper elevation={0} sx={{ p: 2.5, position: "relative", overflow: "hidden", borderTop: "4px solid #FF9900" }}>
            <Box sx={{ position: "absolute", right: -30, top: -30, width: 110, height: 110, borderRadius: "50%", bgcolor: "#FF9900", opacity: 0.18 }} />
            <Typography sx={{ fontWeight: 800, mb: 2, position: "relative" }}>Payment summary</Typography>
            {[
              { l: `${inr(b.pricePerPerson)} × ${b.numberOfTravelers}`, v: inr(b.pricePerPerson * b.numberOfTravelers) },
              ...(b.roomSupplementInr > 0 ? [{ l: "Single room supplement", v: `+${inr(b.roomSupplementInr)}` }] : []),
              ...(b.partnerDiscountInr > 0 ? [{ l: b.partnerDiscountName || "Partner discount", v: `−${inr(b.partnerDiscountInr)}` }] : []),
            ].map((r) => (
              <Box key={r.l} sx={{ display: "flex", justifyContent: "space-between", mb: 0.75, fontSize: "0.88rem", color: "#475569", position: "relative" }}>
                <span>{r.l}</span><strong>{r.v}</strong>
              </Box>
            ))}
            <Box sx={{ mt: 1.5, p: 1.75, borderRadius: "4px", bgcolor: "#43149D", color: "#fff", display: "flex", justifyContent: "space-between", position: "relative" }}>
              <Typography sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ fontWeight: 800, color: "#FF9900" }}>{inr(b.totalAmountInr)}</Typography>
            </Box>
            <Box sx={{ mt: 2, position: "relative" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", mb: 0.75 }}>
                <span style={{ color: "#059669", fontWeight: 700 }}>Paid {inr(b.amountPaidInr)}</span>
                <span style={{ color: "#64748b" }}>{remaining > 0 ? `${inr(remaining)} left` : "Fully paid"}</span>
              </Box>
              <Box sx={{ height: 8, borderRadius: 4, bgcolor: "#E2E2E2", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${paidPct}%` }} transition={{ duration: 0.9, delay: 0.3 }} style={{ height: "100%", background: "#10b981" }} />
              </Box>
            </Box>
            {!cancelled && (b.amountPaidInr > 0 || confirmed) && (
              <Button fullWidth component={Link} href={`/booking/${b.bookingRef}/invoice`} startIcon={<ReceiptLongRoundedIcon />} variant="contained"
                sx={{ mt: 2.5, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#E68A00", boxShadow: "none" } }}>
                View invoice
              </Button>
            )}
            <Button fullWidth onClick={() => router.push("/tours")} sx={{ mt: 1.25, color: "#0f172a", fontWeight: 700 }} variant="outlined">
              Explore more journeys
            </Button>
          </Paper>
        </Box>
      </Box>

      <PaymentGateway
        payment={payment}
        onSuccess={() => {
          setPayment(null);
          load();
          router.replace(`/booking/${ref}?status=success`);
        }}
        onClose={() => setPayment(null)}
      />
    </Container>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingInner />
    </Suspense>
  );
}
