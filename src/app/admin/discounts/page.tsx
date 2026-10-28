"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export default function AdminDiscountsPage() {
  const [tab, setTab] = useState<"all" | "normal" | "partner">("all");
  const [kind, setKind] = useState<"normal" | "partner">("normal");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState<number | "">(10);
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

  const shown = items.filter((i) => tab === "all" || (tab === "partner" ? i.kind === "partner" : i.kind !== "partner"));

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discounts?all=true&kind=all", { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          kind,
          name,
          discountType,
          value: Number(value),
          description,
          validUntil: validUntil || undefined,
          isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOpenDialog(false);
        setName("");
        setValue(10);
        setDescription("");
        setValidUntil("");
        setIsActive(true);
        fetchItems();
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/discounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete discount offer "${name}"? It will also be removed from any partner it is attached to.`)) return;
    try {
      await fetch(`/api/discounts/${id}`, { method: "DELETE", headers: authHeaders() });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <PercentRoundedIcon sx={{ fontSize: 22, color: "#0f172a" }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              Special Discount
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Normal discounts go on tour dates. Partner discounts are attached to partners, who can apply them on top when booking for a customer
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => { setKind(tab === "partner" ? "partner" : "normal"); setOpenDialog(true); }}
          sx={{ borderRadius: "4px", px: 2 }}
        >
          Add Discount
        </Button>
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
        <Tab value="all" label={`All (${items.length})`} />
        <Tab value="normal" label={`Normal (${items.filter((i) => i.kind !== "partner").length})`} />
        <Tab value="partner" label={`Partner (${items.filter((i) => i.kind === "partner").length})`} />
      </Tabs>

      {/* Table Paper */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "4px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Discount Name</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Reduction</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Valid Until</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, py: 1.25 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: "#0f172a" }} />
                  </TableCell>
                </TableRow>
              ) : shown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "#64748b" }}>
                    No discounts found. Click "Add Discount" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                shown.map((item) => (
                  <TableRow key={item._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>
                      {item.name}
                    </TableCell>
                    <TableCell>
                      {item.kind === "partner" ? (
                        <Chip label={`Partner · ${item.assignedPartners || 0} assigned`} size="small" sx={{ bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 700, fontSize: "0.7rem", borderRadius: "4px" }} />
                      ) : (
                        <Chip label="Normal" size="small" sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: "0.7rem", borderRadius: "4px" }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          item.discountType === "percentage"
                            ? `${item.value}% OFF`
                            : `₹${item.value} FLAT`
                        }
                        size="small"
                        sx={{
                          bgcolor: "#eff6ff",
                          color: "#1d4ed8",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          borderRadius: "4px",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", maxWidth: 300 }}>
                      {item.description || "—"}
                    </TableCell>
                    <TableCell sx={{ color: "#475569", fontSize: "0.75rem" }}>
                      {item.validUntil
                        ? new Date(item.validUntil).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "No Expiry"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.isActive ? "Active" : "Disabled"}
                        size="small"
                        onClick={() => handleToggleActive(item._id, item.isActive)}
                        sx={{
                          bgcolor: item.isActive ? "#ecfdf5" : "#f1f5f9",
                          color: item.isActive ? "#047857" : "#64748b",
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item._id, item.name)}
                        sx={{ color: "#94a3b8", "&:hover": { color: "#ef4444" } }}
                      >
                        <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px" } } }}
      >
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 800, color: "#0f172a", pb: 1 }}>
            {kind === "partner" ? "Create Partner Discount" : "Create Tour Discount"}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
            <TextField
              label="Discount Title"
              placeholder="e.g. Early Bird Summer Special 10%"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              size="small"
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Discount for</InputLabel>
              <Select value={kind} label="Discount for" onChange={(e) => setKind(e.target.value as any)} sx={{ borderRadius: "4px" }}>
                <MenuItem value="normal">Normal — tour dates, everyone</MenuItem>
                <MenuItem value="partner">Partner — attached to partners, applied on top when they book</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ width: 180 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={discountType}
                  label="Type"
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  sx={{ borderRadius: "4px" }}
                >
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="fixed">{kind === "partner" ? "Flat ₹ off the booking" : "Fixed INR (₹)"}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={discountType === "percentage" ? "Percentage Value (%)" : "Flat Amount (₹)"}
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                required
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Valid Until (Optional)"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              size="small"
            />

            <TextField
              label="Description"
              placeholder="Eligibility conditions or terms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  size="small"
                />
              }
              label={kind === "partner" ? "Active (partners can use it)" : "Active (Display in tour discount selector)"}
              sx={{ color: "#334155" }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setOpenDialog(false)} sx={{ color: "#64748b", borderRadius: "4px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving || !name || value === "" || Number(value) <= 0 || (discountType === "percentage" && Number(value) > 100)}
              sx={{ borderRadius: "4px", px: 2.5 }}
            >
              {saving ? <CircularProgress size={18} sx={{ color: "#ffffff" }} /> : "Save Discount"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
