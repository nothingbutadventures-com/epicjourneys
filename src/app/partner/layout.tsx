"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Avatar,
  Tooltip,
  Collapse,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import BookOnlineRoundedIcon from "@mui/icons-material/BookOnlineRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

const DRAWER_WIDTH = 230;

type Child = { text: string; href: string; icon: React.ReactNode };
type NavItem = { text: string; href?: string; icon: React.ReactNode; children?: Child[] };

const NAV_ITEMS: NavItem[] = [
  {
    text: "Dashboard",
    href: "/partner",
    icon: <DashboardRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "CRM",
    icon: <LeaderboardRoundedIcon sx={{ fontSize: 18 }} />,
    children: [{ text: "Leads", href: "/partner/leads", icon: <TrendingUpRoundedIcon sx={{ fontSize: 16 }} /> }],
  },
  {
    text: "Bookings",
    icon: <BookOnlineRoundedIcon sx={{ fontSize: 18 }} />,
    children: [
      { text: "Your Bookings", href: "/partner/bookings", icon: <ReceiptLongRoundedIcon sx={{ fontSize: 16 }} /> },
      { text: "Book a Tour", href: "/partner/city-tours", icon: <MapRoundedIcon sx={{ fontSize: 16 }} /> },
    ],
  },
  {
    text: "Commission",
    href: "/partner/commission",
    icon: <SavingsRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Tour Launches",
    icon: <RocketLaunchRoundedIcon sx={{ fontSize: 18 }} />,
    children: [
      { text: "Tour Requests", href: "/partner/tours", icon: <LuggageRoundedIcon sx={{ fontSize: 16 }} /> },
      { text: "My Requests", href: "/partner/requests", icon: <AssignmentRoundedIcon sx={{ fontSize: 16 }} /> },
    ],
  },
];

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  // Groups the user has toggled by hand; a group containing the current page is open by default.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (pathname === "/partner/login") return;
    try {
      const u = localStorage.getItem("epic_partner_user");
      if (u) setPartner(JSON.parse(u));
    } catch {}
    // The assigned city's name comes from the server (the stored login only has an id).
    const t = localStorage.getItem("epic_partner_token");
    fetch("/api/partners", { headers: t ? { Authorization: `Bearer ${t}` } : {} })
      .then((r) => r.json())
      .then((d) => d.success && d.data?.[0] && setPartner((p: any) => ({ ...(p || {}), ...d.data[0] })))
      .catch(() => {});
  }, [pathname]);

  if (pathname === "/partner/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/me", { method: "POST" });
    } catch {}
    localStorage.removeItem("epic_partner_token");
    localStorage.removeItem("epic_partner_user");
    router.push("/partner/login");
  };

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#ffffff",
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          height: 48,
          minHeight: 48,
          maxHeight: 48,
          boxSizing: "border-box",
          px: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Box component="img" src="/favicon.svg" alt="EpicJourneys" sx={{ width: 26, height: 26, flexShrink: 0 }} />
        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography
            noWrap
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.15,
              fontSize: "0.82rem",
            }}
          >
            EpicJourneys
          </Typography>
          <Typography
            noWrap
            sx={{
              color: "#64748b",
              fontSize: "0.65rem",
              fontWeight: 500,
              lineHeight: 1.1,
            }}
          >
            Partner Portal
          </Typography>
        </Box>
      </Box>

      {/* Nav List */}
      <List sx={{ px: 1, py: 1.5, flexGrow: 1, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = (href: string) =>
            pathname === href ||
            (href !== "/partner" && pathname.startsWith(`${href}/`)) ||
            (href === "/partner/bookings" && pathname.startsWith("/partner/invoice"));
          const btnSx = (active: boolean, indent = 0) => ({
            borderRadius: "4px",
            py: 0.75,
            px: 1.25,
            pl: 1.25 + indent,
            bgcolor: active ? "#0f172a" : "transparent",
            color: active ? "#ffffff" : "#475569",
            "&:hover": { bgcolor: active ? "#1e293b" : "#f8fafc", color: active ? "#ffffff" : "#0f172a" },
          });
          const labelSx = (active: boolean) => ({ primary: { sx: { fontSize: "0.8rem", fontWeight: active ? 600 : 500 } } });

          if (item.children) {
            const childActive = item.children.some((c) => isActive(c.href));
            const open = toggled[item.text] ?? childActive;
            return (
              <React.Fragment key={item.text}>
                <ListItem disablePadding sx={{ mb: 0.25 }}>
                  <ListItemButton onClick={() => setToggled((t) => ({ ...t, [item.text]: !open }))} aria-expanded={open} sx={{ ...btnSx(false), color: childActive ? "#0f172a" : "#475569" }}>
                    <ListItemIcon sx={{ minWidth: 28, color: childActive ? "#0f172a" : "#64748b" }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} slotProps={labelSx(childActive)} />
                    <ExpandMoreRoundedIcon sx={{ fontSize: 18, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
                  </ListItemButton>
                </ListItem>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ mb: 0.25 }}>
                    {item.children.map((c) => {
                      const active = isActive(c.href);
                      return (
                        <ListItem key={c.text} disablePadding sx={{ mb: 0.25 }}>
                          <ListItemButton component={Link} href={c.href} onClick={() => setMobileOpen(false)} sx={btnSx(active, 2)}>
                            <ListItemIcon sx={{ minWidth: 26, color: active ? "#ffffff" : "#64748b" }}>{c.icon}</ListItemIcon>
                            <ListItemText primary={c.text} slotProps={labelSx(active)} />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          const active = isActive(item.href!);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton component={Link} href={item.href!} onClick={() => setMobileOpen(false)} sx={btnSx(active)}>
                <ListItemIcon sx={{ minWidth: 28, color: active ? "#ffffff" : "#64748b" }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} slotProps={labelSx(active)} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "#f1f5f9" }} />

      {/* Bottom Area */}
      <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Button
          component={Link}
          href="/"
          target="_blank"
          startIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
          variant="outlined"
          size="small"
          fullWidth
          sx={{
            borderColor: "#e2e8f0",
            color: "#475569",
            fontSize: "0.75rem",
            justifyContent: "flex-start",
            borderRadius: "4px",
            py: 0.5,
          }}
        >
          Live Website
        </Button>

        <Button
          onClick={handleLogout}
          startIcon={<LogoutRoundedIcon sx={{ fontSize: 14 }} />}
          variant="text"
          size="small"
          fullWidth
          sx={{
            color: "#ef4444",
            fontSize: "0.75rem",
            justifyContent: "flex-start",
            borderRadius: "4px",
            py: 0.5,
            "&:hover": { bgcolor: "#fef2f2" },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          color: "#0f172a",
          height: 48,
          minHeight: 48,
          maxHeight: 48,
          boxSizing: "border-box",
          justifyContent: "center",
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            minHeight: "48px !important",
            height: "48px !important",
            px: { xs: 2, sm: 2.5 },
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ display: { md: "none" } }}
              size="small"
            >
              <MenuRoundedIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: "#64748b", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <LocationOnRoundedIcon sx={{ fontSize: 14 }} />
              Location:{" "}
              <span style={{ color: "#0f172a", fontWeight: 700 }}>
                {partner?.assignedDestination?.name || "Not assigned"}
              </span>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={partner?.name || "Destination Partner"}
              size="small"
              sx={{
                bgcolor: "#f1f5f9",
                color: "#0f172a",
                fontWeight: 600,
                fontSize: "0.7rem",
                borderRadius: "4px",
                height: 20,
              }}
            />
            <Avatar
              sx={{
                width: 24,
                height: 24,
                bgcolor: "#0f172a",
                fontSize: "0.7rem",
                borderRadius: "4px",
              }}
            >
              {(partner?.name || "P").charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRight: "1px solid #e2e8f0",
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRight: "1px solid #e2e8f0",
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 2.5 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: "48px",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
