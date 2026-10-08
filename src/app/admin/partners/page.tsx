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
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [assignedDestination, setAssignedDestination] = useState("");

  useEffect(() => {
    fetchPartnersAndDestinations();
  }, []);

  const fetchPartnersAndDestinations = async () => {
    setLoading(true);
    const token = localStorage.getItem("epic_token");

    try {
      const [partnersRes, destsRes] = await Promise.all([
        fetch("/api/partners", {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }),
        fetch("/api/destinations?all=true"),
      ]);

      const [partnersData, destsData] = await Promise.all([
        partnersRes.json(),
        destsRes.json(),
      ]);

      if (partnersData.success) {
        setPartners(partnersData.data || []);
      }
      if (destsData.success) {
        setDestinations(destsData.data || []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const token = localStorage.getItem("epic_token");

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          assignedDestination: assignedDestination || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOpenDialog(false);
        resetForm();
        fetchPartnersAndDestinations();
      } else {
        setError(data.error || "Failed to create partner account");
      }
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePartner = async (id: string, partnerName: string) => {
    if (!confirm(`Are you sure you want to delete partner "${partnerName}"?`)) return;

    const token = localStorage.getItem("epic_token");
    try {
      const res = await fetch(`/api/partners/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        fetchPartnersAndDestinations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setAssignedDestination("");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Destination Partners
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            City-level agents with individual credentials to manage passenger reservations
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
          Create Partner
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
                  <TableCell>Partner Account</TableCell>
                  <TableCell>Assigned Destination</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Bookings Handled</TableCell>
                  <TableCell>Partner Volume</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "4px",
                            bgcolor: "#f1f5f9",
                            color: "#0f172a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <HandshakeRoundedIcon sx={{ fontSize: 16 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.82rem" }}>
                            {partner.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                            {partner.email} • {partner.phone || "No phone"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {partner.assignedDestination ? (
                        <Chip
                          label={partner.assignedDestination.name}
                          size="small"
                          sx={{
                            borderRadius: "4px",
                            height: 20,
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            bgcolor: "#f1f5f9",
                            color: "#0f172a",
                          }}
                        />
                      ) : (
                        <Chip
                          label="Unassigned"
                          size="small"
                          sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#fffbeb", color: "#b45309" }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", color: "#475569" }}>
                      {partner.assignedDestination?.state || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${partner.stats?.totalBookings || 0} Bookings`}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", borderColor: "#e2e8f0", color: "#0f172a", fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>
                      ₹{(partner.stats?.totalRevenue || 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleDeletePartner(partner._id, partner.name)}
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

      {/* Create Partner Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}
      >
        <form onSubmit={handleCreatePartner}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
            Create Partner Account
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
              The partner uses these credentials to log in to the Partner Portal and book clients.
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Partner Full Name"
                  required
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Contact Phone"
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 94180 12345"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Login Email"
                  type="email"
                  required
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manali.partner@epicjourneys.in"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Password"
                  type="password"
                  required
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned Destination City</InputLabel>
                  <Select
                    value={assignedDestination}
                    label="Assigned Destination City"
                    onChange={(e) => setAssignedDestination(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>-- Select Destination --</em>
                    </MenuItem>
                    {destinations.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name} ({d.state})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              {saving ? "Creating..." : "Save Partner"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
