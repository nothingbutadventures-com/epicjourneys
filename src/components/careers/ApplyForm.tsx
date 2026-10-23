"use client";

import React, { useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Grid, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

const initial = {
  name: "", email: "", phone: "", city: "", experienceYears: "", currentCompany: "", noticePeriod: "",
  expectedSalary: "", linkedin: "", portfolio: "", coverLetter: "", website: "", // website = honeypot
};

export default function ApplyForm({ job, id }: { job?: { _id: string; title: string } | null; id?: string }) {
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pick = (f: File | null) => {
    setError(null);
    if (!f) return setFile(null);
    if (f.size > 3 * 1024 * 1024) return setError("Your resume must be 3 MB or smaller.");
    if (!/\.(pdf|docx?)$/i.test(f.name)) return setError("Upload your resume as a PDF, DOC or DOCX file.");
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Please attach your resume.");
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (job) fd.append("jobId", job._id);
      fd.append("resume", file);
      const res = await fetch("/api/careers/apply", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't send your application");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Paper id={id} elevation={0} sx={{ p: { xs: 3, md: 5 }, textAlign: "center", border: "1px solid #E2E2E2" }}>
        <CheckCircleRoundedIcon sx={{ fontSize: 56, color: "#16a34a" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", mt: 1 }}>Application received</Typography>
        <Typography sx={{ color: "#64748b", mt: 1, maxWidth: 440, mx: "auto" }}>
          Thanks, {form.name.split(" ")[0]}. We&apos;ve emailed a confirmation to {form.email}. Our team reviews every application and will get back to you soon.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper id={id} elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: "1px solid #E2E2E2", scrollMarginTop: 90 }}>
      <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.4rem", mb: 0.5 }}>{job ? `Apply for ${job.title}` : "Send us your CV"}</Typography>
      <Typography sx={{ color: "#64748b", fontSize: "0.9rem", mb: 3 }}>
        {job ? "Fields marked * are required." : "Don't see a role that fits? Tell us about yourself and we'll keep you in mind. Fields marked * are required."}
      </Typography>
      <form onSubmit={submit}>
        {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
        <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} style={{ position: "absolute", left: "-9999px", opacity: 0 }} aria-hidden="true" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Full name" required fullWidth value={form.name} onChange={set("name")} autoComplete="name" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email address" type="email" required fullWidth value={form.email} onChange={set("email")} autoComplete="email" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Mobile number" type="tel" required fullWidth value={form.phone} onChange={set("phone")}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> }, htmlInput: { inputMode: "numeric", maxLength: 12 } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Current city" fullWidth value={form.city} onChange={set("city")} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Years of experience" type="number" fullWidth value={form.experienceYears} onChange={set("experienceYears")} slotProps={{ htmlInput: { min: 0, max: 60, step: 0.5 } }} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Current company" fullWidth value={form.currentCompany} onChange={set("currentCompany")} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Notice period" fullWidth value={form.noticePeriod} onChange={set("noticePeriod")} placeholder="e.g. 30 days" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Expected salary (optional)" fullWidth value={form.expectedSalary} onChange={set("expectedSalary")} placeholder="e.g. ₹5 LPA" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="LinkedIn profile (optional)" fullWidth value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/…" /></Grid>
          <Grid size={{ xs: 12 }}><TextField label="Portfolio / website (optional)" fullWidth value={form.portfolio} onChange={set("portfolio")} placeholder="https://" /></Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Why EpicJourneys? (optional)" fullWidth multiline minRows={4} value={form.coverLetter} onChange={set("coverLetter")} slotProps={{ htmlInput: { maxLength: 3000 } }} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => pick(e.target.files?.[0] || null)} />
            <Box
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0] || null); }}
              sx={{ cursor: "pointer", p: 2.5, textAlign: "center", border: "2px dashed", borderColor: file ? "#FF9900" : "#cbd5e1", bgcolor: file ? "#FFF6E5" : "#fafafa", borderRadius: "4px" }}
            >
              <UploadFileRoundedIcon sx={{ color: file ? "#B36B00" : "#94a3b8" }} />
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{file ? file.name : "Attach your resume *"}</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB · click to replace` : "PDF, DOC or DOCX · up to 3 MB · click or drop a file"}</Typography>
            </Box>
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" size="large" disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />}
          sx={{ mt: 3, px: 4, py: 1.2, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#E68A00" } }}>
          Submit application
        </Button>
      </form>
    </Paper>
  );
}
