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
  Grid,
  IconButton,
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
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import Link from "next/link";

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const DEPARTMENTS = ["Operations", "Sales & Partnerships", "Customer Experience", "Marketing", "Engineering", "Design", "Finance", "People & Culture"];

const blank = {
  title: "", department: "Operations", location: "", workMode: "onsite", type: "full-time", experience: "", salary: "",
  summary: "", description: "", responsibilities: "", requirements: "", niceToHave: "", openings: 1, status: "draft", closingDate: "",
};
type Form = typeof blank;

const statusStyle: Record<string, [string, string]> = {
  open: ["#ecfdf5", "#047857"],
  draft: ["#f1f5f9", "#64748b"],
  closed: ["#fef2f2", "#dc2626"],
};

export default function AdminCareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/jobs?all=true", { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setJobs(data.data || []);
      else setError(data.error || "Failed to load jobs");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => (filter === "all" || j.status === filter) && (!q || `${j.title} ${j.department} ${j.location}`.toLowerCase().includes(q)));
  }, [jobs, search, filter]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(blank);
    setDialogError(null);
    setOpen(true);
  };
  const openEdit = (j: any) => {
    setEditingId(j._id);
    setForm({
      title: j.title, department: j.department, location: j.location, workMode: j.workMode, type: j.type, experience: j.experience || "",
      salary: j.salary || "", summary: j.summary || "", description: j.description || "",
      responsibilities: (j.responsibilities || []).join("\n"), requirements: (j.requirements || []).join("\n"), niceToHave: (j.niceToHave || []).join("\n"),
      openings: j.openings || 1, status: j.status, closingDate: j.closingDate ? String(j.closingDate).slice(0, 10) : "",
    });
    setDialogError(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDialogError(null);
    try {
      const res = await fetch(editingId ? `/api/jobs/${editingId}` : "/api/jobs", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save");
      setOpen(false);
      load();
    } catch (err: any) {
      setDialogError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (j: any, status: string) => {
    const res = await fetch(`/api/jobs/${j._id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ status }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not update");
    load();
  };

  const remove = async (j: any) => {
    if (!confirm(`Delete the role "${j.title}"?`)) return;
    const res = await fetch(`/api/jobs/${j._id}`, { method: "DELETE", headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not delete");
    load();
  };

  const counts = { open: jobs.filter((j) => j.status === "open").length, newApps: jobs.reduce((n, j) => n + (j.newApplications || 0), 0) };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>Job Openings</Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Roles shown on the public careers page · {counts.open} open{counts.newApps ? ` · ${counts.newApps} new application${counts.newApps === 1 ? "" : "s"}` : ""}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" variant="outlined" component="a" href="/careers" target="_blank" endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />} sx={{ borderRadius: "4px", height: 30, fontSize: "0.78rem" }}>
            View careers page
          </Button>
          <Button variant="contained" size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />} onClick={openCreate}
            sx={{ bgcolor: "#0f172a", color: "#fff", borderRadius: "4px", height: 30, fontSize: "0.78rem", "&:hover": { bgcolor: "#1e293b" } }}>
            Post a Job
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, gap: 1.5, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 0.75 }}>
          {["all", "open", "draft", "closed"].map((v) => (
            <Chip key={v} label={`${v[0].toUpperCase() + v.slice(1)} (${v === "all" ? jobs.length : jobs.filter((j) => j.status === v).length})`} size="small" clickable onClick={() => setFilter(v)}
              sx={{ borderRadius: "4px", fontSize: "0.72rem", fontWeight: 600, bgcolor: filter === v ? "#0f172a" : "#f1f5f9", color: filter === v ? "#fff" : "#475569", "&:hover": { bgcolor: filter === v ? "#1e293b" : "#e2e8f0" } }} />
          ))}
        </Box>
        <TextField size="small" placeholder="Search roles…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
      </Box>

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={24} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Closes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((j) => {
                  const expired = j.status === "open" && j.closingDate && new Date(j.closingDate) < new Date(new Date().setHours(0, 0, 0, 0));
                  const [bg, fg] = statusStyle[j.status] || statusStyle.draft;
                  return (
                    <TableRow key={j._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#0f172a" }}>{j.title}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#64748b", textTransform: "capitalize" }}>{j.type} · {j.workMode}{j.openings > 1 ? ` · ${j.openings} openings` : ""}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{j.department}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{j.location}</TableCell>
                      <TableCell>
                        <Chip component={Link} href="/admin/career-applications" clickable label={`${j.applications || 0}${j.newApplications ? ` · ${j.newApplications} new` : ""}`} size="small"
                          sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: j.newApplications ? "#fff7ed" : "#f1f5f9", color: j.newApplications ? "#c2410c" : "#475569" }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", color: expired ? "#dc2626" : "#64748b", whiteSpace: "nowrap" }}>
                        {j.closingDate ? `${fmt(j.closingDate)}${expired ? " (expired)" : ""}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Chip label={j.status} size="small" sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", fontWeight: 600, textTransform: "capitalize", bgcolor: bg, color: fg }} />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {j.status !== "open" ? (
                          <Button size="small" onClick={() => setStatus(j, "open")} sx={{ fontSize: "0.7rem", color: "#047857" }}>Publish</Button>
                        ) : (
                          <Button size="small" onClick={() => setStatus(j, "closed")} sx={{ fontSize: "0.7rem", color: "#b45309" }}>Close</Button>
                        )}
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(j)} sx={{ color: "#475569", p: 0.5 }}><EditRoundedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => remove(j)} sx={{ color: "#ef4444", p: 0.5 }}><DeleteRoundedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>
                      {jobs.length === 0 ? 'No roles yet. Click "Post a Job" to create your first opening.' : "No roles match your filters"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
        <form onSubmit={save}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>{editingId ? "Edit Job" : "Post a Job"}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {dialogError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>{dialogError}</Alert>}
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 8 }}><TextField label="Job title" required fullWidth size="small" value={form.title} onChange={set("title")} placeholder="e.g. Tour Operations Executive" /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select value={form.department} label="Department" onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
                    {[...new Set([...DEPARTMENTS, form.department])].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField label="Location" required fullWidth size="small" value={form.location} onChange={set("location")} placeholder="e.g. Jaipur, Rajasthan" /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Work mode</InputLabel>
                  <Select value={form.workMode} label="Work mode" onChange={(e) => setForm((f) => ({ ...f, workMode: e.target.value }))}>
                    <MenuItem value="onsite">On-site</MenuItem><MenuItem value="hybrid">Hybrid</MenuItem><MenuItem value="remote">Remote</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Job type</InputLabel>
                  <Select value={form.type} label="Job type" onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    <MenuItem value="full-time">Full-time</MenuItem><MenuItem value="part-time">Part-time</MenuItem><MenuItem value="internship">Internship</MenuItem><MenuItem value="contract">Contract</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}><TextField label="Experience" fullWidth size="small" value={form.experience} onChange={set("experience")} placeholder="e.g. 2–4 years" /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><TextField label="Salary (optional)" fullWidth size="small" value={form.salary} onChange={set("salary")} placeholder="e.g. ₹4–6 LPA" /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><TextField label="Openings" type="number" fullWidth size="small" value={form.openings} onChange={set("openings")} slotProps={{ htmlInput: { min: 1 } }} /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><TextField label="Closing date" type="date" fullWidth size="small" value={form.closingDate} onChange={set("closingDate")} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={form.status} label="Status" onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    <MenuItem value="draft">Draft (hidden)</MenuItem><MenuItem value="open">Open (public)</MenuItem><MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}><TextField label="Short summary" fullWidth size="small" value={form.summary} onChange={set("summary")} helperText="One or two lines shown on the careers list" slotProps={{ htmlInput: { maxLength: 300 } }} /></Grid>
              <Grid size={{ xs: 12 }}><TextField label="About the role" fullWidth multiline minRows={3} size="small" value={form.description} onChange={set("description")} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="Responsibilities" fullWidth multiline minRows={4} size="small" value={form.responsibilities} onChange={set("responsibilities")} helperText="One per line" /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="Requirements" fullWidth multiline minRows={4} size="small" value={form.requirements} onChange={set("requirements")} helperText="One per line" /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField label="Nice to have" fullWidth multiline minRows={4} size="small" value={form.niceToHave} onChange={set("niceToHave")} helperText="One per line" /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setOpen(false)} disabled={saving} sx={{ color: "#64748b" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Job"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
