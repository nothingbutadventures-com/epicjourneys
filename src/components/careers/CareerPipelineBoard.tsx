"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import FiberNewRoundedIcon from "@mui/icons-material/FiberNewRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Link from "next/link";

export const CAREER_STAGES = [
  { id: "new", label: "New", color: "#2563eb", bg: "#eff6ff" },
  { id: "reviewing", label: "Reviewing", color: "#64748b", bg: "#f1f5f9" },
  { id: "shortlisted", label: "Shortlisted", color: "#0891b2", bg: "#ecfeff" },
  { id: "interview", label: "Interview", color: "#d97706", bg: "#fffbeb" },
  { id: "offered", label: "Offer Sent", color: "#7c3aed", bg: "#f5f3ff" },
  { id: "hired", label: "Hired", color: "#059669", bg: "#ecfdf5" },
  { id: "rejected", label: "Rejected", color: "#e11d48", bg: "#fff1f2" },
];
const EMAILED = ["shortlisted", "interview", "offered", "rejected"];
const stageOf = (id: string) => CAREER_STAGES.find((s) => s.id === id) || CAREER_STAGES[0];

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const fmtDate = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const daysAgo = (d: string | Date) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
const yrs = (a: any) => (a.experienceYears !== undefined && a.experienceYears !== null ? `${a.experienceYears} yrs` : "—");

const filterInit = { search: "", job: "all", department: "all", location: "all", experience: "all", applied: "all", resume: "all" };

export default function CareerPipelineBoard() {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [apps, setApps] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [f, setF] = useState(filterInit);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const [selected, setSelected] = useState<any | null>(null);
  const [tab, setTab] = useState(0);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // Move dialog (shown when the target stage emails the candidate)
  const [move, setMove] = useState<{ app: any; stage: string } | null>(null);
  const [notify, setNotify] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
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

  const jobById = useMemo(() => new Map(jobs.map((j) => [String(j._id), j])), [jobs]);
  const deptOf = (a: any) => (a.jobId ? jobById.get(String(a.jobId))?.department : "") || "";
  const locOf = (a: any) => (a.jobId ? jobById.get(String(a.jobId))?.location : "") || "";

  const options = useMemo(() => {
    const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();
    return { departments: uniq(jobs.map((j) => j.department)), locations: uniq(jobs.map((j) => j.location)) };
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = f.search.trim().toLowerCase();
    return apps.filter((a) => {
      if (q && !`${a.name} ${a.email} ${a.phone} ${a.jobTitle} ${a.currentCompany || ""} ${a.city || ""}`.toLowerCase().includes(q)) return false;
      if (f.job !== "all" && (f.job === "open" ? Boolean(a.jobId) : String(a.jobId) !== f.job)) return false;
      if (f.department !== "all" && deptOf(a) !== f.department) return false;
      if (f.location !== "all" && locOf(a) !== f.location) return false;
      const y = a.experienceYears;
      if (f.experience === "fresher" && !(y === undefined || y === null || y < 1)) return false;
      if (f.experience === "1-3" && !(y >= 1 && y < 3)) return false;
      if (f.experience === "3-5" && !(y >= 3 && y < 5)) return false;
      if (f.experience === "5+" && !(y >= 5)) return false;
      if (f.applied !== "all" && daysAgo(a.createdAt) > Number(f.applied)) return false;
      if (f.resume === "yes" && !a.resume?.filename) return false;
      if (f.resume === "no" && a.resume?.filename) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, f, jobById]);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    CAREER_STAGES.forEach((s) => (g[s.id] = []));
    filtered.forEach((a) => (g[a.status] || g.new).push(a));
    return g;
  }, [filtered]);

  const filtersActive = Object.entries(f).some(([k, v]) => v !== (filterInit as any)[k]);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  // ---- Stage moves ----
  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      setApps((prev) => prev.map((a) => (a._id === id ? { ...a, ...data.data } : a)));
      setSelected((cur: any) => (cur && cur._id === id ? { ...cur, ...data.data } : cur));
      if (body.status) setNotice(data.warning || (body.notify !== false && EMAILED.includes(String(body.status)) ? "Moved — the candidate was emailed." : "Moved."));
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const requestMove = (app: any, stage: string) => {
    if (app.status === stage) return;
    if (EMAILED.includes(stage)) {
      setNotify(true);
      setMessage("");
      setMove({ app, stage });
    } else {
      patch(app._id, { status: stage });
    }
  };

  const confirmMove = async () => {
    if (!move) return;
    const ok = await patch(move.app._id, { status: move.stage, notify, message });
    if (ok) setMove(null);
  };

  const onDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOver(null);
    const app = apps.find((a) => a._id === dragId);
    setDragId(null);
    if (app) requestMove(app, stage);
  };

  const openApp = (a: any) => {
    setSelected(a);
    setNotes(a.adminNotes || "");
    setTab(0);
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
      setSelected(null);
    }
  };

  const exportCsv = () => {
    const rows = [["Name", "Email", "Phone", "Opening", "Stage", "Experience (yrs)", "Current company", "City", "Notice period", "Expected salary", "Applied"]];
    filtered.forEach((a) => rows.push([a.name, a.email, a.phone, a.jobTitle, stageOf(a.status).label, a.experienceYears ?? "", a.currentCompany || "", a.city || "", a.noticePeriod || "", a.expectedSalary || "", fmtDate(a.createdAt)]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    el.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
    el.click();
  };

  const stat = (label: string, value: React.ReactNode, sub: string, icon: React.ReactNode, c: string, bg: string, valueColor = "#0f172a") => (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Paper elevation={0} sx={{ p: 2, borderRadius: "8px", border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{label}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: valueColor, mt: 0.5 }}>{value}</Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>{sub}</Typography>
        </Box>
        <Box sx={{ width: 42, height: 42, borderRadius: "8px", bgcolor: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</Box>
      </Paper>
    </Grid>
  );

  const select = (label: string, key: keyof typeof f, items: [string, string][], min = 150) => (
    <FormControl size="small" sx={{ minWidth: min }}>
      <InputLabel>{label}</InputLabel>
      <Select value={f[key]} label={label} onChange={(e) => set(key)(e.target.value)} sx={{ borderRadius: "6px" }}>
        {items.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
      </Select>
    </FormControl>
  );

  const inInterview = apps.filter((a) => ["shortlisted", "interview", "offered"].includes(a.status)).length;

  return (
    <Box sx={{ width: "100%", pb: 8 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BusinessCenterRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Applications Pipeline</Typography>
            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>Review candidates and move them through hiring, from first look to offer</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <Paper elevation={0} sx={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: "6px", p: 0.35, bgcolor: "#f8fafc" }}>
            {([["kanban", "Kanban Board View", <ViewKanbanRoundedIcon key="k" sx={{ fontSize: 18 }} />], ["table", "Table / List View", <ViewListRoundedIcon key="t" sx={{ fontSize: 18 }} />]] as const).map(([m, tip, icon]) => (
              <Tooltip key={m} title={tip}>
                <IconButton size="small" onClick={() => setViewMode(m)} sx={{ borderRadius: "4px", bgcolor: viewMode === m ? "#fff" : "transparent", color: viewMode === m ? "#0f172a" : "#64748b", boxShadow: viewMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none", px: 1, py: 0.5 }}>{icon}</IconButton>
              </Tooltip>
            ))}
          </Paper>
          <Tooltip title="Refresh pipeline"><IconButton size="small" onClick={load} sx={{ border: "1px solid #e2e8f0", bgcolor: "#fff", borderRadius: "6px" }}><RefreshRoundedIcon sx={{ fontSize: 18, color: "#475569" }} /></IconButton></Tooltip>
          <Tooltip title="Export to CSV"><IconButton size="small" onClick={exportCsv} sx={{ border: "1px solid #e2e8f0", bgcolor: "#fff", borderRadius: "6px" }}><FileDownloadRoundedIcon sx={{ fontSize: 18, color: "#475569" }} /></IconButton></Tooltip>
          <Button component={Link} href="/admin/careers" variant="contained" startIcon={<WorkRoundedIcon />} sx={{ bgcolor: "#0f172a", color: "#fff", fontWeight: 700, fontSize: "0.85rem", borderRadius: "6px", px: 2, py: 0.85, textTransform: "none", "&:hover": { bgcolor: "#1e293b" } }}>
            Job Openings
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {stat("Total Applicants", apps.length, `${filtered.length} match current filters`, <GroupsRoundedIcon />, "#2563eb", "#eff6ff")}
        {stat("Needs Review", grouped.new.length, `${apps.filter((a) => a.status === "new").length} new overall`, <FiberNewRoundedIcon />, "#d97706", "#fffbeb")}
        {stat("In Process", inInterview, "shortlisted · interview · offer", <EventAvailableRoundedIcon />, "#7c3aed", "#f5f3ff")}
        {stat("Hired", apps.filter((a) => a.status === "hired").length, `${jobs.filter((j) => j.status === "open").length} openings live`, <CheckCircleRoundedIcon />, "#059669", "#ecfdf5", "#059669")}
      </Grid>

      <Paper elevation={0} sx={{ p: 1.5, mb: 3, borderRadius: "8px", border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        <TextField size="small" placeholder="Search name, email, phone, company…" value={f.search} onChange={(e) => set("search")(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "#94a3b8", fontSize: 20 }} /></InputAdornment> } }}
          sx={{ flexGrow: 1, minWidth: { xs: "100%", md: 240 }, "& .MuiOutlinedInput-root": { borderRadius: "6px" } }} />
        {select("Opening", "job", [["all", "All Openings"], ["open", "Open applications"], ...jobs.map((j): [string, string] => [j._id, j.title])], 190)}
        {select("Department", "department", [["all", "All Departments"], ...options.departments.map((d): [string, string] => [d, d])], 160)}
        {select("Location", "location", [["all", "All Locations"], ...options.locations.map((d): [string, string] => [d, d])], 150)}
        {select("Experience", "experience", [["all", "Any Experience"], ["fresher", "Fresher (<1 yr)"], ["1-3", "1–3 years"], ["3-5", "3–5 years"], ["5+", "5+ years"]], 150)}
        {select("Applied", "applied", [["all", "Any time"], ["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"]], 130)}
        {select("Resume", "resume", [["all", "Any"], ["yes", "With resume"], ["no", "No resume"]], 120)}
        {filtersActive && <Button size="small" variant="text" onClick={() => setF(filterInit)} sx={{ color: "#ef4444", fontWeight: 600, fontSize: "0.8rem" }}>Reset Filters</Button>}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "6px" }} onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 3, borderRadius: "6px" }} onClose={() => setNotice(null)}>{notice}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress size={36} sx={{ color: "#0f172a" }} /></Box>
      ) : viewMode === "kanban" ? (
        <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 3, minHeight: "70vh", alignItems: "flex-start" }}>
          {CAREER_STAGES.map((stage) => {
            const list = grouped[stage.id] || [];
            const active = dragOver === stage.id;
            return (
              <Box key={stage.id}
                onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onDrop(e, stage.id)}
                sx={{ flex: "0 0 310px", width: 310, bgcolor: active ? "#f1f5f9" : "#f8fafc", borderRadius: "8px", border: active ? `2px dashed ${stage.color}` : "1px solid #e2e8f0", display: "flex", flexDirection: "column", maxHeight: "80vh", transition: "background-color 0.15s ease" }}>
                <Box sx={{ p: 1.5, borderBottom: "1px solid #e2e8f0", bgcolor: "#fff", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", borderTop: `3px solid ${stage.color}` }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>{stage.label}</Typography>
                    <Chip label={list.length} size="small" sx={{ height: 20, fontWeight: 700, fontSize: "0.72rem", bgcolor: stage.bg, color: stage.color, borderRadius: "4px" }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>{list.length} {list.length === 1 ? "candidate" : "candidates"}</Typography>
                </Box>
                <Box sx={{ p: 1.25, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.25, flexGrow: 1 }}>
                  {list.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "6px", bgcolor: "#fff", color: "#94a3b8" }}>
                      <Typography variant="caption" sx={{ display: "block" }}>No candidates in this stage</Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.7rem", opacity: 0.7 }}>Drag cards here</Typography>
                    </Box>
                  ) : list.map((a) => {
                    const age = daysAgo(a.createdAt);
                    return (
                      <Card key={a._id} draggable onDragStart={(e) => { setDragId(a._id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setDragId(null); setDragOver(null); }} onClick={() => openApp(a)}
                        sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "grab", transition: "all 0.15s ease", "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)", borderColor: "#cbd5e1", transform: "translateY(-1px)" }, "&:active": { cursor: "grabbing" } }}>
                        <CardContent sx={{ p: "12px !important" }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a", lineHeight: 1.3 }}>{a.name}</Typography>
                            {a.status === "new" && age <= 2 && <Chip label="New" size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, bgcolor: "#eff6ff", color: "#2563eb", borderRadius: "4px", flexShrink: 0 }} />}
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5, color: "#64748b" }}>
                            <WorkRoundedIcon sx={{ fontSize: 14, color: "#ca8a04" }} />
                            <Typography sx={{ fontSize: "0.78rem", color: "#334155", fontWeight: 600 }} noWrap>{a.jobTitle}</Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1, color: "#475569" }}>
                            <PersonRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} />
                            <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }} noWrap>{a.currentCompany || a.city || a.email}</Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.75, borderTop: "1px dashed #e2e8f0", mb: 1 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a" }}>{yrs(a)}</Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>{a.expectedSalary || "—"}</Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, maxWidth: "60%" }}>
                              <Avatar sx={{ width: 22, height: 22, fontSize: "0.65rem", bgcolor: "#0f172a", color: "#fff", fontWeight: 700, flexShrink: 0 }}>{a.name.slice(0, 1).toUpperCase()}</Avatar>
                              <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.72rem" }} noWrap>{deptOf(a) || "Open application"}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.75, py: 0.35, borderRadius: "4px", bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                              {a.resume?.filename && <AttachFileRoundedIcon sx={{ fontSize: 13, color: "#64748b" }} />}
                              <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b" }}>{age === 0 ? "Today" : `${age}d ago`}</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                {["Applicant", "Contact", "Opening", "Experience", "Stage", "Resume", "Applied"].map((h) => <TableCell key={h} sx={{ fontWeight: 700, color: "#475569", py: 1.5 }}>{h}</TableCell>)}
                <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: "#94a3b8" }}>No applications match your filter criteria.</TableCell></TableRow>
              ) : filtered.map((a) => {
                const st = stageOf(a.status);
                return (
                  <TableRow key={a._id} hover onClick={() => openApp(a)} sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" } }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>{a.name}</Typography>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>{a.currentCompany || a.city || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.82rem", color: "#1e293b" }}>{a.email}</Typography>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>+91 {a.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.85rem", color: "#334155" }}>{a.jobTitle}</Typography>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>{deptOf(a)}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem" }}>{yrs(a)}</TableCell>
                    <TableCell><Chip label={st.label} size="small" sx={{ fontWeight: 700, fontSize: "0.72rem", borderRadius: "4px", bgcolor: st.bg, color: st.color }} /></TableCell>
                    <TableCell>{a.resume?.filename ? <AttachFileRoundedIcon sx={{ fontSize: 16, color: "#059669" }} /> : "—"}</TableCell>
                    <TableCell sx={{ fontSize: "0.82rem", color: "#475569", whiteSpace: "nowrap" }}>{fmtDate(a.createdAt)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Button size="small" variant="outlined" onClick={() => openApp(a)} sx={{ borderRadius: "4px", fontSize: "0.75rem", textTransform: "none", py: 0.3 }}>View</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ================= APPLICATION DETAIL DRAWER ================= */}
      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)} slotProps={{ paper: { sx: { width: { xs: "100%", md: 560, lg: 620 }, p: 3, bgcolor: "#fff" } } }}>
        {selected && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
              <Box>
                <Chip label={selected.jobTitle} size="small" sx={{ mb: 1, fontSize: "0.7rem", fontWeight: 700, borderRadius: "4px", bgcolor: "#f1f5f9" }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.25 }}>{selected.name}</Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>Applied {fmtDate(selected.createdAt)}</Typography>
              </Box>
              <IconButton onClick={() => setSelected(null)} size="small"><CloseRoundedIcon /></IconButton>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", mb: 1 }}>Hiring Stage Progression</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, p: 0.5, bgcolor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                {CAREER_STAGES.map((s) => {
                  const on = selected.status === s.id;
                  return (
                    <Button key={s.id} size="small" disabled={busy} onClick={() => requestMove(selected, s.id)}
                      sx={{ p: 0.5, minWidth: 0, fontSize: "0.64rem", fontWeight: 700, textTransform: "none", borderRadius: "4px", bgcolor: on ? s.color : "transparent", color: on ? "#fff" : "#64748b", "&:hover": { bgcolor: on ? s.color : "#f1f5f9" } }}>
                      {s.label.split(" ")[0]}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
              <Button variant="contained" startIcon={<DownloadRoundedIcon />} disabled={!selected.resume?.filename} onClick={() => downloadResume(selected)}
                sx={{ bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, fontSize: "0.85rem", borderRadius: "6px", flexGrow: 1, "&:hover": { bgcolor: "#eab308" } }}>
                {selected.resume?.filename ? "Download Resume" : "No resume"}
              </Button>
              <Button variant="outlined" size="small" component="a" href={`mailto:${selected.email}`} sx={{ borderRadius: "6px", fontWeight: 700 }}>Email</Button>
              <Button variant="outlined" color="error" size="small" onClick={() => remove(selected)} sx={{ borderRadius: "6px", fontWeight: 700 }}>Delete</Button>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: "1px solid #e2e8f0", mb: 2.5 }}>
              <Tab label="Candidate Overview" sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.85rem" }} />
              <Tab label={`Notes & Timeline (${selected.history?.length || 0})`} sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.85rem" }} />
            </Tabs>

            {tab === 0 && (
              <Box sx={{ overflowY: "auto" }}>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  {[
                    ["Email", selected.email], ["Mobile", `+91 ${selected.phone}`], ["City", selected.city || "—"],
                    ["Current company", selected.currentCompany || "—"], ["Experience", yrs(selected)],
                    ["Notice period", selected.noticePeriod || "—"], ["Expected salary", selected.expectedSalary || "—"],
                    ["Department", deptOf(selected) || "—"],
                  ].map(([l, v]) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={l}>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>{l}</Typography>
                      <Typography sx={{ fontSize: "0.85rem", wordBreak: "break-word" }}>{v}</Typography>
                    </Grid>
                  ))}
                  {[["LinkedIn", selected.linkedin], ["Portfolio", selected.portfolio]].map(([l, v]) => v && (
                    <Grid size={{ xs: 12, sm: 6 }} key={l}>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>{l}</Typography>
                      <Typography component="a" href={v} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.85rem", color: "#1d4ed8", wordBreak: "break-all" }}>{v}</Typography>
                    </Grid>
                  ))}
                </Grid>
                {selected.coverLetter && (
                  <Box>
                    <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>Cover letter</Typography>
                    <Typography sx={{ fontSize: "0.85rem", whiteSpace: "pre-line" }}>{selected.coverLetter}</Typography>
                  </Box>
                )}
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ overflowY: "auto" }}>
                <TextField label="Internal notes" fullWidth multiline minRows={4} size="small" value={notes} onChange={(e) => setNotes(e.target.value)} helperText="Only visible to the hiring team" />
                <Button size="small" sx={{ mt: 1, color: "#0f172a" }} disabled={busy || notes === (selected.adminNotes || "")} onClick={async () => { if (await patch(selected._id, { adminNotes: notes })) setNotice("Notes saved."); }}>Save notes</Button>
                <Divider sx={{ my: 2 }} />
                <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>Timeline</Typography>
                {[...(selected.history || [])].reverse().map((h: any, i: number) => {
                  const st = stageOf(h.status);
                  return (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.75 }}>
                      <Chip label={st.label} size="small" sx={{ fontWeight: 700, fontSize: "0.68rem", height: 20, borderRadius: "4px", bgcolor: st.bg, color: st.color }} />
                      <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>{fmtDate(h.at)}{h.emailed ? " · candidate emailed" : ""}</Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Drawer>

      {/* ================= MOVE DIALOG (emails the candidate) ================= */}
      <Dialog open={Boolean(move)} onClose={() => !busy && setMove(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "8px" } } }}>
        {move && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>Move {move.app.name.split(" ")[0]} to {stageOf(move.stage).label}</DialogTitle>
            <DialogContent>
              <FormControlLabel control={<Checkbox size="small" checked={notify} onChange={(e) => setNotify(e.target.checked)} />} label={<Typography sx={{ fontSize: "0.88rem" }}>Email the candidate about this</Typography>} />
              {notify && (
                <TextField label={move.stage === "interview" ? "Interview details (date, time, link / address)" : "Personal note (optional)"} fullWidth multiline minRows={3} size="small" value={message} onChange={(e) => setMessage(e.target.value)} sx={{ mt: 1 }} />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setMove(null)} disabled={busy} sx={{ color: "#64748b" }}>Cancel</Button>
              <Button variant="contained" onClick={confirmMove} disabled={busy} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
                {busy ? "Saving…" : notify ? "Move & email" : "Move"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
