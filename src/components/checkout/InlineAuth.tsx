"use client";

import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";

type Mode = "login" | "register";
const LEN = 6;

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success !== false, data };
}

/**
 * Login / Register without leaving the page, so checkout state is never lost.
 * Calls onAuthed() once the session cookie is set (after login, or after email verification).
 */
export default function InlineAuth({ onAuthed, tourTitle }: { onAuthed: () => void; tourTitle: string }) {
  const [mode, setMode] = useState<Mode>("login");
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const [login, setLogin] = useState({ email: "", password: "" });
  const [reg, setReg] = useState({ name: "", email: "", phone: "", password: "" });

  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [cooldown, setCooldown] = useState(30);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!verifyEmail || cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [verifyEmail, cooldown]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { ok, data } = await post("/api/auth/login", login);
      if (ok) return onAuthed();
      if (data.code === "EMAIL_NOT_VERIFIED") {
        await post("/api/auth/resend-otp", { email: data.email });
        setVerifyEmail(data.email);
        setCooldown(30);
        return;
      }
      setError(data.error || "Login failed");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(reg.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""))) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      const { ok, data } = await post("/api/auth/register", reg);
      if (ok) {
        setVerifyEmail(data.email);
        setCooldown(30);
        setDigits(Array(LEN).fill(""));
      } else setError(data.error || "Registration failed");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const code = digits.join("");
  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "");
    if (!d) return setDigits((arr) => arr.map((x, j) => (j === i ? "" : x)));
    setDigits((arr) => {
      const next = [...arr];
      d.slice(0, LEN - i).split("").forEach((ch, k) => (next[i + k] = ch));
      return next;
    });
    refs.current[Math.min(i + d.length, LEN - 1)]?.focus();
  };

  const submitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== LEN || !verifyEmail) return;
    setLoading(true);
    setError(null);
    try {
      const { ok, data } = await post("/api/auth/verify-otp", { email: verifyEmail, otp: code });
      if (ok) return onAuthed();
      setError(data.error || "Verification failed");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!verifyEmail) return;
    setError(null);
    const { ok, data } = await post("/api/auth/resend-otp", { email: verifyEmail });
    if (ok) {
      setInfo("A new code has been sent.");
      setDigits(Array(LEN).fill(""));
      setCooldown(30);
      refs.current[0]?.focus();
    } else setError(data.error || "Could not resend code");
  };

  const submitBtnSx = { py: 1.3, bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#eab308" } };
  const pwAdornment = {
    endAdornment: (
      <InputAdornment position="end">
        <IconButton aria-label="Toggle password visibility" onClick={() => setShowPw((v) => !v)} edge="end" size="small">
          {showPw ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
        </IconButton>
      </InputAdornment>
    ),
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", letterSpacing: "-0.015em", lineHeight: 1.15 }}>
            {verifyEmail ? "Verify your email" : "Log in to continue"}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: "0.88rem" }}>
            {verifyEmail ? `Enter the 6-digit code we sent to ${verifyEmail}.` : `Your date and travellers for ${tourTitle} are saved — pick up right where you left off.`}
          </Typography>
        </Box>
      </Box>

      {!verifyEmail && (
        <Box sx={{ position: "relative", display: "flex", p: 0.5, mb: 3, borderRadius: "6px", bgcolor: "#f1f5f9" }}>
          {([
            { key: "login" as Mode, label: "Login", icon: <LoginRoundedIcon sx={{ fontSize: 19 }} /> },
            { key: "register" as Mode, label: "Register", icon: <RocketLaunchRoundedIcon sx={{ fontSize: 19 }} /> },
          ]).map((t) => (
            <Box
              key={t.key}
              role="tab"
              aria-selected={mode === t.key}
              tabIndex={0}
              onClick={() => switchMode(t.key)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), switchMode(t.key))}
              sx={{ position: "relative", flex: 1, py: 1.1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, cursor: "pointer", fontWeight: 800, fontSize: "0.92rem", color: mode === t.key ? "#0f172a" : "#64748b", outline: "none" }}
            >
              {mode === t.key && (
                <motion.div layoutId="checkout-auth-tab" transition={{ type: "spring", stiffness: 400, damping: 32 }} style={{ position: "absolute", inset: 0, borderRadius: 6, background: "#facc15" }} />
              )}
              <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 0.75 }}>{t.icon}{t.label}</Box>
            </Box>
          ))}
        </Box>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={verifyEmail ? "verify" : mode} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
          {verifyEmail ? (
            <form onSubmit={submitVerify}>
              <Stack spacing={2.5}>
                {error && <Alert severity="error">{error}</Alert>}
                {info && <Alert severity="success">{info}</Alert>}
                <Box sx={{ display: "flex", justifyContent: "center", color: "#ca8a04" }}><MarkEmailReadRoundedIcon sx={{ fontSize: 40 }} /></Box>
                <Box sx={{ display: "flex", gap: 1.25 }}>
                  {digits.map((d, i) => (
                    <Box
                      key={i}
                      component="input"
                      ref={(el: HTMLInputElement | null) => { refs.current[i] = el; }}
                      value={d}
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      autoFocus={i === 0}
                      aria-label={`Digit ${i + 1}`}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDigit(i, e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
                      }}
                      sx={{ width: "100%", minWidth: 0, height: 54, textAlign: "center", fontSize: "1.4rem", fontWeight: 700, fontFamily: "inherit", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", bgcolor: "#fff", "&:focus": { borderColor: "#0f172a", boxShadow: "0 0 0 3px rgba(15,23,42,0.1)" } }}
                    />
                  ))}
                </Box>
                <Button type="submit" variant="contained" disabled={loading || code.length !== LEN} sx={submitBtnSx}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Verify & continue"}
                </Button>
                <Typography sx={{ textAlign: "center", fontSize: "0.9rem", color: "#64748b" }}>
                  Didn&apos;t get it?{" "}
                  <Box component="button" type="button" onClick={resend} disabled={cooldown > 0}
                    sx={{ border: 0, bgcolor: "transparent", p: 0, font: "inherit", fontWeight: 700, color: cooldown > 0 ? "#94a3b8" : "#ca8a04", cursor: cooldown > 0 ? "default" : "pointer" }}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </Box>
                  {" · "}
                  <Box component="button" type="button" onClick={() => { setVerifyEmail(null); setError(null); setInfo(null); }}
                    sx={{ border: 0, bgcolor: "transparent", p: 0, font: "inherit", fontWeight: 700, color: "#475569", cursor: "pointer" }}>
                    Change email
                  </Box>
                </Typography>
              </Stack>
            </form>
          ) : mode === "login" ? (
            <form onSubmit={submitLogin}>
              <Stack spacing={2.25}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField label="Email address" type="email" autoComplete="email" required fullWidth value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
                <TextField label="Password" type={showPw ? "text" : "password"} autoComplete="current-password" required fullWidth value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} slotProps={{ input: pwAdornment }} />
                <Button type="submit" variant="contained" disabled={loading} sx={submitBtnSx}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Log in & continue"}
                </Button>
                <Typography sx={{ textAlign: "center", fontSize: "0.88rem", color: "#64748b" }}>
                  New here?{" "}
                  <Box component="button" type="button" onClick={() => switchMode("register")} sx={{ border: 0, bgcolor: "transparent", p: 0, font: "inherit", fontWeight: 700, color: "#ca8a04", cursor: "pointer" }}>
                    Create an account
                  </Box>
                </Typography>
              </Stack>
            </form>
          ) : (
            <form onSubmit={submitRegister}>
              <Stack spacing={2.25}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField label="Full name" autoComplete="name" required fullWidth value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} />
                <TextField label="Email address" type="email" autoComplete="email" required fullWidth value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} />
                <TextField
                  label="Mobile number"
                  type="tel"
                  autoComplete="tel-national"
                  required
                  fullWidth
                  value={reg.phone}
                  onChange={(e) => setReg({ ...reg, phone: e.target.value })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> }, htmlInput: { inputMode: "numeric", maxLength: 12 } }}
                />
                <TextField label="Password" type={showPw ? "text" : "password"} autoComplete="new-password" required fullWidth helperText="At least 8 characters" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} slotProps={{ input: pwAdornment, htmlInput: { minLength: 8 } }} />
                <Button type="submit" variant="contained" disabled={loading} sx={submitBtnSx}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Create account & continue"}
                </Button>
                <Typography sx={{ textAlign: "center", fontSize: "0.88rem", color: "#64748b" }}>
                  Already registered?{" "}
                  <Box component="button" type="button" onClick={() => switchMode("login")} sx={{ border: 0, bgcolor: "transparent", p: 0, font: "inherit", fontWeight: 700, color: "#ca8a04", cursor: "pointer" }}>
                    Log in
                  </Box>
                </Typography>
              </Stack>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
