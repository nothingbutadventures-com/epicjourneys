"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  List,
  ListItemButton,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AddLocationAltRoundedIcon from "@mui/icons-material/AddLocationAltRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { INDIAN_STATES, KNOWN_DESTINATION_COORDINATES } from "@/lib/constants";

const LIMIT = 20;

export interface PickedDestination {
  _id: string;
  name: string;
  state: string;
  addresses?: any[];
}

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/**
 * Searchable destination popup. Searches on the server (debounced) and only ever loads LIMIT results, so it
 * stays fast however many destinations exist. If the place isn't there yet, it can be created on the spot with
 * the basics (name, state, coordinates) and is picked straight away.
 *
 * `single` picks one destination and closes; otherwise cities are toggled on and off (day-by-day timeline).
 */
export default function DestinationPicker({
  open,
  selectedIds,
  onClose,
  onToggle,
  single = false,
  title,
  allowClear = false,
  onClear,
}: {
  open: boolean;
  selectedIds: string[];
  onClose: () => void;
  onToggle: (d: PickedDestination) => void;
  single?: boolean;
  title?: string;
  allowClear?: boolean;
  onClear?: () => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PickedDestination[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // create form
  const [name, setName] = useState("");
  const [state, setState] = useState<string | null>(null);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setCreating(false);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open || creating) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/destinations?all=true&limit=${LIMIT + 1}&search=${encodeURIComponent(q.trim())}`, { headers: authHeaders(), signal: ctrl.signal });
        const data = await res.json();
        if (data.success) setItems((data.data || []).map((d: any) => ({ _id: d._id, name: d.name, state: d.state, addresses: d.addresses })));
      } catch {
        /* aborted or offline — keep the previous list */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [open, q, creating]);

  const more = items.length > LIMIT;
  const shown = items.slice(0, LIMIT);

  const startCreate = () => {
    const known = Object.entries(KNOWN_DESTINATION_COORDINATES).find(([k]) => k.toLowerCase() === q.trim().toLowerCase());
    setName(q.trim());
    setState(known ? known[1].state : null);
    setLat(known ? String(known[1].lat) : "");
    setLng(known ? String(known[1].lng) : "");
    setError(null);
    setCreating(true);
  };

  // Typing a well-known city fills its state and coordinates.
  const onName = (v: string) => {
    setName(v);
    const known = Object.entries(KNOWN_DESTINATION_COORDINATES).find(([k]) => k.toLowerCase() === v.trim().toLowerCase());
    if (known) {
      setState(known[1].state);
      setLat(String(known[1].lat));
      setLng(String(known[1].lng));
    }
  };

  const latN = Number(lat);
  const lngN = Number(lng);
  const validCoords = lat !== "" && lng !== "" && latN >= 6 && latN <= 38 && lngN >= 67 && lngN <= 98; // inside India
  const canCreate = name.trim().length >= 2 && Boolean(state) && validCoords;

  const create = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name: name.trim(), state, coordinates: { lat: latN, lng: lngN } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't create the location");
      const d = data.data;
      onToggle({ _id: d._id, name: d.name, state: d.state, addresses: d.addresses || [] });
      setCreating(false);
      setQ("");
      if (single) onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const heading = useMemo(() => title || (single ? "Select a location" : "Add destinations for this day"), [title, single]);

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>{creating ? "Add a new location" : heading}</DialogTitle>

      {creating ? (
        <>
          <DialogContent sx={{ pt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: "4px" }}>{error}</Alert>}
            <Typography sx={{ fontSize: "0.78rem", color: "#64748b", mb: 1.5 }}>
              Just the basics. You can add starting addresses and a partner later from Destinations.
            </Typography>
            <TextField label="City / place name" required fullWidth size="small" autoFocus value={name} onChange={(e) => onName(e.target.value)} sx={{ mb: 1.5 }} />
            <Autocomplete size="small" options={INDIAN_STATES} value={state} onChange={(_, v) => setState(v)} sx={{ mb: 1.5 }} renderInput={(p) => <TextField {...p} label="State" required />} />
            <Box sx={{ display: "flex", gap: 1.25 }}>
              <TextField label="Latitude" required fullWidth size="small" type="number" value={lat} onChange={(e) => setLat(e.target.value)} slotProps={{ htmlInput: { step: "any" } }} />
              <TextField label="Longitude" required fullWidth size="small" type="number" value={lng} onChange={(e) => setLng(e.target.value)} slotProps={{ htmlInput: { step: "any" } }} />
            </Box>
            <Typography sx={{ mt: 0.75, fontSize: "0.72rem", color: lat !== "" && lng !== "" && !validCoords ? "#dc2626" : "#94a3b8" }}>
              {lat !== "" && lng !== "" && !validCoords ? "These coordinates are outside India. Check them." : "Right-click the place on Google Maps and copy the two numbers. Well-known cities fill in by themselves."}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => setCreating(false)} disabled={saving} sx={{ color: "#64748b", mr: "auto" }}>Back to search</Button>
            <Button variant="contained" disabled={!canCreate || saving} onClick={create} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
              {saving ? "Creating…" : single ? "Create & select" : "Create & add"}
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              size="small"
              placeholder="Search city or state…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment>,
                  endAdornment: loading ? <CircularProgress size={16} /> : undefined,
                },
              }}
            />
            <Box sx={{ mt: 1, border: "1px solid #e2e8f0", borderRadius: "4px", maxHeight: 216, overflowY: "auto" }}>
              <List dense disablePadding>
                {shown.map((d) => (
                  <ListItemButton
                    key={d._id}
                    selected={selectedIds.includes(d._id)}
                    onClick={() => {
                      onToggle(d);
                      if (single) onClose();
                    }}
                    sx={{ py: 0.4, minHeight: 36 }}
                  >
                    <Typography noWrap sx={{ fontSize: "0.82rem", fontWeight: 600, flex: 1 }}>{d.name}</Typography>
                    <Typography noWrap sx={{ fontSize: "0.72rem", color: "#64748b", ml: 1, maxWidth: 140 }}>{d.state}</Typography>
                    {selectedIds.includes(d._id) && <CheckRoundedIcon sx={{ fontSize: 16, color: "#059669", ml: 0.75 }} />}
                  </ListItemButton>
                ))}
                {!loading && shown.length === 0 && (
                  <Typography sx={{ p: 1.5, textAlign: "center", fontSize: "0.78rem", color: "#94a3b8" }}>{q ? `No locations match “${q}”.` : "No locations yet."}</Typography>
                )}
              </List>
            </Box>
            {more && <Typography sx={{ mt: 0.75, fontSize: "0.72rem", color: "#64748b" }}>Showing the first {LIMIT}. Keep typing to narrow the list.</Typography>}
            <Button fullWidth startIcon={<AddLocationAltRoundedIcon />} onClick={startCreate} sx={{ mt: 1.25, textTransform: "none", fontWeight: 700, border: "1px dashed #94a3b8", color: "#0f172a", "&:hover": { bgcolor: "#f8fafc" } }}>
              {q.trim() && !loading && shown.length === 0 ? `Add “${q.trim()}” as a new location` : "Can't find it? Add a new location"}
            </Button>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            {single ? (
              allowClear && selectedIds.length > 0 ? (
                <Button onClick={() => { onClear?.(); onClose(); }} sx={{ color: "#dc2626", mr: "auto" }}>Clear selection</Button>
              ) : <span />
            ) : (
              <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mr: "auto" }}>
                {selectedIds.length ? `${selectedIds.length} selected — tap again to remove` : "Pick one or more cities, in travel order"}
              </Typography>
            )}
            <Button variant={single ? "text" : "contained"} onClick={onClose} sx={single ? { color: "#64748b" } : { bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>{single ? "Cancel" : "Done"}</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
