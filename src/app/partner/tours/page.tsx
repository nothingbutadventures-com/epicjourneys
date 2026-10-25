"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Autocomplete,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import LaunchRequestDialog from "@/components/launch/LaunchRequestDialog";
import { LAUNCH_STATUS, type LaunchStatus } from "@/lib/launch-shared";
import { StatusChip, authHeaders, inr } from "@/components/launch/LaunchParts";

const TOKEN = "epic_partner_token";
const IN_PROGRESS = ["submitted", "awaiting_partner", "changes_requested", "partner_approved"];

type SortKey = "title" | "durationDays" | "price" | "departures";
const priceOf = (t: any) => t.basePriceInr || t.priceInr || 0;

const initialFilters = { search: "", states: [] as string[], cities: [] as string[], styles: [] as string[], rating: "all", length: "all", minPrice: "", maxPrice: "", show: "all" };

export default function TourRequestPage() {
  const router = useRouter();
  const [tours, setTours] = useState<any[]>([]);
  const [launches, setLaunches] = useState<any[]>([]);
  const [city, setCity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<any | null>(null);

  const [f, setF] = useState(initialFilters);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "title", dir: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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

  // Upcoming dates per tour: total, and how many start from the partner's own city.
  const rowsData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tours.map((t) => {
      const up = (t.departures || []).filter((d: any) => new Date(d.startDate) >= today);
      const mine = up.filter((d: any) => String(d.cityId?._id || d.cityId) === String(city?._id));
      return { t, upcoming: up.length, fromMe: mine.length, req: latestByTour.get(String(t._id)) };
    });
  }, [tours, city, latestByTour]);

  const options = useMemo(() => {
    const uniq = (xs: (string | undefined)[]) => [...new Set(xs.filter(Boolean) as string[])].sort();
    return {
      states: uniq(tours.map((t) => t.state)),
      cities: uniq(tours.map((t) => t.targetCity)),
      styles: uniq(tours.flatMap((t) => t.travelStyles || [])),
      ratings: uniq(tours.map((t) => t.physicalRating)),
    };
  }, [tours]);

  const filtered = useMemo(() => {
    const q = f.search.trim().toLowerCase();
    const min = f.minPrice === "" ? null : Number(f.minPrice);
    const max = f.maxPrice === "" ? null : Number(f.maxPrice);
    const rows = rowsData.filter(({ t, upcoming, fromMe, req }) => {
      if (q && !`${t.title} ${t.targetCity || ""} ${t.state} ${(t.travelStyles || []).join(" ")}`.toLowerCase().includes(q)) return false;
      if (f.states.length && !f.states.includes(t.state)) return false;
      if (f.cities.length && !f.cities.includes(t.targetCity)) return false;
      if (f.styles.length && !f.styles.some((s) => (t.travelStyles || []).includes(s))) return false;
      if (f.rating !== "all" && t.physicalRating !== f.rating) return false;
      if (f.length === "short" && t.durationDays > 4) return false;
      if (f.length === "medium" && (t.durationDays < 5 || t.durationDays > 8)) return false;
      if (f.length === "long" && t.durationDays < 9) return false;
      if (min !== null && priceOf(t) < min) return false;
      if (max !== null && priceOf(t) > max) return false;
      const inProgress = req && IN_PROGRESS.includes(req.status);
      if (f.show === "available" && inProgress) return false;
      if (f.show === "mine" && !req) return false;
      if (f.show === "reply" && req?.status !== "awaiting_partner") return false;
      if (f.show === "live" && req?.status !== "approved") return false;
      if (f.show === "fromMyCity" && fromMe === 0) return false;
      if (f.show === "hasDates" && upcoming === 0) return false;
      return true;
    });
    const val = (r: (typeof rows)[number]) => (sort.key === "title" ? r.t.title.toLowerCase() : sort.key === "durationDays" ? r.t.durationDays : sort.key === "price" ? priceOf(r.t) : r.upcoming);
    rows.sort((a, b) => {
      const x = val(a), y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * (sort.dir === "asc" ? 1 : -1);
    });
    return rows;
  }, [rowsData, f, sort]);

  // Back to the first page whenever the result set changes.
  useEffect(() => setPage(0), [f, sort, rowsPerPage]);

  const activeCount = [f.search, f.states.length, f.cities.length, f.styles.length, f.rating !== "all", f.length !== "all", f.minPrice, f.maxPrice, f.show !== "all"].filter(Boolean).length;
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const sortBy = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const head = (key: SortKey, label: string, align: "left" | "right" = "left") => (
    <TableCell align={align} sortDirection={sort.key === key ? sort.dir : false}>
      <TableSortLabel active={sort.key === key} direction={sort.key === key ? sort.dir : "asc"} onClick={() => sortBy(key)}>{label}</TableSortLabel>
    </TableCell>
  );

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>Tour Request</Typography>
        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
          Find a tour and request to start it from {city?.name || "your city"}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}
      {!loading && !city && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "4px" }}>No city is assigned to your account yet, so you can't request tours. Please contact the admin.</Alert>
      )}

      <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, borderRadius: "4px", border: "1px solid #e2e8f0" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.25 }}>
          <TextField size="small" placeholder="Search title, city, style…" value={f.search} onChange={(e) => set("search", e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
          <Autocomplete multiple size="small" options={options.states} value={f.states} onChange={(_, v) => set("states", v)} limitTags={1} disableCloseOnSelect renderInput={(p) => <TextField {...p} label="State" />} />
          <Autocomplete multiple size="small" options={options.cities} value={f.cities} onChange={(_, v) => set("cities", v)} limitTags={1} disableCloseOnSelect renderInput={(p) => <TextField {...p} label="Target city" />} />
          <Autocomplete multiple size="small" options={options.styles} value={f.styles} onChange={(_, v) => set("styles", v)} limitTags={1} disableCloseOnSelect renderInput={(p) => <TextField {...p} label="Travel style" />} />
          <FormControl size="small">
            <InputLabel>Physical rating</InputLabel>
            <Select value={f.rating} label="Physical rating" onChange={(e) => set("rating", e.target.value)}>
              <MenuItem value="all">Any</MenuItem>
              {options.ratings.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Duration</InputLabel>
            <Select value={f.length} label="Duration" onChange={(e) => set("length", e.target.value)}>
              <MenuItem value="all">Any length</MenuItem>
              <MenuItem value="short">Up to 4 days</MenuItem>
              <MenuItem value="medium">5–8 days</MenuItem>
              <MenuItem value="long">9+ days</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField size="small" label="Min ₹" type="number" value={f.minPrice} onChange={(e) => set("minPrice", e.target.value)} slotProps={{ htmlInput: { min: 0 } }} />
            <TextField size="small" label="Max ₹" type="number" value={f.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} slotProps={{ htmlInput: { min: 0 } }} />
          </Box>
          <FormControl size="small">
            <InputLabel>Show</InputLabel>
            <Select value={f.show} label="Show" onChange={(e) => set("show", e.target.value)}>
              <MenuItem value="all">All tours</MenuItem>
              <MenuItem value="available">Not requested yet</MenuItem>
              <MenuItem value="reply">Needs my reply</MenuItem>
              <MenuItem value="mine">My requests</MenuItem>
              <MenuItem value="live">Live from my city</MenuItem>
              <MenuItem value="fromMyCity">Departs from my city</MenuItem>
              <MenuItem value="hasDates">Has upcoming dates</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.25 }}>
          <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>
            {loading ? "Loading…" : `${filtered.length} of ${tours.length} tour${tours.length === 1 ? "" : "s"}`}
          </Typography>
          <Button size="small" startIcon={<FilterAltOffRoundedIcon sx={{ fontSize: 16 }} />} disabled={activeCount === 0} onClick={() => setF(initialFilters)} sx={{ color: "#0f172a", fontSize: "0.75rem" }}>
            Clear filters{activeCount ? ` (${activeCount})` : ""}
          </Button>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        <TableContainer>
          <Table size="small" sx={{ "& td, & th": { py: 0.75 } }}>
            <TableHead>
              <TableRow>
                {head("title", "Tour")}
                {head("durationDays", "Duration")}
                <TableCell>Style</TableCell>
                <TableCell>Physical</TableCell>
                {head("price", "Base price", "right")}
                {head("departures", "Upcoming dates", "right")}
                <TableCell>My request</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.82rem" }}>No tours match these filters</TableCell></TableRow>
              ) : (
                pageRows.map(({ t, upcoming, fromMe, req }) => {
                  const blocked = req && IN_PROGRESS.includes(req.status);
                  return (
                    <TableRow key={t._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                          <Box component="img" src={t.coverImage} alt="" sx={{ width: 44, height: 30, objectFit: "cover", borderRadius: "3px", flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a", lineHeight: 1.25 }}>{t.title}</Typography>
                            <Typography noWrap sx={{ fontSize: "0.7rem", color: "#64748b", lineHeight: 1.25 }}>{t.targetCity ? `${t.targetCity}, ` : ""}{t.state}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{t.durationDays}D / {t.durationNights}N</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                          {(t.travelStyles || []).slice(0, 2).map((s: string) => <Chip key={s} label={s} size="small" sx={{ height: 18, fontSize: "0.65rem", borderRadius: "4px", bgcolor: "#f1f5f9" }} />)}
                          {(t.travelStyles || []).length > 2 && <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>+{t.travelStyles.length - 2}</Typography>}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", color: "#475569", whiteSpace: "nowrap" }}>{t.physicalRating || "—"}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap" }}>{inr(priceOf(t))}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {upcoming}
                        {fromMe > 0 && <Typography component="span" sx={{ fontSize: "0.68rem", color: "#059669", ml: 0.5 }}>({fromMe} yours)</Typography>}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {req ? (
                          <Box>
                            <StatusChip status={req.status as LaunchStatus} />
                            {LAUNCH_STATUS[req.status as LaunchStatus].waiting === "partner" && <Typography sx={{ fontSize: "0.62rem", color: "#d97706" }}>Needs your reply</Typography>}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {req && <Button size="small" onClick={() => router.push(`/partner/requests/${req._id}`)} sx={{ fontSize: "0.72rem", color: "#0f172a", minWidth: 0 }}>View</Button>}
                        <Button size="small" variant="contained" disabled={!city || Boolean(blocked)} onClick={() => setActive(t)}
                          sx={{ fontSize: "0.72rem", py: 0.25, bgcolor: "#0f172a", borderRadius: "4px", boxShadow: "none", "&:hover": { bgcolor: "#1e293b", boxShadow: "none" } }}>
                          Request
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => setRowsPerPage(Number(e.target.value))} rowsPerPageOptions={[10, 25, 50, 100]} />
      </Paper>

      <LaunchRequestDialog tour={active} city={city} tokenKey={TOKEN} onClose={() => setActive(null)} onCreated={(id) => router.push(`/partner/requests/${id}`)} />
    </Box>
  );
}
