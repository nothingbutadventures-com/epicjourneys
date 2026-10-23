"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Button, Chip, CircularProgress, Container, Grid, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function OurPartnersPage() {
  const [items, setItems] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");

  useEffect(() => {
    fetch("/api/public/partners")
      .then((r) => r.json())
      .then((d) => setItems(d.success ? d.data : []))
      .catch(() => setItems([]));
  }, []);

  const states = useMemo(() => [...new Set((items || []).map((i) => i.state))].sort(), [items]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items || []).filter((i) => (state === "all" || i.state === state) && (!s || `${i.city} ${i.state} ${i.partner.name} ${i.partner.company}`.toLowerCase().includes(s)));
  }, [items, q, state]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#ffffff" }}>
      <Navbar />

      <Box sx={{ bgcolor: "#FFF3DB", borderBottom: "1px solid #FFD699" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          <Typography component="h1" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Our partners in <Box component="span" sx={{ bgcolor: "#FF9900", px: 1 }}>every city</Box>
          </Typography>
          <Typography sx={{ mt: 2, color: "#475569", fontSize: "1.05rem", maxWidth: 640, lineHeight: 1.6 }}>
            EpicJourneys runs tours with local partners who welcome you at the starting point and support you through the trip. Find the partner for your city and reach them directly.
          </Typography>
          {items && items.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, mt: 2.5, flexWrap: "wrap" }}>
              <Chip label={`${items.length} ${items.length === 1 ? "city" : "cities"}`} sx={{ bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, borderRadius: "4px" }} />
              <Chip label={`${states.length} ${states.length === 1 ? "state" : "states"}`} sx={{ bgcolor: "#fff", fontWeight: 700, borderRadius: "4px" }} />
            </Box>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, flexGrow: 1 }}>
        <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
          <TextField size="small" placeholder="Search city, state or partner…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 280 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment> } }} />
          <TextField select size="small" value={state} onChange={(e) => setState(e.target.value)} sx={{ minWidth: 200 }} slotProps={{ select: { native: true } }}>
            <option value="all">All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </TextField>
        </Box>

        {items === null ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#0f172a" }} /></Box>
        ) : shown.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: "1px solid #E2E2E2" }}>
            <Typography sx={{ fontWeight: 800 }}>{items.length === 0 ? "Partners will appear here soon" : "No partners match your search"}</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {shown.map((c) => (
              <Grid key={c.id} size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ height: "100%", border: "1px solid #E2E2E2", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: "flex", gap: 2, p: 2.25, borderBottom: "1px solid #F1F5F9" }}>
                    {c.coverImage && <Box component="img" src={c.coverImage} alt="" sx={{ width: 84, height: 84, objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", lineHeight: 1.2 }}>{c.city}</Typography>
                      <Typography sx={{ color: "#64748b", fontSize: "0.85rem" }}>{c.state}</Typography>
                      <Chip label={c.liveTours > 0 ? `${c.liveTours} tour${c.liveTours === 1 ? "" : "s"} starting here` : "No upcoming tours yet"} size="small" sx={{ mt: 1, borderRadius: "4px", fontWeight: 700, bgcolor: c.liveTours > 0 ? "#dcfce7" : "#f1f5f9", color: c.liveTours > 0 ? "#166534" : "#64748b" }} />
                    </Box>
                  </Box>

                  <Box sx={{ p: 2.25, bgcolor: "#FFFBF2" }}>
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#B36B00", mb: 0.75 }}>Local partner</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{c.partner.name}</Typography>
                    {c.partner.company && <Typography sx={{ color: "#64748b", fontSize: "0.85rem" }}>{c.partner.company}</Typography>}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1.25 }}>
                      {c.partner.phone && (
                        <Box component="a" href={`tel:+91${c.partner.phone}`} sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "#0f172a", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
                          <PhoneRoundedIcon sx={{ fontSize: 17, color: "#B36B00" }} />+91 {c.partner.phone}{c.partner.secondaryPhone ? ` · ${c.partner.secondaryPhone}` : ""}
                        </Box>
                      )}
                      <Box component="a" href={`mailto:${c.partner.email}`} sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "#0f172a", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, wordBreak: "break-all" }}>
                        <EmailRoundedIcon sx={{ fontSize: 17, color: "#B36B00" }} />{c.partner.email}
                      </Box>
                    </Box>
                  </Box>

                  {c.meetingPoints.length > 0 && (
                    <Box sx={{ p: 2.25, borderTop: "1px solid #F1F5F9", flexGrow: 1 }}>
                      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", mb: 1 }}>Meeting points</Typography>
                      {c.meetingPoints.map((m: any, i: number) => (
                        <Box key={i} sx={{ display: "flex", gap: 1, mb: 1, "&:last-child": { mb: 0 } }}>
                          <PlaceRoundedIcon sx={{ fontSize: 18, color: "#FF9900", mt: 0.2 }} />
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>{m.label}</Typography>
                            <Typography sx={{ color: "#64748b", fontSize: "0.82rem", lineHeight: 1.5 }}>{m.address}{m.landmark ? ` · Near ${m.landmark}` : ""}</Typography>
                            {m.mapUrl && <Typography component="a" href={m.mapUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#B36B00" }}>View on map</Typography>}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {c.liveTours > 0 && (
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button component={Link} href={`/tours?from=${c.id}`} size="small" startIcon={<MapRoundedIcon />} sx={{ color: "#0f172a", fontWeight: 700 }}>Browse tours from {c.city}</Button>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        <Paper elevation={0} sx={{ mt: 5, p: 3, border: "1px solid #FFD699", bgcolor: "#FFF6E5", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Don&apos;t see your city?</Typography>
            <Typography sx={{ color: "#475569", fontSize: "0.9rem" }}>Become the EpicJourneys partner for your city.</Typography>
          </Box>
          <Button component={Link} href="/become-a-partner" variant="contained" sx={{ bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#E68A00" } }}>Become a partner</Button>
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
}
