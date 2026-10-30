"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Button, Chip, CircularProgress, Container, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import { motion } from "framer-motion";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CompassRose, MountainScene } from "@/components/home/Illustrations";
import { rise, stagger } from "@/components/home/HomeSections";
import { inr } from "@/lib/pricing";
import { withRedirect } from "@/lib/redirect";
import { thumbUrl } from "@/lib/images";

type TabKey = "bookings" | "history" | "payments" | "profile" | "support";
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "bookings", label: "Bookings", icon: <LuggageRoundedIcon /> },
  { key: "history", label: "History", icon: <HistoryRoundedIcon /> },
  { key: "payments", label: "Payments", icon: <PaymentsRoundedIcon /> },
  { key: "profile", label: "Profile", icon: <PersonRoundedIcon /> },
  { key: "support", label: "Help & Support", icon: <SupportAgentRoundedIcon /> },
];

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function statusOf(b: any) {
  const ended = b.travelEndDate ? new Date(b.travelEndDate).getTime() < Date.now() : new Date(b.travelDate).getTime() < Date.now();
  if (b.status === "cancelled") return { label: "Cancelled", bg: "#fee2e2", fg: "#b91c1c", past: true };
  if (b.status === "pending") return { label: "Payment pending", bg: "#FFF0D1", fg: "#B36B00", past: false };
  if (ended) return { label: "Completed", bg: "#E2E2E2", fg: "#334155", past: true };
  return { label: "Confirmed", bg: "#dcfce7", fg: "#166534", past: false };
}

function BookingCard({ b }: { b: any }) {
  const st = statusOf(b);
  const remaining = b.totalAmountInr - b.amountPaidInr;
  const nextDue = (b.installments || []).find((i: any) => i.status !== "paid");
  const t = b.tourId || {};
  return (
    <motion.div variants={rise} whileHover={{ y: -4 }}>
      <Paper elevation={0} sx={{ overflow: "hidden", display: "flex", flexDirection: { xs: "column", sm: "row" }, transition: "box-shadow .2s", "&:hover": { boxShadow: "0 16px 32px -18px rgba(15,23,42,0.3)" } }}>
        <Box sx={{ position: "relative", width: { xs: "100%", sm: 200 }, height: { xs: 150, sm: "auto" }, flexShrink: 0, bgcolor: "#F2F4F7" }}>
          {t.coverImage && <Box component="img" src={thumbUrl(t.coverImage)} alt={b.tourTitle} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
          <Chip label={st.label} size="small" sx={{ position: "absolute", top: 10, left: 10, bgcolor: st.bg, color: st.fg, fontWeight: 800 }} />
        </Box>
        <Box sx={{ p: 2.5, flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", mb: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.3 }}>{b.tourTitle}</Typography>
            <Chip label={b.bookingRef} size="small" sx={{ bgcolor: "#43149D", color: "#FF9900", fontWeight: 800 }} />
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1.5, color: "#475569", fontSize: "0.85rem", fontWeight: 600 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><EventRoundedIcon sx={{ fontSize: 17, color: "#E68A00" }} />{fmt(b.travelDate)}{b.travelEndDate ? ` – ${fmt(b.travelEndDate)}` : ""}</Box>
            {b.departureCity && <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><LocationOnIcon sx={{ fontSize: 17, color: "#E68A00" }} />{b.departureCity}</Box>}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><GroupsRoundedIcon sx={{ fontSize: 17, color: "#E68A00" }} />{b.numberOfTravelers} traveller{b.numberOfTravelers > 1 ? "s" : ""}</Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", pt: 1.5, borderTop: "1px dashed #E2E2E2" }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>{inr(b.totalAmountInr)}</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: remaining > 0 && b.status !== "cancelled" ? "#B36B00" : "#059669", fontWeight: 700, mt: 0.5 }}>
                {b.status === "cancelled" ? "Cancelled" : remaining > 0 ? `${inr(remaining)} ${nextDue ? `due by ${fmt(nextDue.dueDate)}` : "left"}` : "Fully paid"}
              </Typography>
            </Box>
            <Button component={Link} href={`/booking/${b.bookingRef}`} variant="contained" size="small" endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{ bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" } }}>
              {remaining > 0 && b.status !== "cancelled" ? "Pay / details" : "View details"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: "1px dashed #cbd5e1" }}>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
        <TravelExploreRoundedIcon sx={{ fontSize: 56, color: "#94a3b8" }} />
      </motion.div>
      <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", mt: 1 }}>{title}</Typography>
      <Typography sx={{ color: "#64748b", fontSize: "0.9rem", mb: 2.5 }}>{text}</Typography>
      <Button component={Link} href="/tours" variant="contained" sx={{ bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" } }}>
        Explore tours
      </Button>
    </Paper>
  );
}

function ProfileInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const tabParam = sp.get("tab") as TabKey | null;
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "bookings";

  const [user, setUser] = useState<any>(undefined);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me");
      if (!me.ok) return setUser(null);
      const d = await me.json();
      setUser(d.user);
      setName(d.user.name || "");
      setEmail(d.user.email || "");
      const r = await fetch("/api/user/bookings");
      const bd = await r.json();
      if (bd.success) setBookings(bd.data);
    } catch {
      setUser(null);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setTab = (k: TabKey) => router.replace(`/user/profile?tab=${k}`, { scroll: false });

  // Unpaid-and-unconfirmed checkouts are listed under Bookings so they can be resumed.
  const { upcoming, history } = useMemo(() => {
    const up: any[] = [];
    const hist: any[] = [];
    for (const b of bookings) (statusOf(b).past ? hist : up).push(b);
    return { upcoming: up, history: hist };
  }, [bookings]);

  const stats = useMemo(() => {
    const active = bookings.filter((b) => b.status !== "cancelled");
    return {
      trips: active.filter((b) => b.status === "confirmed").length,
      upcoming: upcoming.filter((b) => b.status === "confirmed").length,
      spent: active.reduce((s, b) => s + (b.amountPaidInr || 0), 0),
      due: active.reduce((s, b) => s + Math.max(0, b.totalAmountInr - (b.amountPaidInr || 0)), 0),
    };
  }, [bookings, upcoming]);

  const instalments = useMemo(
    () =>
      bookings
        .filter((b) => b.status !== "cancelled")
        .flatMap((b) => (b.installments || []).map((i: any) => ({ ...i, bookingRef: b.bookingRef, tourTitle: b.tourTitle })))
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate)),
    [bookings]
  );

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || "Couldn't save");
      setUser((u: any) => ({ ...u, ...d.user }));
      setSaveMsg({ ok: true, text: "Profile updated" });
    } catch (err: any) {
      setSaveMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    window.location.href = "/";
  };

  const shell = (children: React.ReactNode) => (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#FDF9EC" }}>
      <Navbar />
      {children}
      <Footer />
    </Box>
  );

  if (user === undefined) {
    return shell(
      <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: "#0f172a" }} />
      </Box>
    );
  }

  if (user === null) {
    return shell(
      <Container maxWidth="sm" sx={{ py: 8, flexGrow: 1, textAlign: "center" }}>
        <Paper elevation={0} sx={{ p: 4, borderTop: "4px solid #FF9900", overflow: "hidden" }}>
          <CompassRose size={84} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", mt: 1.5 }}>Log in to see your bookings</Typography>
          <Typography sx={{ color: "#64748b", mt: 0.5, mb: 3 }}>Your trips, payments and profile live here.</Typography>
          <Button component={Link} href={withRedirect("/login", "/user/profile")} variant="contained" startIcon={<LoginRoundedIcon />}
            sx={{ px: 4, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" } }}>
            Login
          </Button>
        </Paper>
      </Container>
    );
  }

  const initials = (user.name || "?").split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const statTiles = [
    { icon: <LuggageRoundedIcon />, value: String(stats.trips), label: "Trips booked", color: "#FF9900" },
    { icon: <RouteRoundedIcon />, value: String(stats.upcoming), label: "Upcoming", color: "#38bdf8" },
    { icon: <SavingsRoundedIcon />, value: inr(stats.spent), label: "Paid so far", color: "#34d399" },
    { icon: <AccountBalanceWalletRoundedIcon />, value: inr(stats.due), label: "Yet to pay", color: "#fb7185" },
  ];

  const list = (items: any[], emptyTitle: string, emptyText: string) =>
    loadingBookings ? (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#0f172a" }} /></Box>
    ) : items.length === 0 ? (
      <EmptyState title={emptyTitle} text={emptyText} />
    ) : (
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((b) => <BookingCard key={b._id} b={b} />)}
      </motion.div>
    );

  return shell(
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, flexGrow: 1 }}>
      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Paper elevation={0} sx={{ position: "relative", overflow: "hidden", p: { xs: 2.5, md: 4 }, mb: 3, borderTop: "4px solid #FF9900", bgcolor: "#FFF6E5", borderColor: "#FFD699" }}>
          <Box sx={{ position: "absolute", right: 0, bottom: 0, left: { md: "55%" }, lineHeight: 0, opacity: 0.85, display: { xs: "none", md: "block" } }}>
            <MountainScene height={150} />
          </Box>
          <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
            <motion.div whileHover={{ rotate: -6, scale: 1.05 }}>
              <Box sx={{ width: 84, height: 84, borderRadius: "16px", background: "linear-gradient(135deg, #FFB340, #FF9900 55%, #FF9900)", color: "#0f172a", fontSize: "1.9rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 24px -10px rgba(250,204,21,0.9)" }}>
                {initials}
              </Box>
            </motion.div>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{user.name}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.25 }}>
                {user.email && <Chip icon={<EmailRoundedIcon sx={{ fontSize: "16px !important" }} />} label={user.email} size="small" sx={{ bgcolor: "#fff", fontWeight: 700 }} />}
                {user.phone && <Chip icon={<PhoneRoundedIcon sx={{ fontSize: "16px !important" }} />} label={`+91 ${user.phone}`} size="small" sx={{ bgcolor: "#fff", fontWeight: 700 }} />}
                <Chip icon={<VerifiedRoundedIcon sx={{ fontSize: "16px !important", color: "#059669 !important" }} />} label="Verified account" size="small" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700 }} />
              </Box>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Stat tiles */}
      <motion.div variants={stagger} initial="hidden" animate="show">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
          {statTiles.map((s) => (
            <motion.div key={s.label} variants={rise} whileHover={{ y: -4 }}>
              <Paper elevation={0} sx={{ position: "relative", overflow: "hidden", p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ position: "absolute", right: -18, top: -18, width: 70, height: 70, borderRadius: "50%", bgcolor: s.color, opacity: 0.18 }} />
                <Box sx={{ width: 44, height: 44, borderRadius: "8px", bgcolor: s.color, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>{s.icon}</Box>
                <Box sx={{ position: "relative", minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", lineHeight: 1 }} noWrap>{s.value}</Typography>
                  <Typography sx={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600, mt: 0.5 }}>{s.label}</Typography>
                </Box>
              </Paper>
            </motion.div>
          ))}
        </Box>
      </motion.div>

      {/* Tabs */}
      <Paper elevation={0} sx={{ p: 0.75, mb: 3, display: "flex", gap: 0.5, overflowX: "auto", "&::-webkit-scrollbar": { display: "none" } }}>
        {TABS.map((t) => {
          const active = t.key === tab;
          const count = t.key === "bookings" ? upcoming.length : t.key === "history" ? history.length : null;
          return (
            <Box
              key={t.key}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              onClick={() => setTab(t.key)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setTab(t.key))}
              sx={{ position: "relative", flex: { md: 1 }, flexShrink: 0, px: 2, py: 1.25, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, cursor: "pointer", borderRadius: "4px", fontWeight: 800, fontSize: "0.9rem", whiteSpace: "nowrap", color: active ? "#0f172a" : "#64748b", outline: "none", "&:hover": { bgcolor: active ? "transparent" : "#FDF9EC" } }}
            >
              {active && (
                <motion.div layoutId="user-tab" transition={{ type: "spring", stiffness: 400, damping: 32 }} style={{ position: "absolute", inset: 0, borderRadius: 6, background: "#FF9900" }} />
              )}
              <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1 }}>
                {React.cloneElement(t.icon as React.ReactElement<any>, { sx: { fontSize: 20 } })}
                {t.label}
                {count ? <Chip label={count} size="small" sx={{ height: 20, bgcolor: active ? "#0f172a" : "#E2E2E2", color: active ? "#FF9900" : "#475569", fontWeight: 800 }} /> : null}
              </Box>
            </Box>
          );
        })}
      </Paper>

      {/* Tab content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {tab === "bookings" && list(upcoming, "No upcoming trips", "Your confirmed and in-progress bookings will show up here.")}
        {tab === "history" && list(history, "No past trips yet", "Completed and cancelled bookings are kept here.")}

        {tab === "payments" && (
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 } }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", mb: 0.5 }}>Payments</Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.88rem", mb: 2.5 }}>Every payment across your bookings, in due-date order.</Typography>
            {instalments.length === 0 ? (
              <Typography sx={{ color: "#94a3b8", py: 3, textAlign: "center" }}>No payments yet.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {instalments.map((i) => {
                  const paid = i.status === "paid";
                  const overdue = !paid && i.index > 0 && new Date(i.dueDate).getTime() < Date.now();
                  return (
                    <Box key={`${i.bookingRef}-${i.index}`} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "4px", border: "1px solid", borderColor: paid ? "#bbf7d0" : overdue ? "#fecaca" : "#E2E2E2", bgcolor: paid ? "#f0fdf4" : overdue ? "#fef2f2" : "#fff", flexWrap: "wrap" }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: paid ? "#10b981" : "#F2F4F7", color: paid ? "#fff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {paid ? <CheckCircleRoundedIcon sx={{ fontSize: 20 }} /> : <PaymentsRoundedIcon sx={{ fontSize: 19 }} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 180 }}>
                        <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>{i.label} · {i.tourTitle}</Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: overdue ? "#dc2626" : "#64748b", fontWeight: overdue ? 700 : 400 }}>
                          {i.bookingRef} · {paid ? `Paid ${i.paidAt ? fmt(i.paidAt) : ""}` : `${overdue ? "Overdue, was due" : "Due"} ${fmt(i.dueDate)}`}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 800 }}>{inr(i.amountInr)}</Typography>
                      {!paid && <Button component={Link} href={`/booking/${i.bookingRef}`} size="small" variant="contained" sx={{ bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" } }}>Pay</Button>}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        )}

        {tab === "profile" && (
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, maxWidth: 640 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", mb: 0.5 }}>Your details</Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.88rem", mb: 3 }}>These prefill the primary traveller when you book.</Typography>
            <form onSubmit={saveProfile}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
                {saveMsg && <Alert severity={saveMsg.ok ? "success" : "error"}>{saveMsg.text}</Alert>}
                <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
                <TextField
                  label="Mobile number"
                  type="tel"
                  value={user.phone || ""}
                  disabled
                  fullWidth
                  helperText="This is how you log in, so it can't be changed here."
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment>, endAdornment: <VerifiedRoundedIcon sx={{ color: "#10b981" }} /> } }}
                />
                <TextField label="Email address (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth helperText="Only used to send your booking confirmations and invoices." />
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
                    sx={{ px: 3, py: 1, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" } }}>
                    Save changes
                  </Button>
                  <Button onClick={logout} variant="outlined" startIcon={<LogoutRoundedIcon />} sx={{ color: "#b91c1c", borderColor: "#fecaca" }}>Logout</Button>
                </Box>
              </Box>
            </form>
          </Paper>
        )}

        {tab === "support" && (
          <Paper elevation={0} sx={{ position: "relative", overflow: "hidden", p: { xs: 3, md: 4 }, textAlign: "center" }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity }} style={{ display: "inline-block" }}>
              <Box sx={{ width: 72, height: 72, borderRadius: "16px", bgcolor: "#fce7f3", color: "#be185d", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto" }}>
                <SupportAgentRoundedIcon sx={{ fontSize: 40 }} />
              </Box>
            </motion.div>
            <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", mt: 2 }}>Need a hand with a booking?</Typography>
            <Typography sx={{ color: "#64748b", maxWidth: 440, mx: "auto", mt: 0.75, mb: 3 }}>
              Send us a question and our team will get back to you. Keep your booking reference handy.
            </Typography>
            <Button component={Link} href="/help" variant="contained" endIcon={<ArrowForwardRoundedIcon />}
              sx={{ px: 4, py: 1.2, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" } }}>
              Open Help & Support
            </Button>
          </Paper>
        )}
      </motion.div>
    </Container>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileInner />
    </Suspense>
  );
}
