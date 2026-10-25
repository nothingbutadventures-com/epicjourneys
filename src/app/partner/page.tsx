"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

const TOKEN = "epic_partner_token";
const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN) : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const statusChip = (status: string) => (
  <Chip label={status} size="small" sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", fontWeight: 600, textTransform: "capitalize",
    bgcolor: status === "confirmed" ? "#ecfdf5" : status === "pending" ? "#fffbeb" : "#fef2f2",
    color: status === "confirmed" ? "#059669" : status === "pending" ? "#d97706" : "#dc2626" }} />
);

const Card = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1.25, borderBottom: "1px solid #f1f5f9" }}>
      <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>{title}</Typography>
      {action}
    </Box>
    {children}
  </Paper>
);

const Empty = ({ text }: { text: string }) => <Typography sx={{ textAlign: "center", py: 3.5, color: "#94a3b8", fontSize: "0.8rem" }}>{text}</Typography>;

export default function PartnerDashboardPage() {
  const [partner, setPartner] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [launches, setLaunches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const h = authHeaders();
        const me = await fetch("/api/partners", { headers: h }).then((r) => r.json());
        const p = me.data?.[0] || null;
        setPartner(p);
        const cityId = p?.assignedDestination?._id;
        const [b, t, l] = await Promise.all([
          fetch("/api/bookings", { headers: h }).then((r) => r.json()),
          cityId ? fetch(`/api/tours?from=${cityId}`).then((r) => r.json()) : Promise.resolve({ data: [] }),
          fetch("/api/launches", { headers: h }).then((r) => r.json()),
        ]);
        if (b.success) setBookings(b.data || []);
        else setError(b.error || "Failed to load bookings");
        setTours(t.data || []);
        setLaunches(l.data || []);
      } catch (e: any) {
        setError(e.message || "Failed to load your dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const city = partner?.assignedDestination;

  const data = useMemo(() => {
    const today = startOfToday();
    const active = bookings.filter((b) => b.status !== "cancelled");
    const upcomingTrips = active
      .filter((b) => new Date(b.travelDate) >= today)
      .sort((a, b) => +new Date(a.travelDate) - +new Date(b.travelDate));
    // Upcoming departures from the partner's city, soonest first.
    const departures = tours
      .flatMap((t) =>
        (t.departures || [])
          .filter((d: any) => String(d.cityId?._id || d.cityId) === String(city?._id) && new Date(d.startDate) >= today)
          .map((d: any) => ({ t, d }))
      )
      .sort((a, b) => +new Date(a.d.startDate) - +new Date(b.d.startDate));
    const liveTours = new Set(departures.map((x) => String(x.t._id))).size;
    const travellersNext30 = upcomingTrips
      .filter((b) => +new Date(b.travelDate) - +today <= 30 * 86400000)
      .reduce((n, b) => n + (b.numberOfTravelers || 0), 0);
    const volume = active.reduce((n, b) => n + (b.totalAmountInr || 0), 0);
    const pendingPayments = active.filter((b) => b.paymentStatus && b.paymentStatus !== "paid").length;
    return { active, upcomingTrips, departures, liveTours, travellersNext30, volume, pendingPayments };
  }, [bookings, tours, city]);

  const needsReply = launches.filter((l) => l.status === "awaiting_partner").length;
  const discounts: any[] = (partner?.partnerDiscountIds || []).filter(Boolean);

  const stats = [
    { label: "Bookings handled", value: data.active.length },
    { label: "Booking volume", value: inr(data.volume) },
    { label: "Upcoming trips", value: data.upcomingTrips.length, sub: `${data.travellersNext30} travellers in next 30 days` },
    { label: "Live tours", value: data.liveTours, sub: `from ${city?.name || "your city"}` },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>Welcome, {partner?.name || "Partner"}</Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            {city ? `Here's what's happening in ${city.name}, ${city.state}` : "No location assigned yet"}
          </Typography>
        </Box>
        <Button component={Link} href="/partner/city-tours" variant="contained" size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
          sx={{ bgcolor: "#0f172a", borderRadius: "4px", height: 30, fontSize: "0.78rem", "&:hover": { bgcolor: "#1e293b" } }}>
          Book a tour
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}
      {!loading && !city && <Alert severity="warning" sx={{ mb: 2, borderRadius: "4px" }}>No location is assigned to your account yet. Please contact the admin.</Alert>}
      {needsReply > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "4px" }} action={<Button component={Link} href="/partner/requests" size="small" color="inherit">Review</Button>}>
          {needsReply} tour request{needsReply === 1 ? " is" : "s are"} waiting for your confirmation.
        </Alert>
      )}
      {data.pendingPayments > 0 && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: "4px" }} action={<Button component={Link} href="/partner/bookings" size="small" color="inherit">View</Button>}>
          {data.pendingPayments} booking{data.pendingPayments === 1 ? " has" : "s have"} a payment still pending.
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5, mb: 2.5 }}>
        {stats.map((c) => (
          <Paper key={c.label} elevation={0} sx={{ p: 1.75, borderRadius: "4px", border: "1px solid #e2e8f0" }}>
            <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</Typography>
            <Typography sx={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{loading ? "–" : c.value}</Typography>
            {c.sub && <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>{c.sub}</Typography>}
          </Paper>
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={24} /></Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
          <Card title="Next departures from your city" action={<Button component={Link} href="/partner/city-tours" size="small" sx={{ color: "#0f172a", fontSize: "0.72rem" }}>All city tours</Button>}>
            {data.departures.length === 0 ? <Empty text="No upcoming departures from your city" /> : data.departures.slice(0, 5).map(({ t, d }, i, arr) => (
              <Box key={d._id} sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, px: 2, py: 1.25, borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{t.title}</Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>{fmt(d.startDate)} – {fmt(d.endDate)}</Typography>
                </Box>
                <Typography sx={{ fontSize: "0.72rem", color: "#475569", whiteSpace: "nowrap", textAlign: "right" }}>
                  {d.seats} seats<br />{d.discountPercentage ? `${d.discountPercentage}% off` : inr(d.price ?? t.priceInr)}
                </Typography>
              </Box>
            ))}
          </Card>

          <Card title="Upcoming trips of your customers" action={<Button component={Link} href="/partner/bookings" size="small" sx={{ color: "#0f172a", fontSize: "0.72rem" }}>All bookings</Button>}>
            {data.upcomingTrips.length === 0 ? <Empty text="No upcoming trips yet" /> : data.upcomingTrips.slice(0, 5).map((b, i, arr) => (
              <Box key={b._id} sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, px: 2, py: 1.25, borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{b.customerName} · {b.numberOfTravelers} pax</Typography>
                  <Typography noWrap sx={{ fontSize: "0.72rem", color: "#64748b" }}>{b.tourTitle || b.tourId?.title}</Typography>
                </Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(b.travelDate)}</Typography>
              </Box>
            ))}
          </Card>

          <Card title="Recent bookings">
            {bookings.length === 0 ? <Empty text="No bookings yet" /> : bookings.slice(0, 5).map((b, i, arr) => (
              <Box key={b._id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, px: 2, py: 1.25, borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{b.bookingRef}</Typography>
                  <Typography noWrap sx={{ fontSize: "0.72rem", color: "#64748b" }}>{b.customerName} · {inr(b.totalAmountInr)}</Typography>
                </Box>
                {statusChip(b.status)}
              </Box>
            ))}
          </Card>

          <Card title="Your account">
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Box>
                <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Location</Typography>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{city ? `${city.name}, ${city.state}` : "Not assigned"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", mb: 0.5 }}>Your partner discounts</Typography>
                {discounts.length === 0 ? (
                  <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>None attached</Typography>
                ) : (
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    {discounts.map((d) => (
                      <Chip key={d._id} size="small" label={`${d.name} · ${d.discountType === "percentage" ? `${d.value}%` : inr(d.value)} off`}
                        sx={{ borderRadius: "4px", fontSize: "0.7rem", fontWeight: 600, bgcolor: d.isActive ? "#fff7ed" : "#f1f5f9", color: d.isActive ? "#c2410c" : "#94a3b8" }} />
                    ))}
                  </Box>
                )}
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Tour requests</Typography>
                <Typography sx={{ fontSize: "0.85rem" }}>
                  {launches.filter((l) => l.status === "approved").length} live · {needsReply} need your reply ·{" "}
                  <Link href="/partner/requests" style={{ color: "#0f172a", fontWeight: 600 }}>view</Link>
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
}
