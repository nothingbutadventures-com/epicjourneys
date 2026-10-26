"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import { PERMISSIONS, PERMISSION_GROUPS } from "@/lib/permissions";

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const json = { "Content-Type": "application/json" };
const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const initials = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();

export default function RoleManagementPage() {
  const [tab, setTab] = useState<"roles" | "staff">("roles");
  const [roles, setRoles] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [supers, setSupers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // role dialog
  const [roleOpen, setRoleOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [permSearch, setPermSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [candidate, setCandidate] = useState<any | null>(null);
  const [assignRole, setAssignRole] = useState("");

  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([
        fetch("/api/roles", { headers: authHeaders() }).then((x) => x.json()),
        fetch("/api/staff", { headers: authHeaders() }).then((x) => x.json()),
      ]);
      if (r.success) setRoles(r.data || []);
      else setError(r.error || "Failed to load roles");
      if (s.success) {
        setStaff(s.data.staff || []);
        setSupers(s.data.supers || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // Debounced search of users from the database.
  useEffect(() => {
    if (!assignOpen || q.trim().length < 2) {
      setCandidates([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/staff?q=${encodeURIComponent(q.trim())}`, { headers: authHeaders() }).then((x) => x.json());
        if (res.success) setCandidates(res.data.candidates || []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, assignOpen]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setPerms(new Set());
    setPermSearch("");
    setDialogError(null);
    setRoleOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    setName(r.name);
    setDescription(r.description || "");
    setPerms(new Set(r.permissions || []));
    setPermSearch("");
    setDialogError(null);
    setRoleOpen(true);
  };

  const toggle = (key: string) =>
    setPerms((p) => {
      const n = new Set(p);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  const toggleGroup = (group: string, on: boolean) =>
    setPerms((p) => {
      const n = new Set(p);
      PERMISSIONS.filter((x) => x.group === group).forEach((x) => (on ? n.add(x.key) : n.delete(x.key)));
      return n;
    });

  const visibleGroups = useMemo(() => {
    const s = permSearch.trim().toLowerCase();
    return PERMISSION_GROUPS.map((g) => ({ group: g, items: PERMISSIONS.filter((p) => p.group === g && (!s || `${p.label} ${p.group} ${p.hint || ""}`.toLowerCase().includes(s))) })).filter((g) => g.items.length);
  }, [permSearch]);

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDialogError(null);
    try {
      const res = await fetch(editing ? `/api/roles/${editing._id}` : "/api/roles", {
        method: editing ? "PUT" : "POST",
        headers: { ...json, ...authHeaders() },
        body: JSON.stringify({ name, description, permissions: [...perms] }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't save the role");
      setRoleOpen(false);
      setNotice(editing ? "Role updated. Staff pick up the change the next time they open the admin panel." : "Role created.");
      load();
    } catch (err: any) {
      setDialogError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (r: any) => {
    if (!confirm(`Delete the role "${r.name}"?`)) return;
    const res = await fetch(`/api/roles/${r._id}`, { method: "DELETE", headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Couldn't delete the role");
    load();
  };

  const setStaffRole = async (userId: string, roleId: string | null) => {
    const res = await fetch(`/api/staff/${userId}`, { method: "PUT", headers: { ...json, ...authHeaders() }, body: JSON.stringify({ roleId }) });
    const data = await res.json();
    if (!res.ok || !data.success) return setError(data.error || "Couldn't update access");
    setNotice(roleId ? "Role updated." : "Access removed. They're a regular customer account again.");
    load();
  };

  const assign = async () => {
    if (!candidate || !assignRole) return;
    setSaving(true);
    const res = await fetch(`/api/staff/${candidate._id}`, { method: "PUT", headers: { ...json, ...authHeaders() }, body: JSON.stringify({ roleId: assignRole }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || !data.success) return setDialogError(data.error || "Couldn't assign the role");
    setAssignOpen(false);
    setNotice(`${candidate.name} can now sign in at /admin/login with their existing password.`);
    load();
  };

  const roleName = (id: string) => roles.find((r) => r._id === id)?.name || "—";

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AdminPanelSettingsRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Role Management</Typography>
            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>Decide which admin pages each role can open, then give roles to your team</Typography>
          </Box>
        </Box>
        {tab === "roles" ? (
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate} sx={{ bgcolor: "#0f172a", fontWeight: 700, textTransform: "none", borderRadius: "6px", "&:hover": { bgcolor: "#1e293b" } }}>Create Role</Button>
        ) : (
          <Button variant="contained" startIcon={<PersonAddAlt1RoundedIcon />} disabled={roles.length === 0} onClick={() => { setCandidate(null); setAssignRole(roles[0]?._id || ""); setQ(""); setDialogError(null); setAssignOpen(true); }}
            sx={{ bgcolor: "#0f172a", fontWeight: 700, textTransform: "none", borderRadius: "6px", "&:hover": { bgcolor: "#1e293b" } }}>Assign Role to User</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "6px" }} onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2, borderRadius: "6px" }} onClose={() => setNotice(null)}>{notice}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, minHeight: 38, borderBottom: "1px solid #e2e8f0", "& .MuiTab-root": { minHeight: 38, textTransform: "none", fontWeight: 700, fontSize: "0.85rem" }, "& .MuiTabs-indicator": { bgcolor: "#0f172a" } }}>
        <Tab value="roles" label={`Roles · ${roles.length}`} />
        <Tab value="staff" label={`Staff & Access · ${staff.length}`} />
      </Tabs>

      <Paper elevation={0} sx={{ borderRadius: "8px", border: "1px solid #e2e8f0", bgcolor: "#fff", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={26} /></Box>
        ) : tab === "roles" ? (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  {["Role", "Pages it can open", "Staff", "Updated"].map((h) => <TableCell key={h} sx={{ fontWeight: 700, color: "#475569", py: 1.25 }}>{h}</TableCell>)}
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r._id} hover>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>{r.name}</Typography>
                      {r.description && <Typography noWrap sx={{ fontSize: "0.75rem", color: "#64748b" }}>{r.description}</Typography>}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
                        <Chip label={`${r.permissions.length} of ${PERMISSIONS.length}`} size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, borderRadius: "4px", bgcolor: "#eff6ff", color: "#1d4ed8" }} />
                        {r.permissions.slice(0, 4).map((k: string) => <Chip key={k} label={PERMISSIONS.find((p) => p.key === k)?.label || k} size="small" sx={{ height: 20, fontSize: "0.68rem", borderRadius: "4px", bgcolor: "#f1f5f9" }} />)}
                        {r.permissions.length > 4 && <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>+{r.permissions.length - 4} more</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.82rem" }}>{r.userCount}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>{fmt(r.updatedAt)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(r)}><EditRoundedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                      <Tooltip title={r.userCount ? "Move its staff to another role first" : "Delete"}>
                        <span><IconButton size="small" disabled={r.userCount > 0} onClick={() => deleteRole(r)} sx={{ color: "#ef4444" }}><DeleteRoundedIcon sx={{ fontSize: 17 }} /></IconButton></span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {roles.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: "#94a3b8" }}>No roles yet. Create one to start giving your team limited admin access.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <>
            <Box sx={{ p: 2, borderBottom: "1px solid #f1f5f9", bgcolor: "#FAFAFA", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <VerifiedUserRoundedIcon sx={{ fontSize: 18, color: "#059669" }} />
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>Super admins (full access)</Typography>
              {supers.map((u) => <Chip key={u._id} label={u.name} size="small" sx={{ height: 22, fontWeight: 600, borderRadius: "4px", bgcolor: "#0f172a", color: "#fff" }} />)}
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    {["Staff member", "Role", "Added"].map((h) => <TableCell key={h} sx={{ fontWeight: 700, color: "#475569", py: 1.25 }}>{h}</TableCell>)}
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staff.map((u) => (
                    <TableRow key={u._id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: "0.72rem", bgcolor: "#0f172a", fontWeight: 700 }}>{initials(u.name)}</Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>{u.name}</Typography>
                            <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>{u.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 190 }}>
                          <Select value={u.adminRoleId?._id || ""} onChange={(e) => setStaffRole(u._id, e.target.value)} displayEmpty sx={{ fontSize: "0.82rem" }}>
                            {roles.map((r) => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", color: "#64748b" }}>{fmt(u.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" startIcon={<PersonRemoveRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => confirm(`Remove ${u.name}'s admin access?`) && setStaffRole(u._id, null)} sx={{ textTransform: "none", fontSize: "0.75rem" }}>
                          Remove access
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {staff.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5, color: "#94a3b8" }}>No staff yet. Assign a role to an existing user to give them limited admin access.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      {/* ================= ROLE DIALOG ================= */}
      <Dialog open={roleOpen} onClose={() => !saving && setRoleOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: "8px" } } }}>
        <form onSubmit={saveRole}>
          <DialogTitle sx={{ fontWeight: 800 }}>{editing ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogContent>
            {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr" }, gap: 1.5, mb: 2.5, mt: 0.5 }}>
              <TextField label="Role name" required size="small" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bookings Manager" slotProps={{ htmlInput: { maxLength: 60 } }} />
              <TextField label="Description (optional)" size="small" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role is for" slotProps={{ htmlInput: { maxLength: 300 } }} />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1.25, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Page access</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>{perms.size} of {PERMISSIONS.length} pages selected. Members only see these in the sidebar and can only use these.</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField size="small" placeholder="Search pages…" value={permSearch} onChange={(e) => setPermSearch(e.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
                <Button size="small" onClick={() => setPerms(new Set(PERMISSIONS.map((p) => p.key)))} sx={{ textTransform: "none" }}>Select all</Button>
                <Button size="small" color="inherit" onClick={() => setPerms(new Set())} sx={{ textTransform: "none", color: "#64748b" }}>Clear</Button>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
              {visibleGroups.map(({ group, items }) => {
                const all = PERMISSIONS.filter((p) => p.group === group);
                const picked = all.filter((p) => perms.has(p.key)).length;
                return (
                  <Paper key={group} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 0.75, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={picked === all.length} indeterminate={picked > 0 && picked < all.length} onChange={(e) => toggleGroup(group, e.target.checked)} />}
                        label={<Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{group}</Typography>}
                      />
                      <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>{picked}/{all.length}</Typography>
                    </Box>
                    <Box sx={{ p: 0.75, pl: 2.5 }}>
                      {items.map((p) => (
                        <Box key={p.key}>
                          <FormControlLabel
                            control={<Checkbox size="small" checked={perms.has(p.key)} onChange={() => toggle(p.key)} />}
                            label={<Box><Typography sx={{ fontSize: "0.84rem", fontWeight: 600 }}>{p.label}</Typography>{p.hint && <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>{p.hint}</Typography>}</Box>}
                            sx={{ alignItems: "flex-start", my: 0.25 }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setRoleOpen(false)} disabled={saving} sx={{ color: "#64748b" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || perms.size === 0 || name.trim().length < 2} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Role"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ================= ASSIGN DIALOG ================= */}
      <Dialog open={assignOpen} onClose={() => !saving && setAssignOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "8px" } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Assign Role to User</DialogTitle>
        <DialogContent>
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          <Typography sx={{ fontSize: "0.82rem", color: "#64748b", mb: 2 }}>Pick any registered user. They sign in at <strong>/admin/login</strong> with their existing email and password.</Typography>
          <Autocomplete
            options={candidates}
            value={candidate}
            onChange={(_, v) => setCandidate(v)}
            inputValue={q}
            onInputChange={(_, v) => setQ(v)}
            loading={searching}
            filterOptions={(x) => x}
            getOptionLabel={(o) => `${o.name} — ${o.email}`}
            isOptionEqualToValue={(a, b) => a._id === b._id}
            noOptionsText={q.trim().length < 2 ? "Type at least 2 letters of a name, email or phone" : "No matching customer accounts"}
            renderInput={(p) => <TextField {...p} label="Search users" size="small" autoFocus />}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select value={assignRole} label="Role" onChange={(e) => setAssignRole(e.target.value)}>
              {roles.map((r) => <MenuItem key={r._id} value={r._id}>{r.name} · {r.permissions.length} pages</MenuItem>)}
            </Select>
          </FormControl>
          {assignRole && (
            <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mt: 1 }}>
              Access: {(roles.find((r) => r._id === assignRole)?.permissions || []).map((k: string) => PERMISSIONS.find((p) => p.key === k)?.label || k).join(", ")}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignOpen(false)} disabled={saving} sx={{ color: "#64748b" }}>Cancel</Button>
          <Button variant="contained" onClick={assign} disabled={saving || !candidate || !assignRole} sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}>
            {saving ? "Assigning…" : `Assign${assignRole ? ` ${roleName(assignRole)}` : ""}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
