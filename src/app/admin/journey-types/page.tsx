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
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";

export default function AdminJourneyTypesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journey-types?all=true");
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
      const res = await fetch("/api/journey-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setOpenDialog(false);
        setName("");
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
      await fetch(`/api/journey-types/${id}`, {
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
    if (!confirm(`Delete journey type "${name}"?`)) return;
    try {
      await fetch(`/api/journey-types/${id}`, { method: "DELETE" });
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
            <ExploreRoundedIcon sx={{ fontSize: 22, color: "#0f172a" }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              Journey Types
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Classify tours by group format (Guided Group, Private Journey, Weekend Road Trip, Expedition)
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: "4px", px: 2 }}
        >
          Add Journey Type
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
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Journey Type Name</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Slug</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Description</TableCell>
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
                    No journey types found. Click "Add Journey Type" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.slug}
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#475569",
                          fontFamily: "monospace",
                          fontSize: "0.72rem",
                          borderRadius: "4px",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", maxWidth: 360 }}>
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
            Create Journey Type
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
            <TextField
              label="Type Name"
              placeholder="e.g. Guided Group Tour, Private Family Journey"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Description"
              placeholder="Explain how this journey type is organized..."
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
              label="Active (Available as option during tour creation)"
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
              {saving ? <CircularProgress size={18} sx={{ color: "#ffffff" }} /> : "Save Type"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
