"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const json = { "Content-Type": "application/json" };
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const fmtDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const daysBetween = (a: string, b: string) => Math.round((+new Date(`${b}T00:00:00`) - +new Date(`${a}T00:00:00`)) / 86400000);

const STATUS: Record<string, [string, string, string]> = {
  live: ["Live", "#ecfdf5", "#047857"],
  scheduled: ["Scheduled", "#eff6ff", "#1d4ed8"],
  ended: ["Ended", "#f1f5f9", "#64748b"],
  off: ["Switched off", "#fff7ed", "#c2410c"],
};

const blank = { name: "", travelStyle: "", percentage: "10", startDay: today(), endDay: today(), isActive: true };

export default function SpecialDiscountsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [d, s] = await Promise.all([
        fetch("/api/special-discounts", { headers: authHeaders() }).then((r) => r.json()),
        fetch("/api/travel-styles").then((r) => r.json()),
      ]);
      if (d.success) setItems(d.data || []);
      else setError(d.error || "Failed to load offers");
      if (s.success) setStyles(s.data || []);
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
    const c: Record<string, number> = { all: items.length, live: 0, scheduled: 0, ended: 0, off: 0 };
    items.forEach((i) => (c[i.status] = (c[i.status] || 0) + 1));
    return c;
  }, [items]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => (filter === "all" || i.status === filter) && (!q || `${i.name} ${i.travelStyle}`.toLowerCase().includes(q)));
  }, [items, filter, search]);

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...blank, travelStyle: styles[0]?.name || "" });
    setDialogError(null);
    setOpen(true);
  };
  const openEdit = (i: any) => {
    setEditingId(i._id);
    setForm({ name: i.name || "", travelStyle: i.travelStyle, percentage: String(i.percentage), startDay: i.startDay, endDay: i.endDay, isActive: i.isActive });
    setDialogError(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDialogError(null);
    try {
      const res = await fetch(editingId ? `/api/special-discounts/${editingId}` : "/api/special-discounts", {
        method: editingId ? "PUT" : "POST",
        headers: { ...json, ...authHeaders() },
        body: JSON.stringify({ ...form, percentage: Number(form.percentage) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't save the offer");
      setOpen(false);
      load();
    } catch (err: any) {
      setDialogError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (i: any) => {
    const res = await fetch(`/api/special-discounts/${i._id}`, { method: "PUT", headers: { ...json, ...authHeaders() }, body: JSON.stringify({ isActive: !i.isActive }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Couldn't update the offer");
    load();
  };

  const remove = async (i: any) => {
    if (!confirm(`Delete the ${i.travelStyle} offer (${i.percentage}% off)?`)) return;
    await fetch(`/api/special-discounts/${i._id}`, { method: "DELETE", headers: authHeaders() });
    load();
  };

  const validRange = form.startDay && form.endDay && form.endDay >= form.startDay;
  const pct = Number(form.percentage);
  const canSave = Boolean(form.travelStyle) && pct > 0 && pct <= 100 && validRange;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BoltRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Special Discounts</Typography>
            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>
              Time-limited offers on every tour of a travel style. Customers get the live offer on all dates.
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate} disabled={styles.length === 0} sx={{ bgcolor: "#0f172a", fontWeight: 700, textTransform: "none", borderRadius: "6px", "&:hover": { bgcolor: "#1e293b" } }}>
          New Special Discount
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "6px" }} onClose={() => setError(null)}>{error}</Alert>}

      <Alert severity="info" sx={{ mb: 2, borderRadius: "6px", fontSize: "0.82rem" }}>
        While an offer is live it replaces each date&apos;s own discount for that travel style (tours with several styles get the best offer; offers never stack). When it ends, tours that existed before
        return to the discounts set on their dates, and tours created during the offer go back to no discount.
      </Alert>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, gap: 1.5, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {[["all", "All"], ["live", "Live"], ["scheduled", "Scheduled"], ["ended", "Ended"], ["off", "Switched off"]].map(([v, l]) => (
            <Chip key={v} label={`${l} (${counts[v] || 0})`} size="small" clickable onClick={() => setFilter(v)}
              sx={{ borderRadius: "4px", fontSize: "0.72rem", fontWeight: 600, bgcolor: filter === v ? "#0f172a" : "#f1f5f9", color: filter === v ? "#fff" : "#475569", "&:hover": { bgcolor: filter === v ? "#1e293b" : "#e2e8f0" } }} />
          ))}
        </Box>
        <TextField size="small" placeholder="Search travel style…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
      </Box>

      <Paper elevation={0} sx={{ borderRadius: "8px", border: "1px solid #e2e8f0", bgcolor: "#fff", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={26} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  {["Travel style", "Discount", "Runs", "Tours covered", "Status", "On / Off"].map((h) => <TableCell key={h} sx={{ fontWeight: 700, color: "#475569", py: 1.25 }}>{h}</TableCell>)}
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((i) => {
                  const [label, bg, fg] = STATUS[i.status] || STATUS.ended;
                  const t = today();
                  const note = i.status === "live" ? `Ends in ${daysBetween(t, i.endDay)} day${daysBetween(t, i.endDay) === 1 ? "" : "s"}` : i.status === "scheduled" ? `Starts in ${daysBetween(t, i.startDay)} day${daysBetween(t, i.startDay) === 1 ? "" : "s"}` : "";
                  return (
                    <TableRow key={i._id} hover sx={{ opacity: i.status === "ended" ? 0.65 : 1 }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>{i.travelStyle}</Typography>
                        {i.name && <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>{i.name}</Typography>}
                      </TableCell>
                      <TableCell><Chip label={`${i.percentage}% OFF`} size="small" sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 800, borderRadius: "4px", fontSize: "0.72rem" }} /></TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {fmtDay(i.startDay)} – {fmtDay(i.endDay)}
                        {note && <Typography sx={{ fontSize: "0.68rem", color: "#64748b" }}>{note}</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.82rem" }}>{i.tours}</TableCell>
                      <TableCell><Chip label={label} size="small" sx={{ bgcolor: bg, color: fg, fontWeight: 700, borderRadius: "4px", fontSize: "0.7rem" }} /></TableCell>
                      <TableCell>
                        <Tooltip title={i.isActive ? "Switch off" : "Switch on"}>
                          <span><Switch size="small" checked={i.isActive} onChange={() => toggle(i)} /></span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(i)}><EditRoundedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => remove(i)} sx={{ color: "#ef4444" }}><DeleteRoundedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "#94a3b8", fontSize: "0.85rem" }}>{items.length === 0 ? 'No special discounts yet. Click "New Special Discount" to run an offer on a travel style.' : "No offers match your filters"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "8px" } } }}>
        <form onSubmit={save}>
          <DialogTitle sx={{ fontWeight: 800 }}>{editingId ? "Edit Special Discount" : "New Special Discount"}</DialogTitle>
          <DialogContent>
            {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
            <Grid container spacing={1.75} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Travel style</InputLabel>
                  <Select value={form.travelStyle} label="Travel style" onChange={(e) => setForm((f) => ({ ...f, travelStyle: e.target.value }))}>
                    {styles.map((s) => <MenuItem key={s._id} value={s.name}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField label="Discount (%)" type="number" required fullWidth size="small" value={form.percentage} onChange={set("percentage")} slotProps={{ htmlInput: { min: 1, max: 100, step: 0.5 } }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Offer name (optional)" fullWidth size="small" value={form.name} onChange={set("name")} placeholder="e.g. Winter Trek Sale" slotProps={{ htmlInput: { maxLength: 80 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Starts on" type="date" required fullWidth size="small" value={form.startDay} onChange={set("startDay")} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Ends on (inclusive)" type="date" required fullWidth size="small" value={form.endDay} onChange={set("endDay")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: form.startDay } }} error={Boolean(form.endDay) && !validRange} helperText={form.endDay && !validRange ? "Must be on or after the start date" : undefined} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />} label={<Typography sx={{ fontSize: "0.88rem" }}>Switched on (it runs automatically between the dates)</Typography>} />
              </Grid>
            </Grid>
            <Typography sx={{ mt: 1.5, fontSize: "0.75rem", color: "#64748b" }}>
              Dates are in Indian time. The offer applies to bookings made from the start of the first day until the end of the last day, on every tour that includes this travel style.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)} disabled={saving} sx={{ color: "#64748b" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || !canSave} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Offer"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
