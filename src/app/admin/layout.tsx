"use client";

import React, { useState } from "react";
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
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import BookOnlineRoundedIcon from "@mui/icons-material/BookOnlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import StyleRoundedIcon from "@mui/icons-material/StyleRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import StarRateRoundedIcon from "@mui/icons-material/StarRateRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import ContactSupportRoundedIcon from "@mui/icons-material/ContactSupportRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

const DRAWER_WIDTH = 230;

type NavItem = {
  text: string;
  href?: string;
  icon: React.ReactNode;
  children?: { text: string; href: string; icon: React.ReactNode }[];
};

const NAV_ITEMS: NavItem[] = [
  {
    text: "Dashboard",
    href: "/admin",
    icon: <DashboardRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "CRM",
    icon: <LeaderboardRoundedIcon sx={{ fontSize: 18 }} />,
    children: [
      {
        text: "Leads",
        href: "/admin/leads",
        icon: <TrendingUpRoundedIcon sx={{ fontSize: 16 }} />,
      },
    ],
  },
  {
    text: "Tours Management",
    href: "/admin/tours",
    icon: <LuggageRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Partner Requests",
    href: "/admin/launches",
    icon: <RocketLaunchRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Destinations & Cities",
    href: "/admin/locations",
    icon: <MapRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Partner Accounts",
    href: "/admin/partners",
    icon: <HandshakeRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Passenger Bookings",
    href: "/admin/bookings",
    icon: <BookOnlineRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Travel Styles",
    href: "/admin/travel-styles",
    icon: <StyleRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Physical Rating",
    href: "/admin/physical-ratings",
    icon: <FitnessCenterRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Discounts",
    href: "/admin/discounts",
    icon: <PercentRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Promo Codes",
    href: "/admin/promo-codes",
    icon: <ConfirmationNumberRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "User Management",
    href: "/admin/users",
    icon: <PeopleAltRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Cancellations",
    href: "/admin/cancellations",
    icon: <EventBusyRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Reviews",
    href: "/admin/reviews",
    icon: <StarRateRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    text: "Queries",
    href: "/admin/queries",
    icon: <ContactSupportRoundedIcon sx={{ fontSize: 18 }} />,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Accordion groups the user has explicitly toggled; a group containing the
  // current page is open by default.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/me", { method: "POST" });
    } catch {}
    localStorage.removeItem("epic_token");
    localStorage.removeItem("epic_user");
    router.push("/admin/login");
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
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "4px",
            bgcolor: "#0f172a",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "0.72rem",
            flexShrink: 0,
          }}
        >
          EJ
        </Box>
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
            Control Center
          </Typography>
        </Box>
      </Box>

      {/* Nav List */}
      <List sx={{ px: 1, py: 1.5, flexGrow: 1, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = (href: string) =>
            pathname === href || (href !== "/admin" && pathname.startsWith(href));
          const btnSx = (active: boolean, indent = 0) => ({
            borderRadius: "4px",
            py: 0.75,
            px: 1.25,
            pl: 1.25 + indent,
            bgcolor: active ? "#0f172a" : "transparent",
            color: active ? "#ffffff" : "#475569",
            "&:hover": {
              bgcolor: active ? "#1e293b" : "#f8fafc",
              color: active ? "#ffffff" : "#0f172a",
            },
          });
          const labelSx = (active: boolean) => ({
            primary: { sx: { fontSize: "0.8rem", fontWeight: active ? 600 : 500 } },
          });

          if (item.children) {
            const childActive = item.children.some((c) => isActive(c.href));
            const open = toggled[item.text] ?? childActive;
            return (
              <React.Fragment key={item.text}>
                <ListItem disablePadding sx={{ mb: 0.25 }}>
                  <ListItemButton
                    onClick={() =>
                      setToggled((t) => ({ ...t, [item.text]: !open }))
                    }
                    aria-expanded={open}
                    sx={{
                      ...btnSx(false),
                      color: childActive ? "#0f172a" : "#475569",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28, color: childActive ? "#0f172a" : "#64748b" }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} slotProps={labelSx(childActive)} />
                    <ExpandMoreRoundedIcon
                      sx={{
                        fontSize: 18,
                        transition: "transform 0.2s",
                        transform: open ? "rotate(180deg)" : "none",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ mb: 0.25 }}>
                    {item.children.map((c) => {
                      const active = isActive(c.href);
                      return (
                        <ListItem key={c.text} disablePadding sx={{ mb: 0.25 }}>
                          <ListItemButton
                            component={Link}
                            href={c.href}
                            onClick={() => setMobileOpen(false)}
                            sx={btnSx(active, 2)}
                          >
                            <ListItemIcon sx={{ minWidth: 26, color: active ? "#ffffff" : "#64748b" }}>
                              {c.icon}
                            </ListItemIcon>
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
              <ListItemButton
                component={Link}
                href={item.href!}
                onClick={() => setMobileOpen(false)}
                sx={btnSx(active)}
              >
                <ListItemIcon sx={{ minWidth: 28, color: active ? "#ffffff" : "#64748b" }}>
                  {item.icon}
                </ListItemIcon>
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
              sx={{ fontWeight: 600, color: "#64748b", fontSize: "0.75rem" }}
            >
              Domain:{" "}
              <span style={{ color: "#0f172a", fontWeight: 700 }}>
                epicjourneys.in
              </span>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label="Super Admin"
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
              A
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
