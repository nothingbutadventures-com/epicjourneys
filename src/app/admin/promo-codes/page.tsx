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
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";

export default function AdminPromoCodesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState<number | "">(10);
  const [minBookingAmount, setMinBookingAmount] = useState(4000);
  const [maxDiscountInr, setMaxDiscountInr] = useState(2500);
  const [usageLimit, setUsageLimit] = useState(100);
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/promo-codes?all=true");
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
      const res = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          value: Number(value),
          minBookingAmount: Number(minBookingAmount),
          maxDiscountInr: Number(maxDiscountInr),
          usageLimit: Number(usageLimit),
          validUntil: validUntil || undefined,
          isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOpenDialog(false);
        setCode("");
        setValue(10);
        setMinBookingAmount(4000);
        setMaxDiscountInr(2500);
        setUsageLimit(100);
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
      await fetch(`/api/promo-codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, codeStr: string) => {
    if (!confirm(`Delete coupon code "${codeStr}"?`)) return;
    try {
      await fetch(`/api/promo-codes/${id}`, { method: "DELETE" });
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
            <ConfirmationNumberRoundedIcon sx={{ fontSize: 22, color: "#0f172a" }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              Promo Codes & Coupons
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Create promotional coupon codes applicable by customers and partners at checkout
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: "4px", px: 2 }}
        >
          Add Promo Code
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Coupon Code</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Discount Rate</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Min Order</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Usage / Cap</TableCell>
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
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "#64748b" }}>
                    No promo codes found. Click "Add Promo Code" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Chip
                        label={item.code}
                        size="small"
                        sx={{
                          bgcolor: "#0f172a",
                          color: "#ffffff",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          borderRadius: "4px",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>
                      {item.discountType === "percentage"
                        ? `${item.value}% OFF (Max ₹${item.maxDiscountInr || "∞"})`
                        : `₹${item.value} FLAT`}
                    </TableCell>
                    <TableCell sx={{ color: "#475569" }}>
                      ₹{item.minBookingAmount?.toLocaleString("en-IN") || 0}
                    </TableCell>
                    <TableCell sx={{ color: "#475569" }}>
                      {item.usageCount || 0} / {item.usageLimit || "∞"}
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
                        onClick={() => handleDelete(item._id, item.code)}
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
            Create Promo Code
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
            <TextField
              label="Promo / Coupon Code"
              placeholder="e.g. EPIC10, WELCOME500"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              fullWidth
              size="small"
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ width: 180 }}>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={discountType}
                  label="Discount Type"
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  sx={{ borderRadius: "4px" }}
                >
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="fixed">Fixed INR (₹)</MenuItem>
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

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Min Booking Amount (₹)"
                type="number"
                value={minBookingAmount}
                onChange={(e) => setMinBookingAmount(Number(e.target.value))}
                fullWidth
                size="small"
              />
              {discountType === "percentage" && (
                <TextField
                  label="Max Discount Cap (₹)"
                  type="number"
                  value={maxDiscountInr}
                  onChange={(e) => setMaxDiscountInr(Number(e.target.value))}
                  fullWidth
                  size="small"
                />
              )}
              <TextField
                label="Usage Limit"
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Expiry Date (Optional)"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
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
              label="Active (Redeemable by passengers & partners)"
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
              disabled={saving || !code || value === ""}
              sx={{ borderRadius: "4px", px: 2.5 }}
            >
              {saving ? <CircularProgress size={18} sx={{ color: "#ffffff" }} /> : "Save Code"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
