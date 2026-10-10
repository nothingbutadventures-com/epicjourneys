"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import AuthShell, { submitSx } from "@/components/AuthShell";

const LEN = 6;

function VerifyForm() {
  const router = useRouter();
  const email = useSearchParams().get("email") || "";
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(30);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const code = digits.join("");

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "");
    if (!d) {
      setDigits((arr) => arr.map((x, j) => (j === i ? "" : x)));
      return;
    }
    // Supports typing and pasting multiple digits.
    setDigits((arr) => {
      const next = [...arr];
      d.slice(0, LEN - i).split("").forEach((ch, k) => (next[i + k] = ch));
      return next;
    });
    refs.current[Math.min(i + d.length, LEN - 1)]?.focus();
  };

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== LEN) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Verification failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setInfo("A new code has been sent.");
      setDigits(Array(LEN).fill(""));
      setCooldown(30);
      refs.current[0]?.focus();
    } else {
      setError(data.error || "Could not resend code");
    }
  };

  if (!email) {
    return (
      <Alert severity="warning">
        No email to verify. <Link href="/register">Create an account</Link> first.
      </Alert>
    );
  }

  return (
    <form onSubmit={verify}>
      <Stack spacing={2.5}>
        {error && <Alert severity="error">{error}</Alert>}
        {info && <Alert severity="success">{info}</Alert>}
        <Box sx={{ display: "flex", gap: 1.25, justifyContent: "space-between" }}>
          {digits.map((d, i) => (
            <Box
              key={i}
              component="input"
              ref={(el: HTMLInputElement | null) => {
                refs.current[i] = el;
              }}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              autoFocus={i === 0}
              aria-label={`Digit ${i + 1}`}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDigit(i, e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
              }}
              sx={{
                width: "100%",
                minWidth: 0,
                height: 56,
                textAlign: "center",
                fontSize: "1.5rem",
                fontWeight: 700,
                fontFamily: "inherit",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                outline: "none",
                bgcolor: "#fff",
                "&:focus": { borderColor: "#0f172a", boxShadow: "0 0 0 3px rgba(15,23,42,0.1)" },
              }}
            />
          ))}
        </Box>
        <Button type="submit" variant="contained" disabled={loading || code.length !== LEN} sx={submitSx}>
          {loading ? <CircularProgress size={22} color="inherit" /> : "Verify & continue"}
        </Button>
        <Typography sx={{ textAlign: "center", fontSize: "0.9rem", color: "#64748b" }}>
          Didn&apos;t get it?{" "}
          <Box
            component="button"
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            sx={{ border: 0, bgcolor: "transparent", p: 0, font: "inherit", fontWeight: 700, color: cooldown > 0 ? "#94a3b8" : "#ca8a04", cursor: cooldown > 0 ? "default" : "pointer" }}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </Box>
        </Typography>
      </Stack>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyShell />
    </Suspense>
  );
}

function VerifyShell() {
  const email = useSearchParams().get("email") || "your email";
  return (
    <AuthShell
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email}. It expires in 10 minutes.`}
      footer={<Link href="/register" style={{ color: "#ca8a04", fontWeight: 700 }}>Use a different email</Link>}
    >
      <VerifyForm />
    </AuthShell>
  );
}
