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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?role=${roleFilter}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user account "${name}"?`)) return;
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE", headers: authHeaders() });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleChip = (role: string, staffRole?: string) => {
    switch (role) {
      case "admin":
        return <Chip label={staffRole ? `Staff · ${staffRole}` : "Super Admin"} size="small" sx={{ bgcolor: "#0f172a", color: "#ffffff", fontWeight: 700, borderRadius: "4px" }} />;
      case "partner":
        return <Chip label="Partner" size="small" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, borderRadius: "4px" }} />;
      default:
        return <Chip label="User" size="small" sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 600, borderRadius: "4px" }} />;
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
            <PeopleAltRoundedIcon sx={{ fontSize: 22, color: "#0f172a" }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              All Roles
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Overview and administrative control for Platform Admins, Destination Partners, and Registered Users
          </Typography>
        </Box>

        {/* Role Filter */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Role</InputLabel>
            <Select
              value={roleFilter}
              label="Filter Role"
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ borderRadius: "4px" }}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="admin">Admins</MenuItem>
              <MenuItem value="partner">Partners</MenuItem>
              <MenuItem value="user">Travelers / Users</MenuItem>
            </Select>
          </FormControl>
        </Box>
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
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Assigned Location</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.25 }}>Created</TableCell>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "#64748b" }}>
                    No users found matching filter.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: u.role === "admin" ? "#0f172a" : u.role === "partner" ? "#2563eb" : "#94a3b8",
                            fontSize: "0.75rem",
                            borderRadius: "4px",
                          }}
                        >
                          {u.name?.charAt(0) || "U"}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.82rem" }}>
                            {u.name}
                          </Typography>
                          {u.phone && (
                            <Typography sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                              {u.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "#475569", fontSize: "0.8rem" }}>
                      {u.email}
                    </TableCell>
                    <TableCell>
                      {getRoleChip(u.role, u.adminRoleId?.name)}
                    </TableCell>
                    <TableCell sx={{ color: "#475569", fontSize: "0.8rem" }}>
                      {u.assignedDestination
                        ? `${u.assignedDestination.name} (${u.assignedDestination.state})`
                        : "—"}
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: "0.75rem" }}>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.isActive !== false ? "Active" : "Suspended"}
                        size="small"
                        onClick={() => handleToggleActive(u._id, u.isActive !== false)}
                        sx={{
                          bgcolor: u.isActive !== false ? "#ecfdf5" : "#fee2e2",
                          color: u.isActive !== false ? "#047857" : "#b91c1c",
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {u.role !== "admin" && (
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(u._id, u.name)}
                          sx={{ color: "#94a3b8", "&:hover": { color: "#ef4444" } }}
                        >
                          <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
