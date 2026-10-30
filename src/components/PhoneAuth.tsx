"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import SmsRoundedIcon from "@mui/icons-material/SmsRounded";
import { confirmFirebaseCode, firebaseClientConfigured, firebaseMessage, sendFirebaseCode } from "@/lib/firebase-client";

const LEN = 6;
type Step = "phone" | "code" | "profile";
const cleanPhone = (v: string) => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
const validPhone = (v: string) => /^[6-9]\d{9}$/.test(cleanPhone(v));

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/**
 * Mobile-number login and sign-up in one flow: number -> SMS code -> signed in.
 * A number we haven't seen before is asked for a name (and an optional email) and the account is created.
 * Firebase sends the SMS when it is configured; without keys (local development) the code is printed in the server console.
 */
export default function PhoneAuth({
  onAuthed,
  fieldSx,
  buttonSx,
  submitLabel = "Continue",
}: {
  onAuthed: () => void;
  fieldSx?: object;
  buttonSx?: object;
  submitLabel?: string;
}) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [checkbox, setCheckbox] = useState(false);
  const [mode, setMode] = useState<"checking" | "firebase" | "simulator" | "off">("checking");
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmation = useRef<any>(null);
  // The proof of the number (Firebase token, or number + simulator code) is kept so a new customer can finish
  // their profile without being sent a second code.
  const proof = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    fetch("/api/auth/phone/config")
      .then((r) => r.json())
      .then((c) => setMode(c.firebase && firebaseClientConfigured() ? "firebase" : c.simulator ? "simulator" : "off"))
      .catch(() => setMode("off"));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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

  const sendCode = useCallback(async () => {
    setError(null);
    if (!validPhone(phone)) return setError("Enter a valid 10-digit Indian mobile number.");
    setLoading(true);
    try {
      const local = cleanPhone(phone);
      if (mode === "firebase") {
        try {
          confirmation.current = await sendFirebaseCode(local, "phone-recaptcha", checkbox);
        } catch (err: any) {
          // Firebase sometimes refuses the invisible check: show the "I'm not a robot" box and let the user tick it.
          if (!checkbox && ["auth/invalid-app-credential", "auth/captcha-check-failed"].includes(err?.code)) {
            setCheckbox(true);
            setError("Firebase wants an extra check. Press Send code again, then tick the \"I'm not a robot\" box that appears.");
            return;
          }
          throw err;
        }
      } else {
        const { res, data } = await post("/api/auth/phone/send", { phone: local });
        if (!res.ok) throw Object.assign(new Error(data.error || "Couldn't send the code."), { plain: true });
        setDevCode(data.devCode || null);
      }
      setDigits(Array(LEN).fill(""));
      setCooldown(30);
      setStep("code");
    } catch (e: any) {
      setError(e?.plain ? e.message : firebaseMessage(e));
    } finally {
      setLoading(false);
    }
  }, [phone, mode, checkbox]);

  const finish = async (extra: Record<string, string> = {}) => {
    const { res, data } = await post("/api/auth/phone/verify", { ...proof.current, ...extra });
    if (res.ok && data.success) return onAuthed();
    if (res.status === 404 && data.code === "NEW_ACCOUNT") return setStep("profile");
    throw new Error(data.error || "Couldn't sign you in.");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== LEN) return;
    setError(null);
    setLoading(true);
    try {
      if (mode === "firebase") {
        const idToken = await confirmFirebaseCode(confirmation.current, code);
        proof.current = { idToken };
      } else {
        proof.current = { phone: cleanPhone(phone), code };
      }
      await finish();
    } catch (err: any) {
      setError(err?.code ? firebaseMessage(err) : err.message || "Couldn't verify the code.");
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Please enter your full name.");
    setLoading(true);
    try {
      await finish({ name: name.trim(), ...(email.trim() ? { email: email.trim() } : {}) });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const btn = { py: 1.3, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" }, ...(buttonSx || {}) };

  if (mode === "checking") return <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
  if (mode === "off") return <Alert severity="warning">Mobile login isn&apos;t set up yet. Please contact support, or log in with your email below if you already have an account.</Alert>;

  return (
    <Box>
      {/* Firebase's invisible reCAPTCHA attaches here */}
      <div id="phone-recaptcha" style={{ display: "flex", justifyContent: "center", margin: checkbox && step === "phone" ? "0 0 16px" : 0 }} />
      {step === "phone" && (
        <form onSubmit={(e) => { e.preventDefault(); sendCode(); }}>
          <Stack spacing={2.25}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Mobile number"
              type="tel"
              autoComplete="tel-national"
              autoFocus
              required
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              sx={fieldSx}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> }, htmlInput: { inputMode: "numeric", maxLength: 12 } }}
              helperText="We'll text you a 6-digit code. No password needed."
            />
            <Button type="submit" variant="contained" disabled={loading} sx={btn}>
              {loading ? <CircularProgress size={22} color="inherit" /> : "Send code"}
            </Button>
          </Stack>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verify}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            {mode === "simulator" && (
              <Alert severity="info">
                Test mode: no SMS is sent until Firebase is connected.{devCode ? <> Your code is <strong>{devCode}</strong>.</> : null}
              </Alert>
            )}
            <Box sx={{ textAlign: "center", color: "#E68A00" }}>
              <SmsRoundedIcon sx={{ fontSize: 38 }} />
              <Typography sx={{ color: "#64748b", fontSize: "0.9rem", mt: 0.5 }}>Enter the 6-digit code sent to +91 {cleanPhone(phone)}</Typography>
            </Box>
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
                  sx={{ width: "100%", minWidth: 0, height: 54, textAlign: "center", fontSize: "1.4rem", fontWeight: 700, fontFamily: "inherit", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "4px", outline: "none", bgcolor: "#fff", "&:focus": { borderColor: "#0f172a", boxShadow: "0 0 0 3px rgba(15,23,42,0.1)" } }}
                />
              ))}
            </Box>
            <Button type="submit" variant="contained" disabled={loading || code.length !== LEN} sx={btn}>
              {loading ? <CircularProgress size={22} color="inherit" /> : submitLabel}
            </Button>
            <Typography sx={{ textAlign: "center", fontSize: "0.9rem", color: "#64748b" }}>
              Didn&apos;t get it?{" "}
              <Box component="button" type="button" onClick={sendCode} disabled={cooldown > 0 || loading} sx={{ border: 0, bgcolor: "transparent", p: 0, font: "inherit", fontWeight: 700, color: cooldown > 0 ? "#94a3b8" : "#E68A00", cursor: cooldown > 0 ? "default" : "pointer" }}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </Box>
              {" · "}
              <Box component="button" type="button" onClick={() => { setStep("phone"); setError(null); }} sx={{ border: 0, bgcolor: "transparent", p: 0, font: "inherit", fontWeight: 700, color: "#475569", cursor: "pointer" }}>
                Change number
              </Box>
            </Typography>
          </Stack>
        </form>
      )}

      {step === "profile" && (
        <form onSubmit={createAccount}>
          <Stack spacing={2.25}>
            {error && <Alert severity="error">{error}</Alert>}
            <Alert severity="success" icon={false} sx={{ fontWeight: 600 }}>+91 {cleanPhone(phone)} is verified. Just a few details to finish.</Alert>
            <TextField label="Full name" autoComplete="name" autoFocus required fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={fieldSx} />
            <TextField label="Email address (optional)" type="email" autoComplete="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} sx={fieldSx} helperText="Only used to send your booking confirmations and invoices." />
            <Button type="submit" variant="contained" disabled={loading} sx={btn}>
              {loading ? <CircularProgress size={22} color="inherit" /> : "Create account & continue"}
            </Button>
          </Stack>
        </form>
      )}
    </Box>
  );
}
