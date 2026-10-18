"use client";

import React, { useEffect, useState } from "react";
import {
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

const LIMIT = 20;

export interface PickedDestination {
  _id: string;
  name: string;
  state: string;
}

/**
 * Searchable destination popup. Searches on the server (debounced) and only ever loads
 * LIMIT results, so it stays fast however many destinations exist.
 */
export default function DestinationPicker({
  open,
  selectedIds,
  onClose,
  onToggle,
}: {
  open: boolean;
  selectedIds: string[];
  onClose: () => void;
  onToggle: (d: PickedDestination) => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PickedDestination[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("epic_token");
        const res = await fetch(`/api/destinations?all=true&limit=${LIMIT + 1}&search=${encodeURIComponent(q.trim())}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (data.success) setItems((data.data || []).map((d: any) => ({ _id: d._id, name: d.name, state: d.state })));
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
  }, [open, q]);

  const more = items.length > LIMIT;
  const shown = items.slice(0, LIMIT);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: "4px", border: "1px solid #e2e8f0" } } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>Add destinations for this day</DialogTitle>
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
              <ListItemButton key={d._id} selected={selectedIds.includes(d._id)} onClick={() => onToggle(d)} sx={{ py: 0.4, minHeight: 36 }}>
                <Typography noWrap sx={{ fontSize: "0.82rem", fontWeight: 600, flex: 1 }}>{d.name}</Typography>
                <Typography noWrap sx={{ fontSize: "0.72rem", color: "#64748b", ml: 1, maxWidth: 140 }}>{d.state}</Typography>
                {selectedIds.includes(d._id) && <CheckRoundedIcon sx={{ fontSize: 16, color: "#059669", ml: 0.75 }} />}
              </ListItemButton>
            ))}
            {!loading && shown.length === 0 && (
              <Typography sx={{ p: 1.5, textAlign: "center", fontSize: "0.78rem", color: "#94a3b8" }}>No destinations match “{q}”.</Typography>
            )}
          </List>
        </Box>
        {more && (
          <Typography sx={{ mt: 0.75, fontSize: "0.72rem", color: "#64748b" }}>
            Showing the first {LIMIT}. Keep typing to narrow the list.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mr: "auto" }}>
          {selectedIds.length ? `${selectedIds.length} selected — tap again to remove` : "Pick one or more cities, in travel order"}
        </Typography>
        <Button variant="contained" onClick={onClose} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
