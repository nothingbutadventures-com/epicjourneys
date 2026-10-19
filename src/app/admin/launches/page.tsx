"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { LAUNCH_STATUS, type LaunchStatus } from "@/lib/launch-shared";
import { StatusChip, authHeaders, fmtDate, fmtDateTime, inr } from "@/components/launch/LaunchParts";

const TOKEN = "epic_token";

const TABS: { key: string; label: string; match: (s: LaunchStatus) => boolean }[] = [
  { key: "action", label: "Needs my action", match: (s) => LAUNCH_STATUS[s].waiting === "admin" },
  { key: "partner", label: "With partner", match: (s) => s === "awaiting_partner" },
  { key: "live", label: "Live", match: (s) => s === "approved" },
  { key: "closed", label: "Closed", match: (s) => ["rejected", "withdrawn", "closed"].includes(s) },
  { key: "all", label: "All", match: () => true },
];

export default function AdminLaunchesPage() {
  const router = useRouter();
  const [launches, setLaunches] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("action");
  const [search, setSearch] = useState("");
  const [tourFilter, setTourFilter] = useState("all");

  // new launch dialog
  const [open, setOpen] = useState(false);
  const [nTour, setNTour] = useState("");
  const [nPartner, setNPartner] = useState("");
  const [nDate, setNDate] = useState("");
  const [nSeats, setNSeats] = useState<number | "">(15);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const h = authHeaders(TOKEN);
      const [l, t, p] = await Promise.all([
        fetch("/api/launches", { headers: h }).then((r) => r.json()),
        fetch("/api/tours?all=true").then((r) => r.json()),
        fetch("/api/partners", { headers: h }).then((r) => r.json()),
      ]);
      if (!l.success) throw new Error(l.error || "Failed to load requests");
      setLaunches(l.data || []);
      setTours(t.data || []);
      setPartners(p.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of TABS) c[t.key] = launches.filter((l) => t.match(l.status)).length;
    return c;
  }, [launches]);

  const rows = useMemo(() => {
    const t = TABS.find((x) => x.key === tab)!;
    const q = search.trim().toLowerCase();
    return launches.filter((l) => {
      if (!t.match(l.status)) return false;
      if (tourFilter !== "all" && String(l.tourId?._id) !== tourFilter) return false;
      if (q && !`${l.tourId?.title} ${l.cityId?.name} ${l.partnerId?.name} ${l.partnerId?.companyName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [launches, tab, search, tourFilter]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDialogError(null);
    try {
      const res = await fetch("/api/launches", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(TOKEN) },
        body: JSON.stringify({ tourId: nTour, partnerId: nPartner, dates: [{ startDate: nDate, seats: Number(nSeats) }] }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not create the request");
      router.push(`/admin/launches/${data.data._id}`);
    } catch (err: any) {
      setDialogError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const eligiblePartners = partners.filter((p) => p.assignedDestination);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>Partner Requests</Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Partner requests to start a tour from their city — review, price, confirm with the partner and approve
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
          onClick={() => { setNTour(""); setNPartner(""); setNDate(""); setNSeats(15); setDialogError(null); setOpen(true); }}
          sx={{ bgcolor: "#0f172a", color: "#fff", borderRadius: "4px", height: 30, fontSize: "0.78rem", "&:hover": { bgcolor: "#1e293b" } }}
        >
          New partner request
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ display: "flex", gap: 0.75, mb: 2, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <Chip
            key={t.key}
            label={`${t.label} (${counts[t.key] || 0})`}
            clickable
            onClick={() => setTab(t.key)}
            sx={{ borderRadius: "4px", fontSize: "0.78rem", fontWeight: 600, bgcolor: tab === t.key ? "#0f172a" : "#fff", color: tab === t.key ? "#fff" : "#334155", border: "1px solid", borderColor: tab === t.key ? "#0f172a" : "#e2e8f0", "&:hover": { bgcolor: tab === t.key ? "#1e293b" : "#f8fafc" } }}
          />
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 1.25, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search tour, city or partner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }}
        />
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel sx={{ fontSize: "0.8rem" }}>Tour</InputLabel>
          <Select value={tourFilter} label="Tour" onChange={(e) => setTourFilter(e.target.value)}>
            <MenuItem value="all">All tours</MenuItem>
            {tours.map((t) => <MenuItem key={t._id} value={String(t._id)}>{t.title}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={24} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tour</TableCell>
                  <TableCell>City & partner</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>City supplement</TableCell>
                  <TableCell>Rev.</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((l) => {
                  const m = LAUNCH_STATUS[l.status as LaunchStatus];
                  return (
                    <TableRow key={l._id} hover onClick={() => router.push(`/admin/launches/${l._id}`)} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a" }} noWrap>{l.tourId?.title}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Base {inr(l.tourId?.basePriceInr)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{l.cityId?.name}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{l.partnerId?.name || "No partner"}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem" }}>
                        {l.dates.length ? fmtDate(l.dates[0].startDate) : "—"}
                        {l.dates.length > 1 && <Typography component="span" sx={{ fontSize: "0.7rem", color: "#64748b" }}> +{l.dates.length - 1} more</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{l.extraPriceInr === null || l.extraPriceInr === undefined ? <span style={{ color: "#94a3b8", fontWeight: 400 }}>Not set</span> : `+${inr(l.extraPriceInr)}`}</TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", color: "#64748b" }}>{l.revision}</TableCell>
                      <TableCell>
                        <StatusChip status={l.status} />
                        {m.waiting === "admin" && <Typography sx={{ fontSize: "0.66rem", color: "#2563eb", mt: 0.25 }}>Your turn</Typography>}
                        {m.waiting === "partner" && <Typography sx={{ fontSize: "0.66rem", color: "#d97706", mt: 0.25 }}>Partner's turn</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.72rem", color: "#64748b", whiteSpace: "nowrap" }}>{fmtDateTime(l.updatedAt)}</TableCell>
                      <TableCell align="right"><ChevronRightRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} /></TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>Nothing here</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
        <form onSubmit={create}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>New Partner Request</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {dialogError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>{dialogError}</Alert>}
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
              Open a request on a partner's behalf. You can fill in the rest on the next screen.
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Tour</InputLabel>
                  <Select value={nTour} label="Tour" onChange={(e) => setNTour(e.target.value)}>
                    {tours.filter((t) => t.isActive).map((t) => <MenuItem key={t._id} value={String(t._id)}>{t.title}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Partner (their city becomes the start & end city)</InputLabel>
                  <Select value={nPartner} label="Partner (their city becomes the start & end city)" onChange={(e) => setNPartner(e.target.value)}>
                    {eligiblePartners.map((p) => <MenuItem key={p._id} value={p._id}>{p.name} — {p.assignedDestination.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField label="First start date" type="date" required fullWidth value={nDate} onChange={(e) => setNDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField label="Travellers (seats)" type="number" required fullWidth value={nSeats} onChange={(e) => setNSeats(e.target.value === "" ? "" : Number(e.target.value))} slotProps={{ htmlInput: { min: 1 } }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setOpen(false)} disabled={saving} sx={{ color: "#64748b" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
              {saving ? "Creating…" : "Create & open"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
