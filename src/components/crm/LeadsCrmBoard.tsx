"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Popover,
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

// Icons
import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import BookOnlineRoundedIcon from "@mui/icons-material/BookOnlineRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

// Stage definition
export const PIPELINE_STAGES = [
  { id: "new", label: "Qualified", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { id: "contacted", label: "Contact Made", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { id: "proposal", label: "Proposal / Demo", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { id: "negotiation", label: "Negotiations Started", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { id: "won", label: "Won / Confirmed", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  { id: "lost", label: "Lost / Closed", color: "#e11d48", bg: "#fff1f2", border: "#fecdd3" },
];

export const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "#dc2626", bg: "#fef2f2" },
  high: { label: "High", color: "#d97706", bg: "#fffbeb" },
  medium: { label: "Medium", color: "#2563eb", bg: "#eff6ff" },
  low: { label: "Low", color: "#64748b", bg: "#f8fafc" },
};

export const SOURCE_LABELS: Record<string, string> = {
  website: "Website Form",
  custom_trip: "Custom Trip",
  direct_call: "Direct Call",
  whatsapp: "WhatsApp",
  partner_referral: "Partner",
  social_media: "Social Media",
  walk_in: "Walk-in",
  other: "Other",
};

const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d?: string | Date | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getPartnerLocation = (p: any): string => {
  if (!p) return "";
  if (p.assignedDestination?.name) {
    return p.assignedDestination.state
      ? `${p.assignedDestination.name}, ${p.assignedDestination.state}`
      : p.assignedDestination.name;
  }
  if (p.address?.trim()) return p.address.trim();
  return "";
};

export const formatPartnerWithLocation = (p: any): string => {
  if (!p) return "";
  const name = p.name || "Partner";
  const company = p.companyName ? ` (${p.companyName})` : "";
  const loc = getPartnerLocation(p);
  const locStr = loc ? ` • 📍 ${loc}` : "";
  return `${name}${company}${locStr}`;
};

interface LeadsCrmBoardProps {
  role: "admin" | "partner";
}

export default function LeadsCrmBoard({ role }: LeadsCrmBoardProps) {
  const tokenKey = role === "admin" ? "epic_token" : "epic_partner_token";

  const getHeaders = (): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const t = localStorage.getItem(tokenKey);
    return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };

  // State
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reference data
  const [partners, setPartners] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Drag and Drop
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Dialog: Add Lead
  const blankAddForm = {
    title: "",
    tourTitle: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    destinationId: "",
    destinationName: "",
    tourId: "",
    numberOfTravelers: 2,
    estimatedBudget: 50000,
    expectedTravelDate: "",
    stage: "new",
    priority: "medium",
    source: role === "admin" ? "direct_call" : "partner_referral",
    partnerId: "",
    requirements: "",
    nextFollowUp: "",
    nextFollowUpNotes: "",
  };
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [addForm, setAddForm] = useState(blankAddForm);
  const [savingLead, setSavingLead] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Drawer: Lead Detail
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leadDetailTab, setLeadDetailTab] = useState(0);

  // Activity popover on card
  const [activityPopoverAnchor, setActivityPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverLead, setPopoverLead] = useState<any | null>(null);

  // Add activity form inside drawer
  const [newActivityType, setNewActivityType] = useState<string>("call");
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityDesc, setNewActivityDesc] = useState("");
  const [newActivityDueDate, setNewActivityDueDate] = useState("");
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Convert to booking dialog
  const [openConvertDialog, setOpenConvertDialog] = useState(false);
  const [convertTourId, setConvertTourId] = useState("");
  const [convertTravelDate, setConvertTravelDate] = useState("");
  const [convertPax, setConvertPax] = useState(2);
  const [convertAmount, setConvertAmount] = useState(0);
  const [converting, setConverting] = useState(false);

  // Fetch all data
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (stageFilter !== "all") q.set("stage", stageFilter);
      if (priorityFilter !== "all") q.set("priority", priorityFilter);
      if (sourceFilter !== "all") q.set("source", sourceFilter);
      if (partnerFilter !== "all") q.set("partnerId", partnerFilter);
      if (search.trim()) q.set("search", search.trim());

      const res = await fetch(`/api/leads?${q.toString()}`, {
        headers: getHeaders(),
      });
      const d = await res.json();
      if (d.success) {
        setLeads(d.data || []);
        setStats(d.stats || null);
      } else {
        setError(d.error || "Failed to load leads");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [pRes, dRes, tRes] = await Promise.all([
        role === "admin"
          ? fetch("/api/partners", { headers: getHeaders() }).then((r) => r.json())
          : Promise.resolve({ success: true, data: [] }),
        fetch("/api/destinations").then((r) => r.json()),
        fetch("/api/tours").then((r) => r.json()),
      ]);

      if (pRes.success) setPartners(pRes.data || []);
      if (dRes.success) setDestinations(dRes.data || []);
      if (tRes.success) setTours(tRes.data || []);
    } catch (err) {
      console.warn("Failed auxiliary data fetch", err);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [stageFilter, priorityFilter, sourceFilter, partnerFilter]);

  // Handle Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLeads();
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Stage change with optimistic update
  const handleStageChange = async (leadId: string, newStage: string) => {
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, stage: newStage } : l))
    );
    if (selectedLead && selectedLead._id === leadId) {
      setSelectedLead((prev: any) => ({ ...prev, stage: newStage }));
    }

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ stage: newStage }),
      });
      const d = await res.json();
      if (d.success) {
        // Refresh detail if open
        if (selectedLead && selectedLead._id === leadId) {
          setSelectedLead(d.data);
        }
      } else {
        fetchLeads(); // Rollback
      }
    } catch (e) {
      fetchLeads();
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedLeadId(id);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId;
    if (leadId) {
      handleStageChange(leadId, targetStage);
    }
    setDraggedLeadId(null);
  };

  // Add Lead Submit
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLead(true);
    setDialogError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(addForm),
      });
      const d = await res.json();
      if (d.success) {
        setOpenAddDialog(false);
        // Reset form
        setAddForm(blankAddForm);
        fetchLeads();
      } else {
        setDialogError(d.error || "Failed to create lead");
      }
    } catch (err: any) {
      setDialogError(err.message || "Failed to create lead");
    } finally {
      setSavingLead(false);
    }
  };

  // Open Lead Drawer
  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
    setLeadDetailTab(0);
  };

  // Add Activity inside Drawer
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newActivityTitle.trim()) return;
    setSubmittingActivity(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead._id}/activities`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          type: newActivityType,
          title: newActivityTitle.trim(),
          description: newActivityDesc.trim(),
          dueDate: newActivityDueDate || null,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setSelectedLead(d.data);
        setNewActivityTitle("");
        setNewActivityDesc("");
        setNewActivityDueDate("");
        // update list
        setLeads((prev) =>
          prev.map((l) => (l._id === selectedLead._id ? d.data : l))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingActivity(false);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (activityId: string, currentStatus: boolean) => {
    if (!selectedLead) return;
    try {
      const res = await fetch(`/api/leads/${selectedLead._id}/activities`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          activityId,
          completed: !currentStatus,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setSelectedLead(d.data);
        setLeads((prev) =>
          prev.map((l) => (l._id === selectedLead._id ? d.data : l))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Convert Dialog
  const handleOpenConvert = () => {
    if (!selectedLead) return;
    setConvertTourId(selectedLead.tourId?._id || selectedLead.tourId || (tours[0]?._id ?? ""));
    setConvertPax(selectedLead.numberOfTravelers || 2);
    setConvertAmount(selectedLead.estimatedBudget || (tours[0]?.priceInr ? tours[0].priceInr * 2 : 50000));
    setConvertTravelDate(
      selectedLead.expectedTravelDate
        ? new Date(selectedLead.expectedTravelDate).toISOString().split("T")[0]
        : new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
    );
    setOpenConvertDialog(true);
  };

  // Convert to Booking Submit
  const handleConfirmConvert = async () => {
    if (!selectedLead) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead._id}/convert`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          tourId: convertTourId,
          travelDate: convertTravelDate,
          numberOfTravelers: convertPax,
          totalAmountInr: convertAmount,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setOpenConvertDialog(false);
        setSelectedLead(d.data.lead);
        fetchLeads();
      } else {
        alert(d.error || "Failed to convert lead to booking");
      }
    } catch (e: any) {
      alert(e.message || "Failed to convert lead to booking");
    } finally {
      setConverting(false);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to permanently delete this lead?")) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const d = await res.json();
      if (d.success) {
        setDrawerOpen(false);
        fetchLeads();
      } else {
        alert(d.error || "Failed to delete lead");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!leads.length) return;
    const headers = [
      "Title",
      "Customer Name",
      "Email",
      "Phone",
      "Stage",
      "Priority",
      "Budget (INR)",
      "Travelers",
      "Tour",
      "Destination",
      "Source",
      "Assigned Partner",
      "Created At",
    ];
    const rows = leads.map((l) => [
      `"${(l.title || "").replace(/"/g, '""')}"`,
      `"${(l.customerName || "").replace(/"/g, '""')}"`,
      `"${l.customerEmail || ""}"`,
      `"${l.customerPhone || ""}"`,
      `"${l.stage || ""}"`,
      `"${l.priority || ""}"`,
      l.estimatedBudget || 0,
      l.numberOfTravelers || 1,
      `"${(l.tourTitle || "").replace(/"/g, '""')}"`,
      `"${(l.destinationName || "").replace(/"/g, '""')}"`,
      `"${l.source || ""}"`,
      `"${(l.partnerId?.name || "Unassigned").replace(/"/g, '""')}"`,
      `"${new Date(l.createdAt).toISOString()}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EpicJourneys_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group leads by stage for Kanban
  const groupedLeads = useMemo(() => {
    const map: Record<string, any[]> = {
      new: [],
      contacted: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
    };
    leads.forEach((l) => {
      if (map[l.stage]) {
        map[l.stage].push(l);
      } else {
        map.new.push(l);
      }
    });
    return map;
  }, [leads]);

  return (
    <Box sx={{ width: "100%", pb: 8 }}>
      {/* Top Banner / Breadcrumb & View Toggle Header */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              bgcolor: "#0f172a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUpRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}
            >
              Leads & Deals Pipeline
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>
              {role === "admin"
                ? "Track, manage, and convert travel inquiries across all partner networks"
                : "Manage your assigned travelers, custom quotes, and bookings in real-time"}
            </Typography>
          </Box>
        </Box>

        {/* Action Controls */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          {/* View Switcher: Kanban vs List */}
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              p: 0.35,
              bgcolor: "#f8fafc",
            }}
          >
            <Tooltip title="Kanban Board View">
              <IconButton
                size="small"
                onClick={() => setViewMode("kanban")}
                sx={{
                  borderRadius: "4px",
                  bgcolor: viewMode === "kanban" ? "#ffffff" : "transparent",
                  color: viewMode === "kanban" ? "#0f172a" : "#64748b",
                  boxShadow: viewMode === "kanban" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  px: 1,
                  py: 0.5,
                }}
              >
                <ViewKanbanRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Table / List View">
              <IconButton
                size="small"
                onClick={() => setViewMode("table")}
                sx={{
                  borderRadius: "4px",
                  bgcolor: viewMode === "table" ? "#ffffff" : "transparent",
                  color: viewMode === "table" ? "#0f172a" : "#64748b",
                  boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  px: 1,
                  py: 0.5,
                }}
              >
                <ViewListRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Paper>

          {/* Refresh */}
          <Tooltip title="Refresh pipeline">
            <IconButton
              size="small"
              onClick={fetchLeads}
              sx={{ border: "1px solid #e2e8f0", bgcolor: "#ffffff", borderRadius: "6px" }}
            >
              <RefreshRoundedIcon sx={{ fontSize: 18, color: "#475569" }} />
            </IconButton>
          </Tooltip>

          {/* Export CSV */}
          <Tooltip title="Export to CSV">
            <IconButton
              size="small"
              onClick={handleExportCSV}
              sx={{ border: "1px solid #e2e8f0", bgcolor: "#ffffff", borderRadius: "6px" }}
            >
              <FileDownloadRoundedIcon sx={{ fontSize: 18, color: "#475569" }} />
            </IconButton>
          </Tooltip>

          {/* Primary Add Lead Button */}
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{
              bgcolor: "#0f172a",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.85rem",
              borderRadius: "6px",
              px: 2,
              py: 0.85,
              textTransform: "none",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            + Lead / Deal
          </Button>
        </Box>
      </Box>

      {/* Metric Cards Banner (Jira / Pipedrive style stats) */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Active Pipeline
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                {inr(stats?.totalPipelineValue || 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#059669", fontWeight: 600 }}>
                {stats?.activeLeads || leads.length} active opportunities
              </Typography>
            </Box>
            <Box sx={{ width: 42, height: 42, borderRadius: "8px", bgcolor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUpRoundedIcon />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Won Revenue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#059669", mt: 0.5 }}>
                {inr(stats?.wonValue || 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                {stats?.wonCount || 0} deals confirmed
              </Typography>
            </Box>
            <Box sx={{ width: 42, height: 42, borderRadius: "8px", bgcolor: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircleRoundedIcon />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Conversion Rate
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                {stats?.winRate ?? 0}%
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Based on all closed deals
              </Typography>
            </Box>
            <Box sx={{ width: 42, height: 42, borderRadius: "8px", bgcolor: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FlagRoundedIcon />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Avg Deal Size
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                {inr(stats?.totalLeads ? Math.round((stats.totalPipelineValue + (stats.wonValue || 0)) / (stats.totalLeads || 1)) : 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Per travel inquiry
              </Typography>
            </Box>
            <Box sx={{ width: 42, height: 42, borderRadius: "8px", bgcolor: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuggageRoundedIcon />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 3,
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search leads, clients, phone, destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flexGrow: 1,
            minWidth: { xs: "100%", md: 260 },
            "& .MuiOutlinedInput-root": { borderRadius: "6px" },
          }}
        />

        {/* Priority Filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={priorityFilter}
            label="Priority"
            onChange={(e) => setPriorityFilter(e.target.value)}
            sx={{ borderRadius: "6px" }}
          >
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>

        {/* Source Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Lead Source</InputLabel>
          <Select
            value={sourceFilter}
            label="Lead Source"
            onChange={(e) => setSourceFilter(e.target.value)}
            sx={{ borderRadius: "6px" }}
          >
            <MenuItem value="all">All Sources</MenuItem>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Admin Partner Filter */}
        {role === "admin" && (
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Partner Assignee</InputLabel>
            <Select
              value={partnerFilter}
              label="Partner Assignee"
              onChange={(e) => setPartnerFilter(e.target.value)}
              sx={{ borderRadius: "6px" }}
            >
              <MenuItem value="all">All Partners</MenuItem>
              <MenuItem value="unassigned">Unassigned Only</MenuItem>
              {partners.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {formatPartnerWithLocation(p)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {(search || priorityFilter !== "all" || sourceFilter !== "all" || partnerFilter !== "all") && (
          <Button
            size="small"
            variant="text"
            onClick={() => {
              setSearch("");
              setPriorityFilter("all");
              setSourceFilter("all");
              setPartnerFilter("all");
            }}
            sx={{ color: "#ef4444", fontWeight: 600, fontSize: "0.8rem" }}
          >
            Reset Filters
          </Button>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "6px" }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={36} sx={{ color: "#0f172a" }} />
        </Box>
      ) : viewMode === "kanban" ? (
        /* ================= KANBAN PIPELINE BOARD ================= */
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            pb: 3,
            minHeight: "70vh",
            alignItems: "flex-start",
          }}
        >
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = groupedLeads[stage.id] || [];
            const stageTotalValue = stageLeads.reduce(
              (acc, curr) => acc + (Number(curr.estimatedBudget) || 0),
              0
            );
            const isDropActive = dragOverStage === stage.id;

            return (
              <Box
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                sx={{
                  flex: "0 0 310px",
                  width: 310,
                  bgcolor: isDropActive ? "#f1f5f9" : "#f8fafc",
                  borderRadius: "8px",
                  border: isDropActive ? `2px dashed ${stage.color}` : "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "80vh",
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Stage Header */}
                <Box
                  sx={{
                    p: 1.5,
                    borderBottom: "1px solid #e2e8f0",
                    bgcolor: "#ffffff",
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    borderTop: `3px solid ${stage.color}`,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.92rem",
                        color: "#0f172a",
                      }}
                    >
                      {stage.label}
                    </Typography>
                    <Chip
                      label={stageLeads.length}
                      size="small"
                      sx={{
                        height: 20,
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        bgcolor: stage.bg,
                        color: stage.color,
                        borderRadius: "4px",
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                    {inr(stageTotalValue)} • {stageLeads.length} {stageLeads.length === 1 ? "deal" : "deals"}
                  </Typography>
                </Box>

                {/* Cards Container */}
                <Box
                  sx={{
                    p: 1.25,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                    flexGrow: 1,
                  }}
                >
                  {stageLeads.length === 0 ? (
                    <Box
                      sx={{
                        py: 4,
                        textAlign: "center",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "6px",
                        bgcolor: "#ffffff",
                        color: "#94a3b8",
                      }}
                    >
                      <Typography variant="caption" sx={{ display: "block" }}>
                        No leads in this stage
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.7rem", opacity: 0.7 }}>
                        Drag cards here
                      </Typography>
                    </Box>
                  ) : (
                    stageLeads.map((lead) => {
                      const priorityMeta = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.medium;
                      const hasOverdueFollowUp =
                        lead.nextFollowUp && new Date(lead.nextFollowUp).getTime() < Date.now();
                      const hasScheduledFollowUp =
                        lead.nextFollowUp && new Date(lead.nextFollowUp).getTime() >= Date.now();

                      return (
                        <Card
                          key={lead._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead._id)}
                          onClick={() => handleOpenLead(lead)}
                          sx={{
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            cursor: "grab",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              borderColor: "#cbd5e1",
                              transform: "translateY(-1px)",
                            },
                            "&:active": {
                              cursor: "grabbing",
                            },
                          }}
                        >
                          <CardContent sx={{ p: "12px !important" }}>
                            {/* Title & Priority */}
                            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.88rem",
                                  color: "#0f172a",
                                  lineHeight: 1.3,
                                }}
                              >
                                {lead.title}
                              </Typography>
                              <Chip
                                label={priorityMeta.label}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  bgcolor: priorityMeta.bg,
                                  color: priorityMeta.color,
                                  borderRadius: "4px",
                                  flexShrink: 0,
                                }}
                              />
                            </Box>

                            {/* Customer & Tour Details */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5, color: "#475569" }}>
                              <PersonRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} />
                              <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }} noWrap>
                                {lead.customerName}
                              </Typography>
                            </Box>

                            {(lead.tourTitle || lead.destinationName) && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1, color: "#64748b" }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 14, color: "#ca8a04" }} />
                                <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }} noWrap>
                                  {lead.tourTitle || lead.destinationName}
                                </Typography>
                              </Box>
                            )}

                            {/* Deal Value & Travelers */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                pt: 0.75,
                                borderTop: "1px dashed #e2e8f0",
                                mb: 1,
                              }}
                            >
                              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
                                {inr(lead.estimatedBudget)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                                {lead.numberOfTravelers} {lead.numberOfTravelers === 1 ? "Pax" : "Pax"}
                              </Typography>
                            </Box>

                            {/* Footer: Partner Avatar & Activity Icon popover */}
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.5 }}>
                              {/* Partner chip or unassigned */}
                              <Tooltip title={lead.partnerId ? formatPartnerWithLocation(lead.partnerId) : "Unassigned lead"}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, maxWidth: "60%" }}>
                                  <Avatar
                                    sx={{
                                      width: 22,
                                      height: 22,
                                      fontSize: "0.65rem",
                                      bgcolor: lead.partnerId ? "#0f172a" : "#cbd5e1",
                                      color: "#ffffff",
                                      fontWeight: 700,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {(lead.partnerId?.name || lead.customerName || "U").slice(0, 1).toUpperCase()}
                                  </Avatar>
                                  <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.72rem" }} noWrap>
                                    {lead.partnerId?.name
                                      ? (getPartnerLocation(lead.partnerId)
                                          ? `${lead.partnerId.name.split(" ")[0]} (📍${getPartnerLocation(lead.partnerId).split(",")[0]})`
                                          : lead.partnerId.name.split(" ")[0])
                                      : "Unassigned"}
                                  </Typography>
                                </Box>
                              </Tooltip>

                              {/* Activity Indicator (like in the user's Pipedrive screenshot) */}
                              <Box
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivityPopoverAnchor(e.currentTarget);
                                  setPopoverLead(lead);
                                }}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  cursor: "pointer",
                                  px: 0.75,
                                  py: 0.35,
                                  borderRadius: "4px",
                                  bgcolor: hasOverdueFollowUp
                                    ? "#fef2f2"
                                    : hasScheduledFollowUp
                                    ? "#ecfdf5"
                                    : "#f8fafc",
                                  border: "1px solid",
                                  borderColor: hasOverdueFollowUp
                                    ? "#fecdd3"
                                    : hasScheduledFollowUp
                                    ? "#a7f3d0"
                                    : "#e2e8f0",
                                }}
                              >
                                {hasOverdueFollowUp ? (
                                  <WarningAmberRoundedIcon sx={{ fontSize: 14, color: "#dc2626" }} />
                                ) : hasScheduledFollowUp ? (
                                  <CheckCircleRoundedIcon sx={{ fontSize: 14, color: "#059669" }} />
                                ) : (
                                  <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                                )}
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    color: hasOverdueFollowUp
                                      ? "#dc2626"
                                      : hasScheduledFollowUp
                                      ? "#059669"
                                      : "#64748b",
                                  }}
                                >
                                  {hasOverdueFollowUp
                                    ? "Overdue"
                                    : hasScheduledFollowUp
                                    ? fmtDate(lead.nextFollowUp)
                                    : "+ Activity"}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        /* ================= TABLE / LIST VIEW ================= */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.5 }}>Deal Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Customer Contact</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Tour / Destination</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Value & Pax</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Stage</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Next Follow-up</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Assigned</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: "#94a3b8" }}>
                    No leads match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => {
                  const stageMeta =
                    PIPELINE_STAGES.find((s) => s.id === lead.stage) || PIPELINE_STAGES[0];
                  const priorityMeta =
                    PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.medium;

                  return (
                    <TableRow
                      key={lead._id}
                      hover
                      onClick={() => handleOpenLead(lead)}
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" } }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                          {lead.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          Source: {SOURCE_LABELS[lead.source] || lead.source}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b" }}>
                          {lead.customerName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                          {lead.customerPhone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.85rem", color: "#334155" }}>
                          {lead.tourTitle || lead.destinationName || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                          {inr(lead.estimatedBudget)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          {lead.numberOfTravelers} travelers
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stageMeta.label}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            borderRadius: "4px",
                            bgcolor: stageMeta.bg,
                            color: stageMeta.color,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={priorityMeta.label}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            borderRadius: "4px",
                            bgcolor: priorityMeta.bg,
                            color: priorityMeta.color,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.82rem", color: "#475569" }}>
                          {fmtDate(lead.nextFollowUp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.82rem", color: "#334155" }}>
                          {lead.partnerId ? formatPartnerWithLocation(lead.partnerId) : "Unassigned"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenLead(lead)}
                          sx={{ borderRadius: "4px", fontSize: "0.75rem", textTransform: "none", py: 0.3 }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ================= CARD ACTIVITY POPOVER (from image) ================= */}
      <Popover
        open={Boolean(activityPopoverAnchor && popoverLead)}
        anchorEl={activityPopoverAnchor}
        onClose={() => {
          setActivityPopoverAnchor(null);
          setPopoverLead(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              width: 320,
              borderRadius: "8px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
            },
          },
        }}
      >
        {popoverLead && (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a", mb: 1 }}>
              Activities & Tasks
            </Typography>
            <Divider sx={{ mb: 1.5 }} />

            {/* List activities */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 2 }}>
              {popoverLead.activities && popoverLead.activities.length > 0 ? (
                popoverLead.activities.slice(0, 4).map((act: any, idx: number) => (
                  <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleTask(act._id, act.completed)}
                      sx={{ p: 0.2, mt: 0.2 }}
                    >
                      {act.completed ? (
                        <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#16a34a" }} />
                      ) : (
                        <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                      )}
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        sx={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: act.completed ? "#94a3b8" : "#1e293b",
                          textDecoration: act.completed ? "line-through" : "none",
                        }}
                      >
                        {act.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                        {fmtDate(act.dueDate || act.createdAt)} • {act.createdBy}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  No activities logged yet.
                </Typography>
              )}
            </Box>

            <Button
              fullWidth
              size="small"
              variant="outlined"
              onClick={() => {
                const leadToOpen = popoverLead;
                setActivityPopoverAnchor(null);
                setPopoverLead(null);
                handleOpenLead(leadToOpen);
              }}
              sx={{
                borderRadius: "6px",
                fontSize: "0.8rem",
                textTransform: "none",
                fontWeight: 700,
                borderColor: "#cbd5e1",
                color: "#0f172a",
              }}
            >
              + Schedule an activity / Open lead
            </Button>
          </Box>
        )}
      </Popover>

      {/* ================= COMPREHENSIVE LEAD DETAIL DRAWER ================= */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", md: 560, lg: 620 },
              p: 3,
              bgcolor: "#ffffff",
            },
          },
        }}
      >
        {selectedLead && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Drawer Header */}
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
              <Box>
                <Chip
                  label={SOURCE_LABELS[selectedLead.source] || selectedLead.source}
                  size="small"
                  sx={{
                    mb: 1,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    borderRadius: "4px",
                    bgcolor: "#f1f5f9",
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.25 }}>
                  {selectedLead.title}
                </Typography>
              </Box>
              <IconButton onClick={() => setDrawerOpen(false)} size="small">
                <CloseRoundedIcon />
              </IconButton>
            </Box>

            {/* Stage Stepper Navigation Bar */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", mb: 1 }}>
                Pipeline Stage Progression
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 0.5,
                  p: 0.5,
                  bgcolor: "#f8fafc",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}
              >
                {PIPELINE_STAGES.map((s) => {
                  const isActive = selectedLead.stage === s.id;
                  return (
                    <Button
                      key={s.id}
                      size="small"
                      onClick={() => handleStageChange(selectedLead._id, s.id)}
                      sx={{
                        p: 0.5,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: "4px",
                        bgcolor: isActive ? s.color : "transparent",
                        color: isActive ? "#ffffff" : "#64748b",
                        "&:hover": {
                          bgcolor: isActive ? s.color : "#f1f5f9",
                        },
                      }}
                    >
                      {s.label.split(" ")[0]}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* Primary Action Buttons */}
            <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<BookOnlineRoundedIcon />}
                onClick={handleOpenConvert}
                disabled={Boolean(selectedLead.bookingId)}
                sx={{
                  bgcolor: "#facc15",
                  color: "#0f172a",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  flexGrow: 1,
                  "&:hover": { bgcolor: "#eab308" },
                }}
              >
                {selectedLead.bookingId ? `Converted (${selectedLead.bookingRef})` : "Convert to Booking"}
              </Button>

              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleDeleteLead(selectedLead._id)}
                sx={{ borderRadius: "6px", fontWeight: 700 }}
              >
                Delete
              </Button>
            </Box>

            {/* Tabs: Overview vs Activities */}
            <Tabs
              value={leadDetailTab}
              onChange={(_, v) => setLeadDetailTab(v)}
              sx={{ borderBottom: "1px solid #e2e8f0", mb: 2.5 }}
            >
              <Tab label="Deal Overview" sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.85rem" }} />
              <Tab
                label={`Activity & Notes (${selectedLead.activities?.length || 0})`}
                sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.85rem" }}
              />
            </Tabs>

            {/* Tab 0: Overview */}
            {leadDetailTab === 0 && (
              <Box sx={{ overflowY: "auto", flexGrow: 1, pr: 1 }}>
                {/* Customer Details Box */}
                <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: "6px", mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", mb: 1.5 }}>
                    Customer Information
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Full Name</Typography>
                      <Typography sx={{ fontWeight: 700, color: "#0f172a" }}>{selectedLead.customerName}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Phone Number</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: "#0f172a" }}>{selectedLead.customerPhone}</Typography>
                        <Tooltip title="Send WhatsApp Message">
                          <IconButton
                            size="small"
                            component="a"
                            href={`https://wa.me/${selectedLead.customerPhone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            sx={{ color: "#25d366", p: 0.3 }}
                          >
                            <ChatRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Email Address</Typography>
                      <Typography
                        component="a"
                        href={`mailto:${selectedLead.customerEmail}`}
                        sx={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
                      >
                        {selectedLead.customerEmail}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Deal Financials & Trip Details */}
                <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: "6px", mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", mb: 1.5 }}>
                    Trip & Deal Financials
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Estimated Budget</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: "#0f172a" }}>
                        {inr(selectedLead.estimatedBudget)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Travelers (Pax)</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: "#0f172a" }}>
                        {selectedLead.numberOfTravelers} People
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Tour Package</Typography>
                      <Typography sx={{ fontWeight: 600, color: "#334155", fontSize: "0.88rem" }}>
                        {selectedLead.tourTitle || "Custom Itinerary"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Destination</Typography>
                      <Typography sx={{ fontWeight: 600, color: "#334155", fontSize: "0.88rem" }}>
                        {selectedLead.destinationName || "Not specified"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Expected Travel Date</Typography>
                      <Typography sx={{ fontWeight: 600, color: "#334155", fontSize: "0.88rem" }}>
                        {fmtDate(selectedLead.expectedTravelDate)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Priority</Typography>
                      <Chip
                        label={selectedLead.priority.toUpperCase()}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          bgcolor: PRIORITY_CONFIG[selectedLead.priority]?.bg,
                          color: PRIORITY_CONFIG[selectedLead.priority]?.color,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Partner Assignment & Requirements */}
                <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: "6px", mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", mb: 1.5 }}>
                    Assignment & Custom Requirements
                  </Typography>

                  {role === "admin" ? (
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Assigned Partner</InputLabel>
                      <Select
                        value={selectedLead.partnerId?._id || selectedLead.partnerId || ""}
                        label="Assigned Partner"
                        onChange={async (e) => {
                          const newPartnerId = e.target.value;
                          await fetch(`/api/leads/${selectedLead._id}`, {
                            method: "PUT",
                            headers: getHeaders(),
                            body: JSON.stringify({ partnerId: newPartnerId || null }),
                          });
                          fetchLeads();
                          const updated = await fetch(`/api/leads/${selectedLead._id}`, {
                            headers: getHeaders(),
                          }).then((r) => r.json());
                          if (updated.success) setSelectedLead(updated.data);
                        }}
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {partners.map((p) => (
                          <MenuItem key={p._id} value={p._id}>
                            {formatPartnerWithLocation(p)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Assigned Partner</Typography>
                      <Typography sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {selectedLead.partnerId ? formatPartnerWithLocation(selectedLead.partnerId) : "Unassigned"}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                    Travel Requirements & Notes
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#334155",
                      bgcolor: "#f8fafc",
                      p: 1.5,
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      mt: 0.5,
                      whiteSpace: "pre-wrap",
                      fontSize: "0.85rem",
                    }}
                  >
                    {selectedLead.requirements || "No custom requirements entered."}
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* Tab 1: Activities & Timeline */}
            {leadDetailTab === 1 && (
              <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, overflowY: "auto" }}>
                {/* Form to log an activity */}
                <Paper
                  elevation={0}
                  component="form"
                  onSubmit={handleAddActivity}
                  sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: "6px", mb: 3, bgcolor: "#f8fafc" }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", mb: 1.5 }}>
                    Log an Activity or Reminder
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={newActivityType}
                          label="Type"
                          onChange={(e) => setNewActivityType(e.target.value)}
                        >
                          <MenuItem value="call">Phone Call</MenuItem>
                          <MenuItem value="task">Follow-up Task</MenuItem>
                          <MenuItem value="note">Internal Note</MenuItem>
                          <MenuItem value="email">Email</MenuItem>
                          <MenuItem value="proposal">Proposal Sent</MenuItem>
                          <MenuItem value="meeting">Meeting</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Activity title (e.g. Called client regarding hotels)"
                        value={newActivityTitle}
                        onChange={(e) => setNewActivityTitle(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        size="small"
                        fullWidth
                        type="date"
                        label="Due Date (optional)"
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={newActivityDueDate}
                        onChange={(e) => setNewActivityDueDate(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={submittingActivity}
                        sx={{
                          height: 40,
                          bgcolor: "#0f172a",
                          color: "#ffffff",
                          fontWeight: 700,
                          "&:hover": { bgcolor: "#1e293b" },
                        }}
                      >
                        {submittingActivity ? "Saving..." : "+ Log Activity"}
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Additional details / discussion summary..."
                        value={newActivityDesc}
                        onChange={(e) => setNewActivityDesc(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Timeline Feed */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", mb: 1.5 }}>
                  History Timeline
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {selectedLead.activities?.map((act: any, idx: number) => (
                    <Box
                      key={act._id || idx}
                      sx={{
                        p: 1.5,
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        bgcolor: act.completed ? "#f8fafc" : "#ffffff",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleToggleTask(act._id, act.completed)}
                        sx={{ p: 0.2, mt: 0.2 }}
                      >
                        {act.completed ? (
                          <CheckCircleRoundedIcon sx={{ fontSize: 20, color: "#16a34a" }} />
                        ) : (
                          <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 20, color: "#94a3b8" }} />
                        )}
                      </IconButton>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              color: act.completed ? "#94a3b8" : "#0f172a",
                              textDecoration: act.completed ? "line-through" : "none",
                            }}
                          >
                            {act.title}
                          </Typography>
                          <Chip
                            label={act.type}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "0.62rem",
                              textTransform: "uppercase",
                              fontWeight: 700,
                              borderRadius: "4px",
                            }}
                          />
                        </Box>
                        {act.description && (
                          <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.8rem", mb: 0.5 }}>
                            {act.description}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.72rem" }}>
                          {fmtDate(act.createdAt)} by {act.createdBy}
                          {act.dueDate && ` • Due: ${fmtDate(act.dueDate)}`}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Drawer>

      {/* ================= ADD LEAD DIALOG ================= */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "8px" } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#0f172a", borderBottom: "1px solid #e2e8f0" }}>
          Create New Lead / Deal
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: "6px" }}>
              {dialogError}
            </Alert>
          )}

          <Box component="form" id="add-lead-form" onSubmit={handleCreateLead} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              {/* Deal / Journey Pipeline Title - Searchable from DB (Required *) */}
              <Grid size={{ xs: 12, sm: 7 }}>
                <Autocomplete
                  freeSolo
                  options={tours}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option?.title ? `${option.title} (${inr(option.priceInr)} / person)` : "";
                  }}
                  value={
                    tours.find((t) => t._id === addForm.tourId) ||
                    addForm.title ||
                    ""
                  }
                  inputValue={addForm.title}
                  onInputChange={(_, newInputValue) => {
                    const matchedTour = tours.find(
                      (t) => t.title?.toLowerCase() === newInputValue.trim().toLowerCase()
                    );
                    setAddForm((prev) => ({
                      ...prev,
                      title: newInputValue,
                      tourTitle: newInputValue,
                      tourId: matchedTour ? matchedTour._id : prev.tourId,
                      destinationId: matchedTour?.destinationId || prev.destinationId,
                      destinationName: matchedTour?.state || prev.destinationName,
                      estimatedBudget: matchedTour?.priceInr
                        ? matchedTour.priceInr * (prev.numberOfTravelers || 1)
                        : prev.estimatedBudget,
                    }));
                  }}
                  onChange={(_, newValue) => {
                    if (!newValue) {
                      setAddForm((prev) => ({
                        ...prev,
                        title: "",
                        tourTitle: "",
                        tourId: "",
                      }));
                    } else if (typeof newValue === "string") {
                      const matched = tours.find(
                        (t) => t.title?.toLowerCase() === newValue.trim().toLowerCase()
                      );
                      setAddForm((prev) => ({
                        ...prev,
                        title: newValue,
                        tourTitle: newValue,
                        tourId: matched ? matched._id : "",
                        destinationId: matched?.destinationId || prev.destinationId,
                        destinationName: matched?.state || prev.destinationName,
                        estimatedBudget: matched?.priceInr
                          ? matched.priceInr * (prev.numberOfTravelers || 1)
                          : prev.estimatedBudget,
                      }));
                    } else if (typeof newValue === "object") {
                      setAddForm((prev) => ({
                        ...prev,
                        title: newValue.title || "",
                        tourTitle: newValue.title || "",
                        tourId: newValue._id || "",
                        destinationId: newValue.destinationId || prev.destinationId,
                        destinationName: newValue.state || prev.destinationName,
                        estimatedBudget: newValue.priceInr
                          ? newValue.priceInr * (prev.numberOfTravelers || 1)
                          : prev.estimatedBudget,
                      }));
                    }
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={key || option._id || option.title} {...otherProps}>
                        <Box sx={{ width: "100%", py: 0.5 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>
                            {option.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>
                            {option.priceInr ? `${inr(option.priceInr)} / person` : ""}
                            {option.state ? ` • ${option.state}` : ""}
                            {option.durationDays ? ` • ${option.durationDays} Days` : ""}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      required
                      label={
                        <span>
                          Deal / Journey Pipeline Title <span style={{ color: "#ef4444", fontWeight: 800 }}>*</span>
                        </span>
                      }
                      placeholder="Search tour from DB or type custom journey title..."
                      helperText="Searches tour titles directly from DB. Auto-fills journey details & budget."
                    />
                  )}
                />
              </Grid>

              {/* Customer Name (Required *) */}
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label={
                    <span>
                      Customer Name <span style={{ color: "#ef4444", fontWeight: 800 }}>*</span>
                    </span>
                  }
                  placeholder="e.g. Rahul Sharma"
                  value={addForm.customerName}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, customerName: e.target.value }))}
                  helperText="Primary traveler / contact person"
                />
              </Grid>

              {/* Customer Contact (Optional) */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Phone Number (Optional)"
                  placeholder="+91 98765 43210"
                  value={addForm.customerPhone}
                  onChange={(e) => setAddForm({ ...addForm, customerPhone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address (Optional)"
                  type="email"
                  placeholder="client@example.com"
                  value={addForm.customerEmail}
                  onChange={(e) => setAddForm({ ...addForm, customerEmail: e.target.value })}
                />
              </Grid>

              {/* Destination (Optional) */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Destination (Optional)</InputLabel>
                  <Select
                    value={addForm.destinationId}
                    label="Destination (Optional)"
                    onChange={(e) => setAddForm({ ...addForm, destinationId: e.target.value })}
                  >
                    <MenuItem value="">None / Auto from Tour</MenuItem>
                    {destinations.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name}, {d.state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Value and Travelers */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Estimated Budget (₹)"
                  value={addForm.estimatedBudget}
                  onChange={(e) => setAddForm({ ...addForm, estimatedBudget: Number(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Travelers (Pax)"
                  value={addForm.numberOfTravelers}
                  onChange={(e) => setAddForm({ ...addForm, numberOfTravelers: Number(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Expected Travel Date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={addForm.expectedTravelDate}
                  onChange={(e) => setAddForm({ ...addForm, expectedTravelDate: e.target.value })}
                />
              </Grid>

              {/* Priority & Source */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={addForm.priority}
                    label="Priority"
                    onChange={(e) => setAddForm({ ...addForm, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lead Source</InputLabel>
                  <Select
                    value={addForm.source}
                    label="Lead Source"
                    onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
                  >
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                      <MenuItem key={k} value={k}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Initial Stage</InputLabel>
                  <Select
                    value={addForm.stage}
                    label="Initial Stage"
                    onChange={(e) => setAddForm({ ...addForm, stage: e.target.value })}
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Admin: Assign Partner */}
              {role === "admin" && (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Assign to Partner (Optional)</InputLabel>
                    <Select
                      value={addForm.partnerId}
                      label="Assign to Partner (Optional)"
                      onChange={(e) => setAddForm({ ...addForm, partnerId: e.target.value })}
                      renderValue={(selected) => {
                        if (!selected) return <span style={{ color: "#94a3b8" }}>Unassigned (Admin Managed)</span>;
                        const p = partners.find((x) => x._id === selected);
                        return p ? formatPartnerWithLocation(p) : selected;
                      }}
                    >
                      <MenuItem value="">Unassigned (Admin Managed)</MenuItem>
                      {partners.map((p) => {
                        const loc = getPartnerLocation(p);
                        return (
                          <MenuItem key={p._id} value={p._id}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 2 }}>
                              <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
                                {p.name} {p.companyName ? `(${p.companyName})` : ""}
                              </Typography>
                              {loc ? (
                                <Typography
                                  component="span"
                                  sx={{
                                    fontSize: "0.73rem",
                                    color: "#0284c7",
                                    bgcolor: "#f0f9ff",
                                    border: "1px solid #bae6fd",
                                    px: 1,
                                    py: 0.2,
                                    borderRadius: "4px",
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  📍 {loc}
                                </Typography>
                              ) : (
                                <Typography component="span" sx={{ fontSize: "0.73rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                                  📍 No location
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Requirements & Follow-up */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Travel Requirements & Special Requests"
                  placeholder="Hotel category, transport preferences, special meals, dietary requests..."
                  value={addForm.requirements}
                  onChange={(e) => setAddForm({ ...addForm, requirements: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Schedule First Follow-up Date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={addForm.nextFollowUp}
                  onChange={(e) => setAddForm({ ...addForm, nextFollowUp: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Follow-up Action"
                  placeholder="e.g. Call client with hotel choices"
                  value={addForm.nextFollowUpNotes}
                  onChange={(e) => setAddForm({ ...addForm, nextFollowUpNotes: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e2e8f0", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            <span style={{ color: "#ef4444", fontWeight: 800 }}>*</span> Only <b>Deal / Journey Title</b> and <b>Customer Name</b> are required.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button onClick={() => setOpenAddDialog(false)} sx={{ color: "#64748b" }}>
              Cancel
            </Button>
            <Tooltip
              title={
                !addForm.title?.trim() || !addForm.customerName?.trim()
                  ? "Please enter Deal / Journey Title and Customer Name to save lead"
                  : ""
              }
            >
              <span>
                <Button
                  type="submit"
                  form="add-lead-form"
                  variant="contained"
                  disabled={!addForm.title?.trim() || !addForm.customerName?.trim() || savingLead}
                  sx={{
                    bgcolor: "#0f172a",
                    color: "#ffffff",
                    fontWeight: 700,
                    borderRadius: "6px",
                    px: 3,
                    "&:hover": { bgcolor: "#1e293b" },
                    "&.Mui-disabled": {
                      bgcolor: "#e2e8f0",
                      color: "#94a3b8",
                    },
                  }}
                >
                  {savingLead ? "Creating..." : "Save Lead"}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </DialogActions>
      </Dialog>

      {/* ================= CONVERT TO BOOKING DIALOG ================= */}
      <Dialog
        open={openConvertDialog}
        onClose={() => setOpenConvertDialog(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "8px" } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#0f172a", borderBottom: "1px solid #e2e8f0" }}>
          Convert Lead to Confirmed Booking
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: "6px" }}>
            This will create a verified Booking in the database, generate a booking reference, and mark this deal as Won.
          </Alert>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tour Package</InputLabel>
                <Select
                  value={convertTourId}
                  label="Tour Package"
                  onChange={(e) => {
                    setConvertTourId(e.target.value);
                    const t = tours.find((tour) => tour._id === e.target.value);
                    if (t) setConvertAmount(t.priceInr * convertPax);
                  }}
                >
                  {tours.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.title} ({inr(t.priceInr)} / person)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Travel Date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={convertTravelDate}
                onChange={(e) => setConvertTravelDate(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Travelers (Pax)"
                value={convertPax}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  setConvertPax(p);
                  const t = tours.find((tour) => tour._id === convertTourId);
                  if (t) setConvertAmount(t.priceInr * p);
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Total Booking Amount (₹)"
                value={convertAmount}
                onChange={(e) => setConvertAmount(Number(e.target.value))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => setOpenConvertDialog(false)} sx={{ color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmConvert}
            disabled={converting}
            sx={{
              bgcolor: "#facc15",
              color: "#0f172a",
              fontWeight: 800,
              borderRadius: "6px",
              px: 3,
              "&:hover": { bgcolor: "#eab308" },
            }}
          >
            {converting ? "Converting..." : "Confirm & Create Booking"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
