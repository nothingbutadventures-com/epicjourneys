"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
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
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUSES = ["new", "reviewing", "shortlisted", "interview", "offered", "hired", "rejected"];
const EMAILED = ["shortlisted", "interview", "offered", "rejected"];
const colors: Record<string, [string, string]> = {
  new: ["#eff6ff", "#1d4ed8"], reviewing: ["#f1f5f9", "#475569"], shortlisted: ["#ecfeff", "#0e7490"],
  interview: ["#fffbeb", "#b45309"], offered: ["#f5f3ff", "#6d28d9"], hired: ["#ecfdf5", "#047857"], rejected: ["#fef2f2", "#dc2626"],
};
const chip = (s: string) => {
  const [bg, fg] = colors[s] || colors.new;
  return <Chip label={s} size="small" sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", fontWeight: 600, textTransform: "capitalize", bgcolor: bg, color: fg }} />;
};

export default function AdminCareerApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [active, setActive] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [notify, setNotify] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [a, j] = await Promise.all([
        fetch("/api/applications", { headers: authHeaders() }).then((r) => r.json()),
        fetch("/api/jobs?all=true", { headers: authHeaders() }).then((r) => r.json()),
      ]);
      if (a.success) setApps(a.data || []);
      else setError(a.error || "Failed to load applications");
      if (j.success) setJobs(j.data || []);
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
    return apps.filter(
      (a) =>
        (status === "all" || a.status === status) &&
        (jobFilter === "all" || (jobFilter === "open" ? !a.jobId : String(a.jobId) === jobFilter)) &&
        (!q || `${a.name} ${a.email} ${a.phone} ${a.jobTitle} ${a.currentCompany || ""}`.toLowerCase().includes(q))
    );
  }, [apps, status, jobFilter, search]);

  const openApp = (a: any) => {
    setActive(a);
    setNotes(a.adminNotes || "");
    setNextStatus(a.status);
    setNotify(true);
    setMessage("");
  };

  const patch = async (body: Record<string, unknown>) => {
    if (!active) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${active._id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      setApps((prev) => prev.map((a) => (a._id === active._id ? { ...a, ...data.data } : a)));
      setActive((cur: any) => ({ ...cur, ...data.data }));
      setMessage("");
      setNotice(data.warning || (body.status && body.notify !== false && EMAILED.includes(String(body.status)) ? "Status updated and the candidate was emailed." : "Saved."));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadResume = async (a: any) => {
    const res = await fetch(`/api/applications/${a._id}/resume`, { headers: authHeaders() });
    if (!res.ok) return setError("Could not download the resume.");
    const url = URL.createObjectURL(await res.blob());
    const el = document.createElement("a");
    el.href = url;
    el.download = a.resume?.filename || "resume";
    el.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (a: any) => {
    if (!confirm(`Delete the application from ${a.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/applications/${a._id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) {
      setApps((prev) => prev.filter((x) => x._id !== a._id));
      setActive(null);
    }
  };

  const willEmail = active && nextStatus !== active.status && EMAILED.includes(nextStatus);

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>Applications</Typography>
        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
          Everyone who applied through the careers page · {apps.filter((a) => a.status === "new").length} new
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setNotice(null)}>{notice}</Alert>}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, gap: 1.5, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {["all", ...STATUSES].map((v) => (
            <Chip key={v} label={`${v[0].toUpperCase() + v.slice(1)} (${v === "all" ? apps.length : apps.filter((a) => a.status === v).length})`} size="small" clickable onClick={() => setStatus(v)}
              sx={{ borderRadius: "4px", fontSize: "0.72rem", fontWeight: 600, bgcolor: status === v ? "#0f172a" : "#f1f5f9", color: status === v ? "#fff" : "#475569", "&:hover": { bgcolor: status === v ? "#1e293b" : "#e2e8f0" } }} />
          ))}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel sx={{ fontSize: "0.8rem" }}>Role</InputLabel>
            <Select value={jobFilter} label="Role" onChange={(e) => setJobFilter(e.target.value)}>
              <MenuItem value="all">All roles</MenuItem>
              <MenuItem value="open">Open applications</MenuItem>
              {jobs.map((j) => <MenuItem key={j._id} value={j._id}>{j.title}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" placeholder="Search applicants…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={24} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Experience</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a._id} hover onClick={() => openApp(a)} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#0f172a" }}>{a.name}</Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{a.email} · {a.phone}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>{a.jobTitle}</TableCell>
                    <TableCell sx={{ fontSize: "0.78rem", color: "#475569" }}>
                      {a.experienceYears !== undefined && a.experienceYears !== null ? `${a.experienceYears} yrs` : "—"}
                      {a.currentCompany ? <Typography component="span" sx={{ display: "block", fontSize: "0.7rem", color: "#94a3b8" }}>{a.currentCompany}</Typography> : null}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>{fmt(a.createdAt)}</TableCell>
                    <TableCell>{chip(a.status)}</TableCell>
                    <TableCell align="right"><ChevronRightRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} /></TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>{apps.length === 0 ? "No applications yet" : "No applications match your filters"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Drawer anchor="right" open={Boolean(active)} onClose={() => setActive(null)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 500 }, borderRadius: 0 } } }}>
        {active && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>{active.name}</Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>{active.jobTitle}</Typography>
                <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", mt: 0.5 }}>
                  {chip(active.status)}
                  <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>Applied {fmt(active.createdAt)}</Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setActive(null)}><CloseRoundedIcon fontSize="small" /></IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                  ["Email", active.email], ["Mobile", `+91 ${active.phone}`], ["City", active.city || "—"],
                  ["Current company", active.currentCompany || "—"],
                  ["Experience", active.experienceYears !== undefined && active.experienceYears !== null ? `${active.experienceYears} years` : "—"],
                  ["Notice period", active.noticePeriod || "—"], ["Expected salary", active.expectedSalary || "—"],
                ].map(([l, v]) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={l}>
                    <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>{l}</Typography>
                    <Typography sx={{ fontSize: "0.85rem", wordBreak: "break-word" }}>{v}</Typography>
                  </Grid>
                ))}
                {[["LinkedIn", active.linkedin], ["Portfolio", active.portfolio]].map(([l, v]) => v && (
                  <Grid size={{ xs: 12, sm: 6 }} key={l}>
                    <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>{l}</Typography>
                    <Typography component="a" href={v} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.85rem", color: "#1d4ed8", wordBreak: "break-all" }}>{v}</Typography>
                  </Grid>
                ))}
              </Grid>

              {active.resume?.filename && (
                <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => downloadResume(active)} sx={{ mb: 2, borderRadius: "4px" }}>
                  Download resume ({Math.max(1, Math.round((active.resume.size || 0) / 1024))} KB)
                </Button>
              )}
              {active.coverLetter && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>Cover letter</Typography>
                  <Typography sx={{ fontSize: "0.85rem", whiteSpace: "pre-line" }}>{active.coverLetter}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>Move this application</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select value={nextStatus} label="Status" onChange={(e) => setNextStatus(e.target.value)}>
                  {STATUSES.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}{EMAILED.includes(s) ? " (emails candidate)" : ""}</MenuItem>)}
                </Select>
              </FormControl>
              {willEmail && (
                <>
                  <FormControlLabel control={<Checkbox size="small" checked={notify} onChange={(e) => setNotify(e.target.checked)} />} label={<Typography sx={{ fontSize: "0.82rem" }}>Email {active.name.split(" ")[0]} about this</Typography>} />
                  {notify && (
                    <TextField label={nextStatus === "interview" ? "Interview details (date, time, link / address)" : "Personal note (optional)"} fullWidth multiline minRows={3} size="small" value={message} onChange={(e) => setMessage(e.target.value)} sx={{ mb: 1 }} />
                  )}
                </>
              )}
              <Button variant="contained" size="small" disabled={busy || nextStatus === active.status} onClick={() => patch({ status: nextStatus, notify, message })} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
                {busy ? "Saving…" : willEmail && notify ? "Update & email candidate" : "Update status"}
              </Button>

              <Divider sx={{ my: 2 }} />
              <TextField label="Internal notes" fullWidth multiline minRows={3} size="small" value={notes} onChange={(e) => setNotes(e.target.value)} helperText="Only visible to the hiring team" />
              <Button size="small" sx={{ mt: 1, color: "#0f172a" }} disabled={busy || notes === (active.adminNotes || "")} onClick={() => patch({ adminNotes: notes })}>Save notes</Button>

              {(active.history || []).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>Timeline</Typography>
                  {[...active.history].reverse().map((h: any, i: number) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
                      {chip(h.status)}
                      <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>{fmt(h.at)}{h.emailed ? " · candidate emailed" : ""}</Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
            <Divider />
            <Box sx={{ px: 2.5, py: 1.5, display: "flex", justifyContent: "space-between" }}>
              <Button size="small" component="a" href={`mailto:${active.email}`} sx={{ color: "#0f172a" }}>Email directly</Button>
              <Button size="small" color="error" onClick={() => remove(active)}>Delete</Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
