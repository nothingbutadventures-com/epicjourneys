"use client";

import React, { useState } from "react";
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import PhoneAuth from "@/components/PhoneAuth";

/**
 * Login / sign-up without leaving the page, so checkout state is never lost. Customers use their mobile number;
 * accounts created earlier with an email can still log in with it. Calls onAuthed() once the session cookie is set.
 */
export default function InlineAuth({ onAuthed, tourTitle }: { onAuthed: () => void; tourTitle: string }) {
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) return onAuthed();
      setError(data.code === "EMAIL_NOT_VERIFIED" ? "Please verify your email first, or log in with your mobile number instead." : data.error || "Login failed");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const linkBtn = { border: 0, bgcolor: "transparent", p: 0, font: "inherit", fontWeight: 700, color: "#E68A00", cursor: "pointer" } as const;

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.015em", lineHeight: 1.2 }}>Log in to continue</Typography>
        <Typography sx={{ color: "#64748b", fontSize: "0.88rem" }}>
          {useEmail ? "Log in with your email and password." : "Enter your mobile number. New here? We'll set you up in a few seconds."} Your date and travellers for {tourTitle} are saved.
        </Typography>
      </Box>

      {!useEmail ? (
        <PhoneAuth onAuthed={onAuthed} submitLabel="Verify & continue" />
      ) : (
        <form onSubmit={submitEmail}>
          <Stack spacing={2.25}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Email address" type="email" autoComplete="email" required fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField
              label="Password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <Button type="submit" variant="contained" disabled={loading} sx={{ py: 1.3, bgcolor: "#FF9900", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#E68A00" } }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : "Log in & continue"}
            </Button>
          </Stack>
        </form>
      )}

      <Typography sx={{ textAlign: "center", fontSize: "0.88rem", color: "#64748b", mt: 2.5 }}>
        {useEmail ? (
          <Box component="button" type="button" onClick={() => setUseEmail(false)} sx={linkBtn}>Use my mobile number instead</Box>
        ) : (
          <>
            Have an email account?{" "}
            <Box component="button" type="button" onClick={() => setUseEmail(true)} sx={linkBtn}>Log in with email</Box>
          </>
        )}
      </Typography>
    </Box>
  );
}
