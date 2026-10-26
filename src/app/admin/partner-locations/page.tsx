"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
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
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export default function AdminPartnerLocationsPage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const dRes = await fetch("/api/destinations?all=true", { headers: authHeaders() }).then((r) => r.json());
      if (dRes.success) setDestinations(dRes.data || []);
      else setError(dRes.error || "Failed to load destinations");
    } catch (e: any) {
      setError(e.message || "Network error loading destinations");
    } finally {
      setLoading(false);
    }
  };

  const visible = destinations.filter((d) =>
    `${d.name} ${d.state} ${d.partnerId?.name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const [openStates, setOpenStates] = useState<Set<string>>(new Set());
  const groups = useMemo(() => {
    const m = new Map<string, any[]>();
    visible.forEach((d) => m.set(d.state, [...(m.get(d.state) || []), d]));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible]);
  const toggleState = (st: string) =>
    setOpenStates((prev) => {
      const n = new Set(prev);
      n.has(st) ? n.delete(st) : n.add(st);
      return n;
    });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Partner Locations
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Open a location for partner requests. It appears on the public Become a Partner page until a partner is assigned
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
                  <TableCell>Assigned Partner</TableCell>
                  <TableCell>Active Tours</TableCell>
                  <TableCell>Open for Partner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map(([st, items]) => {
                  const expanded = Boolean(search.trim()) || openStates.has(st);
                  return (
                  <React.Fragment key={st}>
                  <TableRow hover onClick={() => toggleState(st)} sx={{ cursor: "pointer", bgcolor: "#f8fafc", "& td": { borderBottom: "1px solid #e2e8f0" } }}>
                    <TableCell colSpan={5} sx={{ py: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ExpandMoreRoundedIcon sx={{ fontSize: 20, color: "#475569", transform: expanded ? "none" : "rotate(-90deg)", transition: "transform .15s" }} />
                        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>{st}</Typography>
                        <Chip label={`${items.length} ${items.length === 1 ? "location" : "locations"}`} size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#e2e8f0", color: "#0f172a", fontWeight: 600 }} />
                        {(() => {
                          const tours = items.reduce((n, d) => n + (d.tourCount || 0), 0);
                          const open = items.filter((d) => d.openForPartner && !d.partnerId).length;
                          const assigned = items.filter((d) => d.partnerId).length;
                          const inactive = items.filter((d) => d.isActive === false).length;
                          return (
                            <>
                              <Chip label={`${tours} ${tours === 1 ? "tour" : "tours"}`} size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#f1f5f9", color: "#0f172a", fontWeight: 600 }} />
                              {open > 0 && <Chip label={`${open} open for partner`} size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#dcfce7", color: "#166534", fontWeight: 600 }} />}
                              {assigned > 0 && <Chip label={`${assigned} with partner`} size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#dbeafe", color: "#1e40af", fontWeight: 600 }} />}
                              {items.length - assigned > 0 && <Chip label={`${items.length - assigned} unassigned`} size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#fffbeb", color: "#b45309", fontWeight: 600 }} />}
                              {inactive > 0 && <Chip label={`${inactive} inactive`} size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#f1f5f9", color: "#64748b", fontWeight: 600 }} />}
                            </>
                          );
                        })()}
                      </Box>
                    </TableCell>
                  </TableRow>
                  {expanded && items.map((dest) => (
                  <TableRow key={dest._id} hover sx={{ "&:last-child td": { borderBottom: 0 }, opacity: dest.isActive === false ? 0.6 : 1 }}>
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
                      {dest.partnerId ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8rem" }}>{dest.partnerId.name}</Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.68rem" }}>
                            {dest.partnerId.phone || dest.partnerId.email}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip label="Unassigned" size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#fffbeb", color: "#b45309" }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={`${dest.tourCount || 0} Tours`} size="small" sx={{ borderRadius: "4px", height: 18, fontSize: "0.65rem", bgcolor: "#f1f5f9", color: "#0f172a", fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={dest.partnerId ? "A partner is already assigned" : dest.openForPartner ? "Visible on Become a Partner" : "Internal use only"}>
                        <span>
                          <Switch
                            size="small"
                            checked={Boolean(dest.openForPartner) && !dest.partnerId}
                            disabled={Boolean(dest.partnerId)}
                            onChange={async (e) => {
                              const v = e.target.checked;
                              setDestinations((prev: any[]) => prev.map((x) => (x._id === dest._id ? { ...x, openForPartner: v } : x)));
                              const res = await fetch(`/api/destinations/${dest._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ openForPartner: v }) });
                              if (!res.ok) setDestinations((prev: any[]) => prev.map((x) => (x._id === dest._id ? { ...x, openForPartner: !v } : x)));
                            }}
                          />
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  ))}
                  </React.Fragment>
                  );
                })}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>
                      No locations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

    </Box>
  );
}
