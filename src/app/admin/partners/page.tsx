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
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
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
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const statusChip = (status: string) => {
  const map: Record<string, [string, string, string]> = {
    pending: ["Pending", "#fffbeb", "#d97706"],
    approved: ["Approved", "#ecfdf5", "#059669"],
    rejected: ["Rejected", "#fef2f2", "#dc2626"],
  };
  const [label, bg, fg] = map[status] || map.pending;
  return <Chip label={label} size="small" sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: bg, color: fg }} />;
};

interface PartnerForm {
  name: string;
  companyName: string;
  email: string;
  password: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  notes: string;
  assignedDestination: string;
}
const blankForm: PartnerForm = { name: "", companyName: "", email: "", password: "", phone: "", secondaryPhone: "", address: "", notes: "", assignedDestination: "" };

export default function AdminPartnersPage() {
  const [tab, setTab] = useState<"partners" | "requests">("partners");
  const [partners, setPartners] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // partner dialog (create / edit / create-from-request)
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fromRequestId, setFromRequestId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>(blankForm);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // requests
  const [reqFilter, setReqFilter] = useState("pending");
  const [activeReq, setActiveReq] = useState<any | null>(null);
  const [reqNotes, setReqNotes] = useState("");
  const [reqBusy, setReqBusy] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, dRes, rRes] = await Promise.all([
        fetch("/api/partners", { headers: authHeaders() }).then((r) => r.json()),
        fetch("/api/destinations?all=true", { headers: authHeaders() }).then((r) => r.json()),
        fetch("/api/partner-requests", { headers: authHeaders() }).then((r) => r.json()),
      ]);
      if (pRes.success) setPartners(pRes.data || []);
      else setError(pRes.error || "Failed to load partners");
      if (dRes.success) setDestinations(dRes.data || []);
      if (rRes.success) setRequests(rRes.data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const visibleRequests = useMemo(() => requests.filter((r) => reqFilter === "all" || r.status === reqFilter), [requests, reqFilter]);
  const set = (k: keyof PartnerForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openCreate = () => {
    setEditingId(null);
    setFromRequestId(null);
    setForm(blankForm);
    setDialogError(null);
    setOpenDialog(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p._id);
    setFromRequestId(null);
    setForm({
      name: p.name || "",
      companyName: p.companyName || "",
      email: p.email || "",
      password: "",
      phone: p.phone || "",
      secondaryPhone: p.secondaryPhone || "",
      address: p.address || "",
      notes: p.notes || "",
      assignedDestination: p.assignedDestination?._id || "",
    });
    setDialogError(null);
    setOpenDialog(true);
  };

  /** Turn an application into a partner account (prefilled; admin sets the password). */
  const approveRequest = (r: any) => {
    const matched =
      r.destinationId?._id ||
      destinations.find((d) => d.name.toLowerCase() === String(r.city).toLowerCase() && d.state.toLowerCase() === String(r.state).toLowerCase())?._id ||
      "";
    setEditingId(null);
    setFromRequestId(r._id);
    setForm({
      ...blankForm,
      name: r.name,
      companyName: r.companyName || "",
      email: r.email,
      phone: r.phone,
      secondaryPhone: r.secondaryPhone || "",
      address: r.address || "",
      notes: r.experience || "",
      assignedDestination: matched,
    });
    setDialogError(null);
    setActiveReq(null);
    setOpenDialog(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDialogError(null);
    try {
      const payload: any = { ...form, assignedDestination: form.assignedDestination || null };
      if (editingId && !payload.password) delete payload.password;
      const res = await fetch(editingId ? `/api/partners/${editingId}` : "/api/partners", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save partner");
      if (fromRequestId) {
        await fetch(`/api/partner-requests/${fromRequestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ status: "approved", partnerId: data.data._id }),
        });
        setTab("partners");
      }
      setOpenDialog(false);
      fetchAll();
    } catch (err: any) {
      setDialogError(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePartner = async (id: string, partnerName: string) => {
    if (!confirm(`Are you sure you want to delete partner "${partnerName}"?`)) return;
    try {
      const res = await fetch(`/api/partners/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) fetchAll();
      else setError((await res.json()).error || "Could not delete partner");
    } catch (e) {
      console.error(e);
    }
  };

  const patchRequest = async (id: string, body: Record<string, unknown>) => {
    setReqBusy(true);
    try {
      const res = await fetch(`/api/partner-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      setRequests((prev) => prev.map((r) => (r._id === id ? data.data : r)));
      setActiveReq(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setReqBusy(false);
    }
  };

  const deleteRequest = async (r: any) => {
    if (!confirm(`Delete the request from ${r.name}?`)) return;
    const res = await fetch(`/api/partner-requests/${r._id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) {
      setRequests((prev) => prev.filter((x) => x._id !== r._id));
      setActiveReq(null);
    }
  };

  const openRequest = (r: any) => {
    setActiveReq(r);
    setReqNotes(r.adminNotes || "");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Destination Partners
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            City-level agents, their contact details and incoming location requests
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            component="a"
            href="/become-a-partner"
            target="_blank"
            sx={{ borderRadius: "4px", height: 30, fontSize: "0.78rem" }}
          >
            View public request page
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
            onClick={openCreate}
            sx={{ bgcolor: "#0f172a", color: "#ffffff", borderRadius: "4px", height: 30, fontSize: "0.78rem", "&:hover": { bgcolor: "#1e293b" } }}
          >
            Create Partner
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, minHeight: 36, borderBottom: "1px solid #e2e8f0", "& .MuiTab-root": { minHeight: 36, fontSize: "0.82rem", textTransform: "none", fontWeight: 600 }, "& .MuiTabs-indicator": { bgcolor: "#0f172a" } }}
      >
        <Tab value="partners" label={`Partners (${partners.length})`} />
        <Tab value="requests" label={`Location requests${pendingCount ? ` (${pendingCount} new)` : ""}`} />
      </Tabs>

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={24} />
          </Box>
        ) : tab === "partners" ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Partner</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Assigned Destination</TableCell>
                  <TableCell>Bookings</TableCell>
                  <TableCell>Volume</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: "4px", bgcolor: "#f1f5f9", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <HandshakeRoundedIcon sx={{ fontSize: 16 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.82rem" }}>{partner.name}</Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                            {partner.companyName ? `${partner.companyName} • ` : ""}{partner.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.78rem", color: "#334155" }}>{partner.phone || <span style={{ color: "#94a3b8" }}>No mobile</span>}</Typography>
                      {partner.secondaryPhone && <Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{partner.secondaryPhone}</Typography>}
                    </TableCell>
                    <TableCell>
                      {partner.assignedDestination ? (
                        <Box>
                          <Chip label={partner.assignedDestination.name} size="small" sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: "#f1f5f9", color: "#0f172a" }} />
                          <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8", mt: 0.25 }}>{partner.assignedDestination.state}</Typography>
                        </Box>
                      ) : (
                        <Chip label="Unassigned" size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#fffbeb", color: "#b45309" }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={`${partner.stats?.totalBookings || 0} Bookings`} size="small" variant="outlined" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", borderColor: "#e2e8f0", color: "#0f172a", fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>{inr(partner.stats?.totalRevenue || 0)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(partner)} aria-label="Edit partner" sx={{ color: "#475569", p: 0.5, borderRadius: "4px" }}>
                        <EditRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeletePartner(partner._id, partner.name)} aria-label="Delete partner" sx={{ color: "#ef4444", p: 0.5, borderRadius: "4px" }}>
                        <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {partners.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>No partners yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <>
            <Box sx={{ p: 1.5, display: "flex", gap: 0.75, borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
              {[
                ["pending", "Pending"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
                ["all", "All"],
              ].map(([v, l]) => (
                <Chip
                  key={v}
                  label={`${l} (${v === "all" ? requests.length : requests.filter((r) => r.status === v).length})`}
                  size="small"
                  clickable
                  onClick={() => setReqFilter(v)}
                  sx={{ borderRadius: "4px", fontSize: "0.72rem", fontWeight: 600, bgcolor: reqFilter === v ? "#0f172a" : "#f1f5f9", color: reqFilter === v ? "#fff" : "#475569", "&:hover": { bgcolor: reqFilter === v ? "#1e293b" : "#e2e8f0" } }}
                />
              ))}
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Requested location</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRequests.map((r) => (
                    <TableRow key={r._id} hover onClick={() => openRequest(r)} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#0f172a" }}>{r.name}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{r.companyName || r.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.78rem" }}>{r.phone}</Typography>
                        {r.secondaryPhone && <Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>{r.secondaryPhone}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{r.city}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#64748b" }}>
                          {r.state}{r.destinationId?.partnerId ? " · already has a partner" : ""}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>{fmt(r.createdAt)}</TableCell>
                      <TableCell>{statusChip(r.status)}</TableCell>
                      <TableCell align="right"><ChevronRightRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} /></TableCell>
                    </TableRow>
                  ))}
                  {visibleRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>No requests in this view</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      {/* Create / edit partner */}
      <Dialog open={openDialog} onClose={() => !saving && setOpenDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
            {editingId ? "Edit Partner" : fromRequestId ? "Approve & Create Partner" : "Create Partner Account"}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {dialogError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>{dialogError}</Alert>}
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
              {fromRequestId
                ? "Details come from the request. Set a password to create the login; the request is marked approved."
                : "The partner uses the login email and password to sign in to the Partner Portal."}
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Partner Full Name" required fullWidth value={form.name} onChange={set("name")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Company / Agency (optional)" fullWidth value={form.companyName} onChange={set("companyName")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Login Email" type="email" required fullWidth value={form.email} onChange={set("email")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={editingId ? "New Password (leave blank to keep)" : "Password"}
                  type="password"
                  required={!editingId}
                  fullWidth
                  value={form.password}
                  onChange={set("password")}
                  slotProps={{ htmlInput: { minLength: editingId && !form.password ? undefined : 8 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Mobile number" fullWidth value={form.phone} onChange={set("phone")} placeholder="+91 94180 12345" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Secondary mobile number" fullWidth value={form.secondaryPhone} onChange={set("secondaryPhone")} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Office address" fullWidth multiline minRows={2} value={form.address} onChange={set("address")} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned Destination City</InputLabel>
                  <Select value={form.assignedDestination} label="Assigned Destination City" onChange={(e) => setForm((f) => ({ ...f, assignedDestination: e.target.value }))}>
                    <MenuItem value=""><em>-- Unassigned --</em></MenuItem>
                    {destinations.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name} ({d.state}){d.partnerId && d.partnerId._id !== editingId ? ` — has ${d.partnerId.name}` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Internal notes" fullWidth multiline minRows={2} value={form.notes} onChange={set("notes")} helperText="Only visible to admins" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setOpenDialog(false)} disabled={saving} sx={{ color: "#64748b" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
              {saving ? "Saving..." : editingId ? "Save Changes" : fromRequestId ? "Create & Approve" : "Save Partner"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Request details */}
      <Drawer anchor="right" open={Boolean(activeReq)} onClose={() => setActiveReq(null)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 460 }, borderRadius: 0 } } }}>
        {activeReq && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>{activeReq.name}</Typography>
                <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", mt: 0.5 }}>
                  {statusChip(activeReq.status)}
                  <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>Submitted {fmt(activeReq.createdAt)}</Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setActiveReq(null)}><CloseRoundedIcon fontSize="small" /></IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                  ["Requested location", `${activeReq.city}, ${activeReq.state}`],
                  ["Matches destination", activeReq.destinationId ? `${activeReq.destinationId.name}${activeReq.destinationId.partnerId ? " (already has a partner)" : ""}` : "Not in the list yet"],
                  ["Email", activeReq.email],
                  ["Company / agency", activeReq.companyName || "—"],
                  ["Mobile", activeReq.phone],
                  ["Secondary mobile", activeReq.secondaryPhone || "—"],
                ].map(([l, v]) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={l}>
                    <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>{l}</Typography>
                    <Typography sx={{ fontSize: "0.85rem", wordBreak: "break-word" }}>{v}</Typography>
                  </Grid>
                ))}
              </Grid>
              {[["Address", activeReq.address], ["Experience", activeReq.experience], ["Message", activeReq.message]].map(
                ([l, v]) =>
                  v && (
                    <Box key={l} sx={{ mb: 1.75 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}>{l}</Typography>
                      <Typography sx={{ fontSize: "0.85rem", whiteSpace: "pre-line" }}>{v}</Typography>
                    </Box>
                  )
              )}
              {activeReq.partnerId && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: "4px" }}>
                  A partner account was created from this request.
                </Alert>
              )}
              <Divider sx={{ my: 2 }} />
              <TextField label="Admin notes" fullWidth multiline minRows={3} value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} helperText="Internal only — not shown to the applicant" />
              <Button size="small" sx={{ mt: 1, color: "#0f172a" }} disabled={reqBusy || reqNotes === (activeReq.adminNotes || "")} onClick={() => patchRequest(activeReq._id, { adminNotes: reqNotes })}>
                Save notes
              </Button>
            </Box>
            <Divider />
            <Box sx={{ px: 2.5, py: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {activeReq.status !== "approved" && (
                <Button variant="contained" size="small" onClick={() => approveRequest(activeReq)} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
                  Approve & create partner
                </Button>
              )}
              {activeReq.status === "pending" && (
                <Button size="small" variant="outlined" color="error" disabled={reqBusy} onClick={() => patchRequest(activeReq._id, { status: "rejected" })}>
                  Reject
                </Button>
              )}
              {activeReq.status !== "pending" && (
                <Button size="small" variant="outlined" disabled={reqBusy} onClick={() => patchRequest(activeReq._id, { status: "pending" })}>
                  Reopen
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              <Button size="small" color="error" onClick={() => deleteRequest(activeReq)}>Delete</Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
