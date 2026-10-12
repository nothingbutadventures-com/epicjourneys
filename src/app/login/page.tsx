"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, CircularProgress, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { safeRedirect, withRedirect } from "@/lib/redirect";
import AuthShell, { fieldSx, submitSx } from "@/components/AuthShell";

function LoginForm() {
  const router = useRouter();
  const redirect = useSearchParams().get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(safeRedirect(redirect));
        router.refresh();
      } else if (data.code === "EMAIL_NOT_VERIFIED") {
        await fetch("/api/auth/resend-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        }).catch(() => {});
        router.push(withRedirect(`/verify-email?email=${encodeURIComponent(data.email)}`, redirect));
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your journeys."
      footer={
        <>
          New to EpicJourneys?{" "}
          <Link href={withRedirect("/register", redirect)} style={{ color: "#ca8a04", fontWeight: 700 }}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit}>
        <Stack spacing={2.25}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email address"
            type="email"
            autoComplete="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={fieldSx}
          />
          <TextField
            label="Password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            }}
          />
          <Button type="submit" variant="contained" disabled={loading} sx={submitSx}>
            {loading ? <CircularProgress size={22} color="inherit" /> : "Log in"}
          </Button>
        </Stack>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
