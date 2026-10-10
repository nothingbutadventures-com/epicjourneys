"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import AuthShell, { fieldSx, submitSx } from "@/components/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""))) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="We'll email you a code to verify your address."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#ca8a04", fontWeight: 700 }}>
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit}>
        <Stack spacing={2.25}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Full name" autoComplete="name" required fullWidth value={form.name} onChange={set("name")} sx={fieldSx} />
          <TextField label="Email address" type="email" autoComplete="email" required fullWidth value={form.email} onChange={set("email")} sx={fieldSx} />
          <TextField
            label="Mobile number"
            type="tel"
            autoComplete="tel-national"
            required
            fullWidth
            value={form.phone}
            onChange={set("phone")}
            sx={fieldSx}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> },
              htmlInput: { inputMode: "numeric", maxLength: 12 },
            }}
          />
          <TextField
            label="Password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            fullWidth
            helperText="At least 8 characters"
            value={form.password}
            onChange={set("password")}
            sx={fieldSx}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="Toggle password visibility" onClick={() => setShowPw((v) => !v)} edge="end" size="small">
                      {showPw ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
              htmlInput: { minLength: 8 },
            }}
          />
          <Button type="submit" variant="contained" disabled={loading} sx={submitSx}>
            {loading ? <CircularProgress size={22} color="inherit" /> : "Create account"}
          </Button>
          <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", textAlign: "center" }}>
            By registering you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </Stack>
      </form>
    </AuthShell>
  );
}
