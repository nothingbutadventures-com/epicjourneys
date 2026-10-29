"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import { COUNTRIES, HOME_COUNTRY, INDIAN_STATES, KNOWN_DESTINATION_COORDINATES } from "@/lib/constants";
import { countryOf, groupByCountry, isHome } from "@/lib/location";

interface AddressForm {
  _id?: string;
  label: string;
  address: string;
  landmark: string;
  pincode: string;
  mobile: string;
  secondaryMobile: string;
  mapUrl: string;
}

const blankAddress = (_partner?: any): AddressForm => ({
  label: "",
  address: "",
  landmark: "",
  pincode: "",
  // Left empty on purpose: empty numbers fall back to the city partner's numbers when shown.
  mobile: "",
  secondaryMobile: "",
  mapUrl: "",
});

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export default function AdminLocationsPage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Dialog state (create + edit)
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [country, setCountry] = useState<string>(HOME_COUNTRY);
  const [state, setState] = useState("Himachal Pradesh");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [addresses, setAddresses] = useState<AddressForm[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dRes, pRes] = await Promise.all([
        fetch("/api/destinations?all=true", { headers: authHeaders() }).then((r) => r.json()),
        fetch("/api/partners", { headers: authHeaders() }).then((r) => r.json()),
      ]);
      if (dRes.success) setDestinations(dRes.data || []);
      else setError(dRes.error || "Failed to load destinations");
      if (pRes.success) setPartners(pRes.data || []);
    } catch (e: any) {
      setError(e.message || "Network error loading destinations");
    } finally {
      setLoading(false);
    }
  };

  const selectedPartner = useMemo(() => partners.find((p) => p._id === partnerId) || null, [partners, partnerId]);

  const visible = destinations.filter((d) =>
    `${d.name} ${d.state} ${countryOf(d)} ${d.partnerId?.name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const searching = Boolean(search.trim());
  // Country > state > city for India; country > city for every other country.
  const tree = useMemo(() => groupByCountry(visible), [visible]);
  const toggleKey = (k: string) =>
    setOpenKeys((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCountry(HOME_COUNTRY);
    setState("Himachal Pradesh");
    setLat("");
    setLng("");
    setDescription("");
    setCoverImage("");
    setPartnerId("");
    setIsActive(true);
    setAddresses([]);
    setDialogError(null);
  };

  const openCreate = () => {
    resetForm();
    setOpenDialog(true);
  };

  const openEdit = (d: any) => {
    resetForm();
    setEditingId(d._id);
    setName(d.name || "");
    setCountry(countryOf(d));
    setState(isHome(d.country) ? d.state || "Himachal Pradesh" : "Himachal Pradesh");
    setLat(String(d.coordinates?.lat ?? ""));
    setLng(String(d.coordinates?.lng ?? ""));
    setDescription(d.description || "");
    setCoverImage(d.coverImage || "");
    setPartnerId(d.partnerId?._id || "");
    setIsActive(d.isActive !== false);
    setAddresses(
      (d.addresses || []).map((a: any) => ({
        _id: a._id,
        label: a.label || "",
        address: a.address || "",
        landmark: a.landmark || "",
        pincode: a.pincode || "",
        mobile: a.mobile || "",
        secondaryMobile: a.secondaryMobile || "",
        mapUrl: a.mapUrl || "",
      }))
    );
    setOpenDialog(true);
  };

  const handleCityPreset = (cityName: string) => {
    setName(cityName);
    const preset = KNOWN_DESTINATION_COORDINATES[cityName];
    if (preset) {
      setCountry(HOME_COUNTRY);
      setState(preset.state);
      setLat(preset.lat.toString());
      setLng(preset.lng.toString());
    }
  };

  const updateAddress = (i: number, patch: Partial<AddressForm>) =>
    setAddresses((prev) => prev.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDialogError(null);
    try {
      const res = await fetch(editingId ? `/api/destinations/${editingId}` : "/api/destinations", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          name,
          country: country.trim() || HOME_COUNTRY,
          ...(isHome(country) ? { state } : {}),
          coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
          description,
          coverImage,
          partnerId: partnerId || null,
          isActive,
          addresses,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOpenDialog(false);
        resetForm();
        fetchAll();
      } else {
        setDialogError(data.error || "Failed to save destination");
      }
    } catch (e: any) {
      setDialogError(e.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, destName: string) => {
    if (!confirm(`Are you sure you want to delete destination "${destName}"?`)) return;
    try {
      const res = await fetch(`/api/destinations/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) fetchAll();
      else setError((await res.json()).error || "Could not delete destination");
    } catch (e) {
      console.error(e);
    }
  };

  const cityRow = (dest: any, indent: number) => (
                  <TableRow key={dest._id} hover sx={{ "&:last-child td": { borderBottom: 0 }, opacity: dest.isActive === false ? 0.6 : 1 }}>
                    <TableCell sx={{ pl: indent }}>
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
                            {dest.isActive === false && <Typography component="span" sx={{ ml: 0.75, fontSize: "0.68rem", color: "#94a3b8" }}>inactive</Typography>}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                            {dest.description ? dest.description.substring(0, 42) + "..." : "Indian Destination"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={dest.state} size="small" variant="outlined" sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", borderColor: "#e2e8f0", color: "#334155" }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#475569", fontSize: "0.72rem" }}>
                        {dest.coordinates?.lat?.toFixed(4)}, {dest.coordinates?.lng?.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(dest.addresses || []).length > 0 ? (
                        <Tooltip
                          title={(dest.addresses || []).map((a: any) => a.label).join(" • ")}
                          arrow
                        >
                          <Chip
                            icon={<PlaceRoundedIcon sx={{ fontSize: "13px !important" }} />}
                            label={`${dest.addresses.length} ${dest.addresses.length === 1 ? "address" : "addresses"}`}
                            size="small"
                            sx={{ borderRadius: "4px", height: 20, fontSize: "0.68rem", bgcolor: "#f1f5f9", color: "#0f172a", fontWeight: 600 }}
                          />
                        </Tooltip>
                      ) : (
                        <Chip label="None added" size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#fffbeb", color: "#b45309" }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={`${dest.tourCount || 0} Tours`} size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#f1f5f9", color: "#0f172a", fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(dest)} aria-label="Edit destination" sx={{ color: "#475569", p: 0.5, borderRadius: "4px" }}>
                        <EditRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(dest._id, dest.name)} aria-label="Delete destination" sx={{ color: "#ef4444", p: 0.5, borderRadius: "4px" }}>
                        <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
  );

  const chipSx = { borderRadius: "4px", height: 18, fontSize: "0.65rem", fontWeight: 600 } as const;
  const headerRow = (key: string, label: string, items: any[], open: boolean, level: "country" | "state", extra?: string) => {
    const tours = items.reduce((n, d) => n + (d.tourCount || 0), 0);
    const inactive = items.filter((d) => d.isActive === false).length;
    return (
      <TableRow hover onClick={() => toggleKey(key)} sx={{ cursor: "pointer", bgcolor: level === "country" ? "#f1f5f9" : "#f8fafc", "& td": { borderBottom: "1px solid #e2e8f0" } }}>
        <TableCell colSpan={6} sx={{ py: 1, pl: level === "country" ? 2 : 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ExpandMoreRoundedIcon sx={{ fontSize: 20, color: "#475569", transform: open ? "none" : "rotate(-90deg)", transition: "transform .15s" }} />
            <Typography sx={{ fontWeight: level === "country" ? 800 : 700, fontSize: level === "country" ? "0.9rem" : "0.85rem", color: "#0f172a" }}>{label}</Typography>
            <Chip label={`${items.length} ${items.length === 1 ? "location" : "locations"}`} size="small" sx={{ ...chipSx, bgcolor: "#e2e8f0", color: "#0f172a" }} />
            {extra && <Chip label={extra} size="small" sx={{ ...chipSx, bgcolor: "#e0e7ff", color: "#3730a3" }} />}
            <Chip label={`${tours} ${tours === 1 ? "tour" : "tours"}`} size="small" sx={{ ...chipSx, bgcolor: level === "country" ? "#e2e8f0" : "#f1f5f9", color: "#0f172a" }} />
            {inactive > 0 && <Chip label={`${inactive} inactive`} size="small" sx={{ ...chipSx, bgcolor: "#f1f5f9", color: "#64748b" }} />}
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Destinations
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Departure locations and their starting addresses
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.25 }}>
          <TextField
            size="small"
            placeholder="Search cities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 200 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
            onClick={openCreate}
            sx={{ bgcolor: "#0f172a", color: "#ffffff", borderRadius: "4px", height: 30, fontSize: "0.78rem", "&:hover": { bgcolor: "#1e293b" } }}
          >
            Add Destination
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
                  <TableCell>City & Destination</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Coordinates</TableCell>
                  <TableCell>Starting Addresses</TableCell>
                  <TableCell>Active Tours</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tree.map((c) => {
                  const cKey = `c:${c.country}`;
                  const cOpen = searching || openKeys.has(cKey);
                  const all = c.states.length ? c.states.flatMap((st) => st.items) : c.items;
                  return (
                    <React.Fragment key={cKey}>
                      {headerRow(cKey, c.country, all, cOpen, "country", c.states.length ? `${c.states.length} ${c.states.length === 1 ? "state" : "states"}` : undefined)}
                      {cOpen &&
                        (c.states.length > 0
                          ? c.states.map((st) => {
                              const sKey = `s:${c.country}|${st.state}`;
                              const sOpen = searching || openKeys.has(sKey);
                              return (
                                <React.Fragment key={sKey}>
                                  {headerRow(sKey, st.state, st.items, sOpen, "state")}
                                  {sOpen && st.items.map((d) => cityRow(d, 7))}
                                </React.Fragment>
                              );
                            })
                          : c.items.map((d) => cityRow(d, 4)))}
                    </React.Fragment>
                  );
                })}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>
                      No destinations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add / edit destination */}
      <Dialog
        open={openDialog}
        onClose={() => !saving && setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
            {editingId ? "Edit Destination" : "Add Destination"}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {dialogError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }}>{dialogError}</Alert>}

            {!editingId && isHome(country) && (
              <>
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
              </>
            )}

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Destination / City Name" required fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Manali, Jaipur, Goa" />
              </Grid>
              <Grid size={{ xs: 12, sm: isHome(country) ? 3 : 6 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={COUNTRIES}
                  value={country}
                  onChange={(_, v) => setCountry(v ? String(v) : HOME_COUNTRY)}
                  onInputChange={(_, v, reason) => reason === "input" && setCountry(v)}
                  renderInput={(p) => <TextField {...p} label="Country" required helperText={isHome(country) ? undefined : "Cities sit directly under the country"} />}
                />
              </Grid>
              {isHome(country) && (
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Indian State</InputLabel>
                    <Select value={state} label="Indian State" onChange={(e) => setState(e.target.value)}>
                      {INDIAN_STATES.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Latitude" type="number" slotProps={{ htmlInput: { step: "any" } }} required fullWidth value={lat} onChange={(e) => setLat(e.target.value)} placeholder="32.2432" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Longitude" type="number" slotProps={{ htmlInput: { step: "any" } }} required fullWidth value={lng} onChange={(e) => setLng(e.target.value)} placeholder="77.1892" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Cover Image URL" fullWidth value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://images.unsplash.com/..." />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Description" multiline rows={2} fullWidth value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Scenic highlights, mountain trails, cultural heritage..." />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned Partner</InputLabel>
                  <Select value={partnerId} label="Assigned Partner" onChange={(e) => setPartnerId(e.target.value)}>
                    <MenuItem value=""><em>Unassigned</em></MenuItem>
                    {partners.map((p) => (
                      <MenuItem key={p._id} value={p._id}>
                        {p.name}{p.assignedDestination && p.assignedDestination._id !== editingId ? ` (currently ${p.assignedDestination.name})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {editingId && (
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel control={<Switch size="small" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label={<Typography sx={{ fontSize: "0.82rem" }}>Active</Typography>} />
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 2.5 }} />

            {/* Starting addresses */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Starting addresses</Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Meeting / reporting points in this city. Tour dates pick one of these.
                </Typography>
              </Box>
              <Button size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => setAddresses((a) => [...a, blankAddress(selectedPartner)])} sx={{ borderRadius: "4px" }}>
                Add address
              </Button>
            </Box>

            {addresses.length === 0 && (
              <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8", py: 1 }}>No addresses yet.</Typography>
            )}

            {addresses.map((a, i) => (
              <Box key={a._id || `new-${i}`} sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", p: 1.75, mb: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569" }}>Address {i + 1}</Typography>
                  <IconButton size="small" aria-label="Remove address" onClick={() => setAddresses((prev) => prev.filter((_, j) => j !== i))} sx={{ color: "#dc2626", p: 0.5 }}>
                    <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                <Grid container spacing={1.25}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField label="Name of starting point" required fullWidth value={a.label} onChange={(e) => updateAddress(i, { label: e.target.value })} placeholder="e.g. Kashmere Gate ISBT" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField label="Landmark (optional)" fullWidth value={a.landmark} onChange={(e) => updateAddress(i, { landmark: e.target.value })} placeholder="Near Gate 2, opposite Metro station" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 9 }}>
                    <TextField label="Full address" required fullWidth multiline minRows={2} value={a.address} onChange={(e) => updateAddress(i, { address: e.target.value })} placeholder="Building / street, area, city" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField label="Pincode" fullWidth value={a.pincode} onChange={(e) => updateAddress(i, { pincode: e.target.value })} slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Mobile number"
                      fullWidth
                      value={a.mobile}
                      onChange={(e) => updateAddress(i, { mobile: e.target.value })}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> }, htmlInput: { inputMode: "numeric", maxLength: 12 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Secondary mobile"
                      fullWidth
                      value={a.secondaryMobile}
                      onChange={(e) => updateAddress(i, { secondaryMobile: e.target.value })}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> }, htmlInput: { inputMode: "numeric", maxLength: 12 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Google Maps link" fullWidth value={a.mapUrl} onChange={(e) => updateAddress(i, { mapUrl: e.target.value })} placeholder="https://maps.google.com/..." />
                  </Grid>
                </Grid>
              </Box>
            ))}
            {addresses.length > 0 && (
              <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                {selectedPartner
                  ? `Leave a number empty to show ${selectedPartner.name}'s number (${[selectedPartner.phone, selectedPartner.secondaryPhone].filter(Boolean).join(", ") || "no number added yet"}) to travellers.`
                  : "No partner is assigned to this city, so empty numbers stay empty — add them here or assign a partner."}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setOpenDialog(false)} disabled={saving} sx={{ color: "#64748b" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Save Destination"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
