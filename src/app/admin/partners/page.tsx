"use client";

import React, { useEffect, useState } from "react";
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
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
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
  partnerDiscountIds: string[];
  commissionPercent: string;
}
const blankForm: PartnerForm = { name: "", companyName: "", email: "", password: "", phone: "", secondaryPhone: "", address: "", notes: "", assignedDestination: "", partnerDiscountIds: [], commissionPercent: "5" };

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [partnerDiscounts, setPartnerDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // partner dialog (create / edit / create-from-request)
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>(blankForm);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, dRes, xRes] = await Promise.all([
        fetch("/api/partners", { headers: authHeaders() }).then((r) => r.json()),
        fetch("/api/destinations?all=true", { headers: authHeaders() }).then((r) => r.json()),
        fetch("/api/discounts?kind=partner&all=true", { headers: authHeaders() }).then((r) => r.json()),
      ]);
      if (pRes.success) setPartners(pRes.data || []);
      else setError(pRes.error || "Failed to load partners");
      if (dRes.success) setDestinations(dRes.data || []);
      if (xRes.success) setPartnerDiscounts(xRes.data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof PartnerForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm);
    setDialogError(null);
    setOpenDialog(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p._id);
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
      partnerDiscountIds: (p.partnerDiscountIds || []).filter(Boolean).map((d: any) => d._id),
      commissionPercent: String(p.commissionPercent ?? 5),
    });
    setDialogError(null);
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

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Destination Partners
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            City-level agents and their contact details
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
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

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Partner</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Assigned Destination</TableCell>
                  <TableCell>Commission</TableCell>
                  <TableCell>Partner Discounts</TableCell>
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
                      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>{partner.commissionPercent ?? 5}%</Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: "#059669" }}>{inr(partner.commissionEarned || 0)} earned</Typography>
                    </TableCell>
                    <TableCell>
                      {(partner.partnerDiscountIds || []).filter(Boolean).length > 0 ? (
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", maxWidth: 220 }}>
                          {partner.partnerDiscountIds.filter(Boolean).map((d: any) => (
                            <Chip key={d._id} label={`${d.name} · ${d.discountType === "percentage" ? `${d.value}%` : `₹${d.value}`}`} size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", fontWeight: 600, bgcolor: d.isActive ? "#fff7ed" : "#f1f5f9", color: d.isActive ? "#c2410c" : "#94a3b8" }} />
                          ))}
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>None</Typography>
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
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>No partners yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create / edit partner */}
      <Dialog open={openDialog} onClose={() => !saving && setOpenDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
            {editingId ? "Edit Partner" : "Create Partner Account"}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {dialogError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>{dialogError}</Alert>}
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
              The partner uses the login email and password to sign in to the Partner Portal.
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Commission (%)"
                  type="number"
                  required
                  fullWidth
                  value={form.commissionPercent}
                  onChange={set("commissionPercent")}
                  slotProps={{ htmlInput: { min: 0, max: 100, step: 0.5 } }}
                  helperText="Share of every booking made for this partner's location"
                />
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
                <FormControl fullWidth size="small">
                  <InputLabel>Partner discounts</InputLabel>
                  <Select
                    multiple
                    value={form.partnerDiscountIds}
                    label="Partner discounts"
                    onChange={(e) => setForm((f) => ({ ...f, partnerDiscountIds: typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value }))}
                    renderValue={(sel) => partnerDiscounts.filter((d) => sel.includes(d._id)).map((d) => d.name).join(", ")}
                  >
                    {partnerDiscounts.length === 0 && <MenuItem disabled>No partner discounts yet — create one under Discounts</MenuItem>}
                    {partnerDiscounts.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name} — {d.discountType === "percentage" ? `${d.value}% off` : `₹${d.value} off`}{d.isActive ? "" : " (disabled)"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" sx={{ color: "#64748b" }}>The partner can pick any attached discount when booking a tour for a customer, on top of the tour&apos;s own discount.</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Internal notes" fullWidth multiline minRows={2} value={form.notes} onChange={set("notes")} helperText="Only visible to admins" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setOpenDialog(false)} disabled={saving} sx={{ color: "#64748b" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Save Partner"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
}
