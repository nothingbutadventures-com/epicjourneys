"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import PartnerBookingDialog from "@/components/partner/PartnerBookingDialog";
import { isMyCityDeparture, partnerCanBook } from "@/lib/partner-booking";
import { thumbUrl } from "@/lib/images";

const TOKEN = "epic_partner_token";
const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN) : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const unitPrice = (d: any, t: any) => Math.round((d.price ?? t.priceInr) * (1 - (d.discountPercentage || 0) / 100));

type SortKey = "title" | "durationDays" | "price" | "dates";
const initialFilters = { search: "", states: [] as string[], styles: [] as string[], length: "all", maxPrice: "" };

export default function BookTourPage() {
  const [partner, setPartner] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [f, setF] = useState(initialFilters);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "dates", dir: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [booking, setBooking] = useState<any | null>(null);
  const [tabChosen, setTabChosen] = useState(false);

  const city = partner?.assignedDestination;

  useEffect(() => {
    (async () => {
      try {
        const [me, t] = await Promise.all([
          fetch("/api/partners", { headers: authHeaders() }).then((r) => r.json()),
          fetch("/api/tours").then((r) => r.json()),
        ]);
        setPartner(me.data?.[0] || null);
        setTours(t.data || []);
        if (!t.success) throw new Error(t.error);
      } catch (e: any) {
        setError(e.message || "Failed to load tours");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Per tab: the upcoming dates the partner may book for each tour.
  const byTab = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const build = (ok: (d: any) => boolean) =>
      tours
        .map((t) => {
          const dates = (t.departures || []).filter((d: any) => new Date(d.startDate) >= today && ok(d)).sort((a: any, b: any) => +new Date(a.startDate) - +new Date(b.startDate));
          return { t, dates, next: dates[0], from: dates.length ? Math.min(...dates.map((d: any) => unitPrice(d, t))) : 0 };
        })
        .filter((r) => r.dates.length > 0);
    return { mine: build((d) => isMyCityDeparture(d, city?._id)), all: build((d) => partnerCanBook(d, city?._id)) };
  }, [tours, city]);

  // Open on the tab that actually has tours.
  useEffect(() => {
    if (!loading && !tabChosen) {
      setTab(byTab.mine.length > 0 ? "mine" : "all");
      setTabChosen(true);
    }
  }, [loading, tabChosen, byTab]);

  const rowsAll = byTab[tab];
  const options = useMemo(() => {
    const uniq = (xs: (string | undefined)[]) => [...new Set(xs.filter(Boolean) as string[])].sort();
    return { states: uniq(rowsAll.map((r) => r.t.state)), styles: uniq(rowsAll.flatMap((r) => r.t.travelStyles || [])) };
  }, [rowsAll]);

  const filtered = useMemo(() => {
    const q = f.search.trim().toLowerCase();
    const max = f.maxPrice === "" ? null : Number(f.maxPrice);
    const rows = rowsAll.filter(({ t, from }) => {
      if (q && !`${t.title} ${t.targetCity || ""} ${t.state} ${(t.travelStyles || []).join(" ")}`.toLowerCase().includes(q)) return false;
      if (f.states.length && !f.states.includes(t.state)) return false;
      if (f.styles.length && !f.styles.some((s) => (t.travelStyles || []).includes(s))) return false;
      if (f.length === "short" && t.durationDays > 4) return false;
      if (f.length === "medium" && (t.durationDays < 5 || t.durationDays > 8)) return false;
      if (f.length === "long" && t.durationDays < 9) return false;
      if (max !== null && from > max) return false;
      return true;
    });
    const val = (r: (typeof rows)[number]) =>
      sort.key === "title" ? r.t.title.toLowerCase() : sort.key === "durationDays" ? r.t.durationDays : sort.key === "price" ? r.from : +new Date(r.next.startDate);
    rows.sort((a, b) => {
      const x = val(a), y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * (sort.dir === "asc" ? 1 : -1);
    });
    return rows;
  }, [rowsAll, f, sort]);

  useEffect(() => setPage(0), [f, sort, rowsPerPage, tab]);

  const activeCount = [f.search, f.states.length, f.styles.length, f.length !== "all", f.maxPrice].filter(Boolean).length;
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
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>All Tours</Typography>
        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
          Pick a tour and book it for a customer. Your bookings are managed under Bookings.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}
      {!loading && !city && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "4px" }}>No city is assigned to your account yet, so only each tour&apos;s own dates are available. Contact the admin to get a city assigned.</Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1.5, minHeight: 38, borderBottom: "1px solid #e2e8f0", "& .MuiTab-root": { minHeight: 38, textTransform: "none", fontWeight: 700, fontSize: "0.85rem" }, "& .MuiTabs-indicator": { bgcolor: "#0f172a" } }}>
        <Tab value="mine" label={`From my city${city ? ` (${city.name})` : ""} · ${byTab.mine.length}`} />
        <Tab value="all" label={`All tours · ${byTab.all.length}`} />
      </Tabs>
      <Typography sx={{ mb: 1.5, fontSize: "0.75rem", color: "#64748b" }}>
        {tab === "mine"
          ? "Tours launched from your city after admin approval."
          : "Every tour's own joining / leaving dates, plus the dates from your city. Other partners' city departures can't be booked."}
      </Typography>

      <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, borderRadius: "4px", border: "1px solid #e2e8f0" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 1.25 }}>
          <TextField size="small" placeholder="Search title, city, style…" value={f.search} onChange={(e) => set("search", e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
          <Autocomplete multiple size="small" options={options.states} value={f.states} onChange={(_, v) => set("states", v)} limitTags={1} disableCloseOnSelect renderInput={(p) => <TextField {...p} label="State" />} />
          <Autocomplete multiple size="small" options={options.styles} value={f.styles} onChange={(_, v) => set("styles", v)} limitTags={1} disableCloseOnSelect renderInput={(p) => <TextField {...p} label="Travel style" />} />
          <FormControl size="small">
            <InputLabel>Duration</InputLabel>
            <Select value={f.length} label="Duration" onChange={(e) => set("length", e.target.value)}>
              <MenuItem value="all">Any length</MenuItem>
              <MenuItem value="short">Up to 4 days</MenuItem>
              <MenuItem value="medium">5–8 days</MenuItem>
              <MenuItem value="long">9+ days</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label="Max price (₹)" type="number" value={f.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} slotProps={{ htmlInput: { min: 0 } }} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.25 }}>
          <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>{loading ? "Loading…" : `${filtered.length} of ${rowsAll.length} tour${rowsAll.length === 1 ? "" : "s"}`}</Typography>
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
                {head("dates", "Next date")}
                <TableCell align="right">Bookable dates</TableCell>
                {head("price", "From (per person)", "right")}
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.82rem" }}>
                    {rowsAll.length === 0
                      ? tab === "mine"
                        ? "No tours are running from your city yet. Check the All tours tab or request a tour from Tour Requests."
                        : "No tours have upcoming bookable dates right now."
                      : "No tours match these filters"}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map(({ t, dates, next, from }) => {
                  const mineCount = dates.filter((d: any) => isMyCityDeparture(d, city?._id)).length;
                  return (
                    <TableRow key={t._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                          <Box component="img" src={thumbUrl(t.coverImage)} alt="" sx={{ width: 44, height: 30, objectFit: "cover", borderRadius: "3px", flexShrink: 0 }} />
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
                      <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{fmt(next.startDate)} – {fmt(next.endDate)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {dates.length}
                        {tab === "all" && mineCount > 0 && <Typography component="span" sx={{ fontSize: "0.68rem", color: "#059669", ml: 0.5 }}>({mineCount} yours)</Typography>}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap" }}>{inr(from)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="contained" onClick={() => setBooking(t)}
                          sx={{ fontSize: "0.72rem", py: 0.25, bgcolor: "#0f172a", borderRadius: "4px", boxShadow: "none", "&:hover": { bgcolor: "#1e293b", boxShadow: "none" } }}>
                          Book Now
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

      <PartnerBookingDialog open={Boolean(booking)} onClose={() => setBooking(null)} tour={booking} mode={tab} partner={partner} onBooked={() => {}} />
    </Box>
  );
}
