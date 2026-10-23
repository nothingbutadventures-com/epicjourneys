"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, Chip, CircularProgress, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const TOKEN = "epic_partner_token";
const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN) : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function PartnerCityToursPage() {
  const [city, setCity] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState<"live" | "all">("live");

  useEffect(() => {
    (async () => {
      try {
        const h = authHeaders();
        const me = await fetch("/api/partners", { headers: h }).then((r) => r.json());
        const c = me.data?.[0]?.assignedDestination || null;
        setCity(c);
        const [t, b] = await Promise.all([
          c ? fetch(`/api/tours?from=${c._id}`).then((r) => r.json()) : Promise.resolve({ success: true, data: [] }),
          fetch("/api/bookings", { headers: h }).then((r) => r.json()),
        ]);
        setTours(t.data || []);
        setBookings(b.data || []);
      } catch (e: any) {
        setError(e.message || "Failed to load tours");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = search.trim().toLowerCase();
    return tours
      .map((t) => {
        const mine = (t.departures || []).filter((d: any) => String(d.cityId?._id || d.cityId) === String(city?._id));
        const upcoming = mine.filter((d: any) => new Date(d.startDate) >= today).sort((a: any, b: any) => +new Date(a.startDate) - +new Date(b.startDate));
        const count = bookings.filter((b) => String(b.tourId?._id || b.tourId) === String(t._id) && b.status !== "cancelled").length;
        return { t, upcoming, past: mine.length - upcoming.length, count };
      })
      .filter((r) => (show === "all" || r.upcoming.length > 0) && (!q || `${r.t.title} ${r.t.targetCity} ${r.t.state}`.toLowerCase().includes(q)));
  }, [tours, bookings, city, search, show]);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>City Tours</Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Tours that start from {city?.name || "your city"}, with their live departures
          </Typography>
        </Box>
        <Button component={Link} href="/partner/bookings?new=1" variant="contained" size="small" disabled={rows.length === 0} sx={{ bgcolor: "#0f172a", borderRadius: "4px", height: 30, fontSize: "0.78rem", "&:hover": { bgcolor: "#1e293b" } }}>
          Book for a customer
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}
      {!loading && !city && <Alert severity="warning" sx={{ mb: 2, borderRadius: "4px" }}>No city is assigned to your account yet. Please contact the admin.</Alert>}

      <Box sx={{ display: "flex", gap: 1.25, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField size="small" placeholder="Search tours…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
        {([["live", "Live departures"], ["all", "All tours"]] as const).map(([v, l]) => (
          <Chip key={v} label={l} size="small" clickable onClick={() => setShow(v)}
            sx={{ borderRadius: "4px", fontSize: "0.72rem", fontWeight: 600, bgcolor: show === v ? "#0f172a" : "#f1f5f9", color: show === v ? "#fff" : "#475569", "&:hover": { bgcolor: show === v ? "#1e293b" : "#e2e8f0" } }} />
        ))}
      </Box>

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={24} /></Box>
        ) : rows.length === 0 ? (
          <Typography sx={{ textAlign: "center", py: 4, color: "#94a3b8", fontSize: "0.82rem" }}>
            {show === "live" ? "No tours have upcoming departures from your city right now" : "No tours start from your city yet"}
          </Typography>
        ) : (
          rows.map(({ t, upcoming, past, count }, i) => (
            <Box key={t._id} sx={{ display: "flex", gap: 2, p: 1.75, borderBottom: i < rows.length - 1 ? "1px solid #f1f5f9" : "none", flexWrap: "wrap" }}>
              <Box component="img" src={t.coverImage} alt="" sx={{ width: 96, height: 68, objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.92rem", color: "#0f172a" }}>{t.title}</Typography>
                  {upcoming.length > 0 ? (
                    <Chip label="Live" size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, borderRadius: "4px", bgcolor: "#dcfce7", color: "#166534" }} />
                  ) : (
                    <Chip label="No upcoming dates" size="small" sx={{ height: 18, fontSize: "0.65rem", borderRadius: "4px", bgcolor: "#f1f5f9", color: "#64748b" }} />
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mb: 0.75 }}>
                  {t.targetCity ? `${t.targetCity}, ` : ""}{t.state} · {t.durationDays}D / {t.durationNights}N · from {inr(t.basePriceInr || t.priceInr)} · {count} booking{count === 1 ? "" : "s"} by you{past > 0 ? ` · ${past} past departure${past === 1 ? "" : "s"}` : ""}
                </Typography>
                {upcoming.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    {upcoming.slice(0, 6).map((d: any) => (
                      <Chip key={d._id} size="small" variant="outlined"
                        label={`${fmt(d.startDate)} – ${fmt(d.endDate)} · ${d.seats} seats · ${inr(Math.round((d.price ?? t.priceInr) * (1 - (d.discountPercentage || 0) / 100)))}${d.discountPercentage ? ` (${d.discountPercentage}% off)` : ""}`}
                        sx={{ borderRadius: "4px", fontSize: "0.7rem", borderColor: "#e2e8f0", color: "#334155" }} />
                    ))}
                    {upcoming.length > 6 && <Chip size="small" label={`+${upcoming.length - 6} more`} sx={{ borderRadius: "4px", fontSize: "0.7rem", bgcolor: "#f1f5f9" }} />}
                  </Box>
                )}
              </Box>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}
