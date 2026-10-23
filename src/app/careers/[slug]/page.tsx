"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, Chip, CircularProgress, Container, Grid, Paper, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ApplyForm from "@/components/careers/ApplyForm";

const modeLabel: Record<string, string> = { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" };

const List = ({ title, items }: { title: string; items: string[] }) =>
  items?.length ? (
    <Box sx={{ mb: 3.5 }}>
      <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.2rem", mb: 1.25 }}>{title}</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5, color: "#475569", lineHeight: 1.75 }}>
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </Box>
    </Box>
  ) : null;

export default function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [job, setJob] = useState<any | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/jobs/${slug}`)
      .then((r) => r.json())
      .then((d) => setJob(d.success ? d.data : null))
      .catch(() => setJob(null));
  }, [slug]);

  const facts = job
    ? [
        ["Department", job.department], ["Location", job.location], ["Work mode", modeLabel[job.workMode] || job.workMode],
        ["Job type", job.type], ["Experience", job.experience], ["Salary", job.salary],
        ["Openings", job.openings > 1 ? String(job.openings) : ""],
        ["Apply by", job.closingDate ? new Date(job.closingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""],
      ].filter(([, v]) => v)
    : [];

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#ffffff" }}>
      <Navbar />

      {job === undefined ? (
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 10 }}><CircularProgress sx={{ color: "#0f172a" }} /></Box>
      ) : job === null ? (
        <Container maxWidth="sm" sx={{ py: 10, flexGrow: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>This role is no longer open, or the link is incorrect.</Alert>
          <Button component={Link} href="/careers" variant="contained" startIcon={<ArrowBackRoundedIcon />} sx={{ bgcolor: "#0f172a" }}>See all open roles</Button>
        </Container>
      ) : (
        <>
          <Box sx={{ bgcolor: "#FFF3DB", borderBottom: "1px solid #FFD699" }}>
            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
              <Button component={Link} href="/careers" size="small" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2, color: "#475569" }}>All roles</Button>
              <Typography component="h1" sx={{ fontSize: { xs: "1.9rem", md: "2.7rem" }, fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.03em" }}>{job.title}</Typography>
              <Box sx={{ display: "flex", gap: 0.75, mt: 2, flexWrap: "wrap", alignItems: "center" }}>
                <Chip label={job.department} size="small" sx={{ bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, borderRadius: "4px" }} />
                <Chip label={job.type} size="small" sx={{ textTransform: "capitalize", bgcolor: "#fff", borderRadius: "4px" }} />
                <Chip label={modeLabel[job.workMode] || job.workMode} size="small" sx={{ bgcolor: "#fff", borderRadius: "4px" }} />
                <Box sx={{ display: "inline-flex", alignItems: "center", color: "#475569", fontSize: "0.9rem", ml: 0.5 }}><PlaceRoundedIcon sx={{ fontSize: 18 }} />{job.location}</Box>
              </Box>
              <Button href="#apply" variant="contained" sx={{ mt: 3, px: 3.5, py: 1.2, bgcolor: "#0f172a", color: "#fff", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#1e293b" } }}>Apply now</Button>
            </Container>
          </Box>

          <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, flexGrow: 1 }}>
            <Grid container spacing={{ xs: 4, md: 6 }}>
              <Grid size={{ xs: 12, md: 8 }}>
                {job.description && (
                  <Box sx={{ mb: 3.5 }}>
                    <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.2rem", mb: 1.25 }}>About the role</Typography>
                    <Typography sx={{ color: "#475569", lineHeight: 1.8, whiteSpace: "pre-line" }}>{job.description}</Typography>
                  </Box>
                )}
                <List title="What you'll do" items={job.responsibilities} />
                <List title="What we're looking for" items={job.requirements} />
                <List title="Nice to have" items={job.niceToHave} />
                <Box sx={{ mt: 5 }}>
                  <ApplyForm id="apply" job={{ _id: job._id, title: job.title }} />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper elevation={0} sx={{ p: 2.75, border: "1px solid #E2E2E2", position: { md: "sticky" }, top: 90 }}>
                  <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Role details</Typography>
                  {facts.map(([l, v]) => (
                    <Box key={l} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1, borderBottom: "1px solid #F1F5F9", "&:last-of-type": { borderBottom: 0 } }}>
                      <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>{l}</Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", textAlign: "right", textTransform: l === "Job type" ? "capitalize" : "none" }}>{v}</Typography>
                    </Box>
                  ))}
                  <Button href="#apply" fullWidth variant="contained" sx={{ mt: 2, py: 1.1, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#E68A00" } }}>Apply for this role</Button>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </>
      )}
      <Footer />
    </Box>
  );
}
