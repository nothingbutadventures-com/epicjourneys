"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Button, Chip, CircularProgress, Container, MenuItem, Paper, TextField, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ApplyForm from "@/components/careers/ApplyForm";

const modeLabel: Record<string, string> = { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" };

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[] | null>(null);
  const [dept, setDept] = useState("all");
  const [loc, setLoc] = useState("all");

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(d.success ? d.data : []))
      .catch(() => setJobs([]));
  }, []);

  const depts = useMemo(() => [...new Set((jobs || []).map((j) => j.department))].sort(), [jobs]);
  const locs = useMemo(() => [...new Set((jobs || []).map((j) => j.location))].sort(), [jobs]);
  const shown = (jobs || []).filter((j) => (dept === "all" || j.department === dept) && (loc === "all" || j.location === loc));

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#ffffff" }}>
      <Navbar />

      <Box sx={{ bgcolor: "#FFF3DB", borderBottom: "1px solid #FFD699" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
          <Chip label="We're hiring" size="small" sx={{ mb: 2, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, borderRadius: "4px" }} />
          <Typography component="h1" sx={{ fontSize: { xs: "2.1rem", md: "3.2rem" }, fontWeight: 800, color: "#0f172a", lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 760 }}>
            Build the way India <Box component="span" sx={{ bgcolor: "#FF9900", px: 1 }}>travels</Box>
          </Typography>
          <Typography sx={{ mt: 2.5, color: "#475569", fontSize: "1.1rem", maxWidth: 620, lineHeight: 1.65 }}>
            EpicJourneys creates group tours across India, run with local partners in every city. Join the team that makes every trip unforgettable.
          </Typography>
          <Button href="#roles" variant="contained" endIcon={<ArrowForwardRoundedIcon />} sx={{ mt: 3.5, px: 3.5, py: 1.3, bgcolor: "#0f172a", color: "#fff", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#1e293b" } }}>
            See open roles{jobs ? ` (${jobs.length})` : ""}
          </Button>
        </Container>
      </Box>

      <Box sx={{ bgcolor: "#FAFAFA", borderTop: "1px solid #E2E2E2", borderBottom: "1px solid #E2E2E2" }}>
        <Container maxWidth="lg" id="roles" sx={{ py: { xs: 5, md: 7 }, scrollMarginTop: 80 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <Box>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.7rem", letterSpacing: "-0.02em" }}>Open roles</Typography>
              <Typography sx={{ color: "#64748b", mt: 0.5 }}>{jobs ? `${jobs.length} position${jobs.length === 1 ? "" : "s"} open right now` : "Loading…"}</Typography>
            </Box>
            {jobs && jobs.length > 1 && (
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <TextField select size="small" label="Department" value={dept} onChange={(e) => setDept(e.target.value)} sx={{ minWidth: 190, bgcolor: "#fff" }}>
                  <MenuItem value="all">All departments</MenuItem>
                  {depts.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Location" value={loc} onChange={(e) => setLoc(e.target.value)} sx={{ minWidth: 190, bgcolor: "#fff" }}>
                  <MenuItem value="all">All locations</MenuItem>
                  {locs.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </TextField>
              </Box>
            )}
          </Box>

          {jobs === null ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress sx={{ color: "#0f172a" }} /></Box>
          ) : shown.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: "1px solid #E2E2E2" }}>
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>{jobs.length === 0 ? "No open roles right now" : "No roles match these filters"}</Typography>
              <Typography sx={{ color: "#64748b" }}>We&apos;re always happy to meet great people — send us your CV below and we&apos;ll reach out when something fits.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {shown.map((j) => (
                <Paper key={j._id} component={Link} href={`/careers/${j.slug}`} elevation={0}
                  sx={{ display: "flex", alignItems: "center", gap: 2, p: { xs: 2, md: 2.75 }, border: "1px solid #E2E2E2", textDecoration: "none", color: "inherit", bgcolor: "#fff", "&:hover": { borderColor: "#FF9900", boxShadow: "0 4px 18px rgba(0,0,0,0.06)" } }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>{j.title}</Typography>
                    {j.summary && <Typography sx={{ color: "#64748b", fontSize: "0.9rem", mt: 0.5, lineHeight: 1.55 }}>{j.summary}</Typography>}
                    <Box sx={{ display: "flex", gap: 0.75, mt: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                      <Chip label={j.department} size="small" sx={{ bgcolor: "#FFF0D1", color: "#8A5200", fontWeight: 700, borderRadius: "4px" }} />
                      <Chip label={j.type} size="small" variant="outlined" sx={{ textTransform: "capitalize", borderRadius: "4px" }} />
                      <Chip label={modeLabel[j.workMode] || j.workMode} size="small" variant="outlined" sx={{ borderRadius: "4px" }} />
                      <Box sx={{ display: "inline-flex", alignItems: "center", color: "#64748b", fontSize: "0.82rem", ml: 0.5 }}><PlaceRoundedIcon sx={{ fontSize: 16 }} />{j.location}</Box>
                    </Box>
                  </Box>
                  <ArrowForwardRoundedIcon sx={{ color: "#FF9900", flexShrink: 0 }} />
                </Paper>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 5, md: 7 }, flexGrow: 1 }}>
        <ApplyForm id="apply" />
      </Container>

      <Footer />
    </Box>
  );
}
