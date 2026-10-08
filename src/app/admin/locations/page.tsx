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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { INDIAN_STATES, KNOWN_DESTINATION_COORDINATES } from "@/lib/constants";

export default function AdminLocationsPage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [state, setState] = useState("Himachal Pradesh");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/destinations?all=true");
      const data = await res.json();
      if (data.success) {
        setDestinations(data.data || []);
      } else {
        setError(data.error || "Failed to load destinations");
      }
    } catch (e: any) {
      setError(e.message || "Network error loading destinations");
    } finally {
      setLoading(false);
    }
  };

  const handleCityPreset = (cityName: string) => {
    setName(cityName);
    const preset = KNOWN_DESTINATION_COORDINATES[cityName];
    if (preset) {
      setState(preset.state);
      setLat(preset.lat.toString());
      setLng(preset.lng.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const token = localStorage.getItem("epic_token");

    try {
      const res = await fetch("/api/destinations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          state,
          coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
          description,
          coverImage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOpenDialog(false);
        resetForm();
        fetchDestinations();
      } else {
        setError(data.error || "Failed to create destination");
      }
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, destName: string) => {
    if (!confirm(`Are you sure you want to delete destination "${destName}"?`)) return;

    const token = localStorage.getItem("epic_token");
    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        fetchDestinations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setName("");
    setState("Himachal Pradesh");
    setLat("");
    setLng("");
    setDescription("");
    setCoverImage("");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Destinations & Cities
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Indian tour departure locations, coordinates and assigned destination partners
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
          onClick={() => setOpenDialog(true)}
          sx={{
            bgcolor: "#0f172a",
            color: "#ffffff",
            borderRadius: "4px",
            height: 30,
            fontSize: "0.78rem",
            "&:hover": { bgcolor: "#1e293b" },
          }}
        >
          Add Destination
        </Button>
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
                  <TableCell>City & Destination</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Coordinates</TableCell>
                  <TableCell>Assigned Partner</TableCell>
                  <TableCell>Active Tours</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {destinations.map((dest) => (
                  <TableRow key={dest._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Box
                          component="img"
                          src={dest.coverImage || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200"}
                          alt={dest.name}
                          sx={{ width: 34, height: 34, borderRadius: "4px", objectFit: "cover" }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.82rem" }}>
                            {dest.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                            {dest.description ? dest.description.substring(0, 42) + "..." : "Indian Destination"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={dest.state}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", borderColor: "#e2e8f0", color: "#334155" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#475569", fontSize: "0.72rem" }}>
                        {dest.coordinates?.lat?.toFixed(4)}, {dest.coordinates?.lng?.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {dest.partnerId ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8rem" }}>
                            {dest.partnerId.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.68rem" }}>
                            {dest.partnerId.email}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip
                          label="Unassigned"
                          size="small"
                          sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#fffbeb", color: "#b45309" }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${dest.tourCount || 0} Tours`}
                        size="small"
                        sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#f1f5f9", color: "#0f172a", fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(dest._id, dest.name)}
                        sx={{ color: "#ef4444", p: 0.5, borderRadius: "4px" }}
                      >
                        <DeleteRoundedIcon fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Destination Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
            Add Indian Destination
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1.5 }}>
              Presets for popular Indian cities (auto-fills state and coordinates):
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, mb: 2.5 }}>
              {Object.keys(KNOWN_DESTINATION_COORDINATES).slice(0, 10).map((city) => (
                <Chip
                  key={city}
                  label={city}
                  size="small"
                  clickable
                  onClick={() => handleCityPreset(city)}
                  sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}
                />
              ))}
            </Box>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Destination / City Name"
                  required
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Manali, Jaipur, Goa"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Indian State</InputLabel>
                  <Select
                    value={state}
                    label="Indian State"
                    onChange={(e) => setState(e.target.value)}
                  >
                    {INDIAN_STATES.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Latitude"
                  type="number"
                  slotProps={{ htmlInput: { step: "any" } }}
                  required
                  fullWidth
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="32.2432"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Longitude"
                  type="number"
                  slotProps={{ htmlInput: { step: "any" } }}
                  required
                  fullWidth
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="77.1892"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Cover Image URL"
                  fullWidth
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Description"
                  multiline
                  rows={2}
                  fullWidth
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Scenic highlights, mountain trails, cultural heritage..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setOpenDialog(false)} sx={{ color: "#64748b" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
            >
              {saving ? "Saving..." : "Save Destination"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
