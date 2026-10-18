"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LaunchRequestDialog from "@/components/launch/LaunchRequestDialog";
import { LAUNCH_STATUS, type LaunchStatus } from "@/lib/launch-shared";
import { StatusChip, authHeaders, inr } from "@/components/launch/LaunchParts";

const TOKEN = "epic_partner_token";

export default function PartnerToursPage() {
  const router = useRouter();
  const [tours, setTours] = useState<any[]>([]);
  const [launches, setLaunches] = useState<any[]>([]);
  const [city, setCity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const [length, setLength] = useState("all");
  const [show, setShow] = useState("all");
  const [active, setActive] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const h = authHeaders(TOKEN);
        const [t, l, me] = await Promise.all([
          fetch("/api/tours").then((r) => r.json()),
          fetch("/api/launches", { headers: h }).then((r) => r.json()),
          fetch("/api/partners", { headers: h }).then((r) => r.json()),
        ]);
        setTours(t.data || []);
        setLaunches(l.data || []);
        setCity(me.data?.[0]?.assignedDestination || null);
        if (!t.success) throw new Error(t.error);
      } catch (e: any) {
        setError(e.message || "Failed to load tours");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // The partner's latest request per tour, to show where it stands.
  const latestByTour = useMemo(() => {
    const m = new Map<string, any>();
    for (const l of launches) {
      const k = String(l.tourId?._id);
      if (!m.has(k)) m.set(k, l);
    }
    return m;
  }, [launches]);

  const states = useMemo(() => [...new Set(tours.map((t) => t.state).filter(Boolean))].sort(), [tours]);

  const rows = tours.filter((t) => {
    const q = search.trim().toLowerCase();
    if (q && !`${t.title} ${t.targetCity} ${t.state}`.toLowerCase().includes(q)) return false;
    if (state !== "all" && t.state !== state) return false;
    if (length === "short" && t.durationDays > 4) return false;
    if (length === "medium" && (t.durationDays < 5 || t.durationDays > 8)) return false;
    if (length === "long" && t.durationDays < 9) return false;
    const mine = latestByTour.get(String(t._id));
    if (show === "available" && mine && ["submitted", "awaiting_partner", "changes_requested", "partner_approved"].includes(mine.status)) return false;
    if (show === "mine" && !mine) return false;
    return true;
  });

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>Tours</Typography>
        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
          Pick a tour and request to start it from {city?.name || "your city"}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}
      {!loading && !city && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "4px" }}>No city is assigned to your account yet, so you can't request tours. Please contact the admin.</Alert>
      )}

      <Box sx={{ display: "flex", gap: 1.25, mb: 2, flexWrap: "wrap" }}>
        <TextField size="small" placeholder="Search tours…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel sx={{ fontSize: "0.8rem" }}>State</InputLabel>
          <Select value={state} label="State" onChange={(e) => setState(e.target.value)}>
            <MenuItem value="all">All states</MenuItem>
            {states.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontSize: "0.8rem" }}>Length</InputLabel>
          <Select value={length} label="Length" onChange={(e) => setLength(e.target.value)}>
            <MenuItem value="all">Any length</MenuItem>
            <MenuItem value="short">Up to 4 days</MenuItem>
            <MenuItem value="medium">5–8 days</MenuItem>
            <MenuItem value="long">9+ days</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel sx={{ fontSize: "0.8rem" }}>Show</InputLabel>
          <Select value={show} label="Show" onChange={(e) => setShow(e.target.value)}>
            <MenuItem value="all">All tours</MenuItem>
            <MenuItem value="available">Not requested yet</MenuItem>
            <MenuItem value="mine">My requests</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={24} /></Box>
        ) : rows.length === 0 ? (
          <Typography sx={{ textAlign: "center", py: 4, color: "#94a3b8", fontSize: "0.82rem" }}>No tours match these filters</Typography>
        ) : (
          rows.map((t, i) => {
            const mine = latestByTour.get(String(t._id));
            const blocked = mine && ["submitted", "awaiting_partner", "changes_requested", "partner_approved"].includes(mine.status);
            return (
              <Box key={t._id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.75, borderBottom: i < rows.length - 1 ? "1px solid #f1f5f9" : "none", flexWrap: "wrap" }}>
                <Box component="img" src={t.coverImage} alt="" sx={{ width: 84, height: 60, objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a" }}>{t.title}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {t.targetCity}, {t.state} · {t.durationDays} days / {t.durationNights} nights · Base {inr(t.basePriceInr || t.priceInr)}
                  </Typography>
                  {(t.travelStyles || []).length > 0 && (
                    <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                      {t.travelStyles.slice(0, 3).map((s: string) => <Chip key={s} label={s} size="small" sx={{ height: 18, fontSize: "0.65rem", borderRadius: "4px", bgcolor: "#f1f5f9" }} />)}
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  {mine && (
                    <Box sx={{ textAlign: "right" }}>
                      <StatusChip status={mine.status as LaunchStatus} />
                      {LAUNCH_STATUS[mine.status as LaunchStatus].waiting === "partner" && <Typography sx={{ fontSize: "0.66rem", color: "#d97706" }}>Needs your reply</Typography>}
                    </Box>
                  )}
                  {mine && (
                    <Button size="small" variant="outlined" onClick={() => router.push(`/partner/requests/${mine._id}`)} sx={{ borderRadius: "4px" }}>View</Button>
                  )}
                  <Button size="small" variant="contained" disabled={!city || Boolean(blocked)} onClick={() => setActive(t)} sx={{ bgcolor: "#0f172a", borderRadius: "4px", "&:hover": { bgcolor: "#1e293b" } }}>
                    Request this tour
                  </Button>
                </Box>
              </Box>
            );
          })
        )}
      </Paper>

      <LaunchRequestDialog tour={active} city={city} tokenKey={TOKEN} onClose={() => setActive(null)} onCreated={(id) => router.push(`/partner/requests/${id}`)} />
    </Box>
  );
}
