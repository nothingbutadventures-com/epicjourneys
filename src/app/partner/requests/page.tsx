"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { LAUNCH_STATUS, type LaunchStatus } from "@/lib/launch-shared";
import { StatusChip, authHeaders, fmtDate, fmtDateTime } from "@/components/launch/LaunchParts";

const TOKEN = "epic_partner_token";

export default function PartnerRequestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/launches", { headers: authHeaders(TOKEN) })
      .then((r) => r.json())
      .then((d) => (d.success ? setItems(d.data || []) : setError(d.error || "Failed to load requests")))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const needsReply = items.filter((l) => l.status === "awaiting_partner").length;
  const rows = useMemo(
    () =>
      items.filter((l) => {
        if (filter === "reply") return l.status === "awaiting_partner";
        if (filter === "progress") return ["submitted", "changes_requested", "partner_approved"].includes(l.status);
        if (filter === "live") return l.status === "approved";
        if (filter === "closed") return ["rejected", "withdrawn", "closed"].includes(l.status);
        return true;
      }),
    [items, filter]
  );

  const tabs = [
    ["all", `All (${items.length})`],
    ["reply", `Needs my reply (${needsReply})`],
    ["progress", "With admin"],
    ["live", "Live"],
    ["closed", "Closed"],
  ];

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>My Requests</Typography>
        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>Tours you asked to start from your city, and where each one stands</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>{error}</Alert>}
      {needsReply > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "4px" }}>
          {needsReply} request{needsReply === 1 ? " is" : "s are"} waiting for your confirmation.
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 0.75, mb: 2, flexWrap: "wrap" }}>
        {tabs.map(([k, l]) => (
          <Chip key={k} label={l} clickable onClick={() => setFilter(k)} sx={{ borderRadius: "4px", fontSize: "0.78rem", fontWeight: 600, bgcolor: filter === k ? "#0f172a" : "#fff", color: filter === k ? "#fff" : "#334155", border: "1px solid", borderColor: filter === k ? "#0f172a" : "#e2e8f0", "&:hover": { bgcolor: filter === k ? "#1e293b" : "#f8fafc" } }} />
        ))}
        <Box sx={{ flex: 1 }} />
        <Button size="small" variant="outlined" onClick={() => router.push("/partner/tours")} sx={{ borderRadius: "4px" }}>Browse tours</Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={24} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tour</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((l) => (
                  <TableRow key={l._id} hover onClick={() => router.push(`/partner/requests/${l._id}`)} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{l.tourId?.title}</Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Revision {l.revision}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.78rem" }}>
                      {l.dates.length ? fmtDate(l.dates[0].startDate) : "—"}
                      {l.dates.length > 1 && <Typography component="span" sx={{ fontSize: "0.7rem", color: "#64748b" }}> +{l.dates.length - 1} more</Typography>}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={l.status} />
                      <Typography sx={{ fontSize: "0.66rem", mt: 0.25, color: LAUNCH_STATUS[l.status as LaunchStatus].waiting === "partner" ? "#d97706" : "#94a3b8" }}>
                        {LAUNCH_STATUS[l.status as LaunchStatus].waiting === "partner" ? "Needs your reply" : LAUNCH_STATUS[l.status as LaunchStatus].hint}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.72rem", color: "#64748b", whiteSpace: "nowrap" }}>{fmtDateTime(l.updatedAt)}</TableCell>
                    <TableCell align="right"><ChevronRightRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} /></TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "#94a3b8", fontSize: "0.8rem" }}>No requests here</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
