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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";

export default function AdminPhysicalRatingsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState(2);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/physical-ratings?all=true");
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
      const res = await fetch("/api/physical-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, level, description, isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setOpenDialog(false);
        setName("");
        setLevel(2);
        setDescription("");
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
      await fetch(`/api/physical-ratings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete physical rating "${name}"?`)) return;
    try {
      await fetch(`/api/physical-ratings/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const getLevelColor = (lvl: number) => {
    switch (lvl) {
      case 1:
        return { bg: "#ecfdf5", color: "#047857" };
      case 2:
        return { bg: "#eff6ff", color: "#1d4ed8" };
      case 3:
        return { bg: "#fef3c7", color: "#b45309" };
      case 4:
        return { bg: "#ffedd5", color: "#c2410c" };
      case 5:
        return { bg: "#fee2e2", color: "#b91c1c" };
      default:
        return { bg: "#f1f5f9", color: "#475569" };
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
            <FitnessCenterRoundedIcon sx={{ fontSize: 22, color: "#0f172a" }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              Physical Ratings
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Define activity exertion levels (1 - Relaxed to 5 - Extreme Expedition)
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: "4px", px: 2 }}
        >
          Add Physical Rating
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
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Exertion Level</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Rating Title</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Description / Suitability</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, py: 1.25 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: "#0f172a" }} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: "#64748b" }}>
                    No physical ratings found. Click "Add Physical Rating" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const badge = getLevelColor(item.level);
                  return (
                    <TableRow key={item._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Chip
                          label={`Level ${item.level}`}
                          size="small"
                          sx={{
                            bgcolor: badge.bg,
                            color: badge.color,
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            borderRadius: "4px",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>
                        {item.name}
                      </TableCell>
                      <TableCell sx={{ color: "#64748b", maxWidth: 400 }}>
                        {item.description || "—"}
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
                  );
                })
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
            Add Physical Rating Level
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ width: 140 }}>
                <InputLabel>Level (1-5)</InputLabel>
                <Select
                  value={level}
                  label="Level (1-5)"
                  onChange={(e) => setLevel(Number(e.target.value))}
                  sx={{ borderRadius: "4px" }}
                >
                  <MenuItem value={1}>Level 1</MenuItem>
                  <MenuItem value={2}>Level 2</MenuItem>
                  <MenuItem value={3}>Level 3</MenuItem>
                  <MenuItem value={4}>Level 4</MenuItem>
                  <MenuItem value={5}>Level 5</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Rating Label"
                placeholder="e.g. 2 - Light / Moderate"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Description & Guidance"
              placeholder="e.g. Suitable for most fitness levels, 3-4 hours of relaxed walking daily..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
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
              label="Active (Display in tour creation dropdown)"
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
              disabled={saving || !name}
              sx={{ borderRadius: "4px", px: 2.5 }}
            >
              {saving ? <CircularProgress size={18} sx={{ color: "#ffffff" }} /> : "Save Rating"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
