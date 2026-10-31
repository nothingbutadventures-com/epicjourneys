"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, IconButton, InputAdornment, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";

type Env = "test" | "live";
interface Pair { keyId: string; hasSecret: boolean; unreadable: boolean; updatedAt: string | null }
interface Snapshot {
  mode: Env;
  test: Pair;
  live: Pair;
  active: { mode: Env; source: "admin" | "env"; keyId: string } | null;
  envFallback: boolean;
}

const authHeaders = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const json = { "Content-Type": "application/json" };
const API = "/api/integrations/razorpay";
const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function KeyCard({ env, pair, active, onChange, onError, onNotice }: {
  env: Env;
  pair: Pair;
  active: boolean;
  onChange: (s: Snapshot) => void;
  onError: (m: string) => void;
  onNotice: (m: string) => void;
}) {
  const [keyId, setKeyId] = useState("");
  const [secret, setSecret] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const live = env === "live";
  const saved = pair.keyId && pair.hasSecret;

  const call = async (label: string, fn: () => Promise<Response>, done: string) => {
    setBusy(label);
    onError("");
    try {
      const r = await fn();
      const d = await r.json();
      if (!r.ok || d.success === false) throw new Error(d.error || d.message || "Something went wrong");
      if (d.data) onChange(d.data);
      onNotice(d.message || done);
      return true;
    } catch (e: any) {
      onError(e.message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    const ok = await call("save", () => fetch(API, { method: "PUT", headers: { ...json, ...authHeaders() }, body: JSON.stringify({ env, keyId, keySecret: secret }) }), `${live ? "Live" : "Test"} keys saved.`);
    if (ok) {
      setKeyId("");
      setSecret("");
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, flex: 1, minWidth: 300, borderColor: active ? (live ? "#dc2626" : "#16a34a") : "#e2e8f0", borderWidth: active ? 2 : 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{live ? "Live keys" : "Test (sandbox) keys"}</Typography>
        {active && <Chip size="small" label="In use" color={live ? "error" : "success"} />}
        {!active && saved && <Chip size="small" label="Saved" variant="outlined" />}
      </Box>
      <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
        {live ? "Real money. Key ID starts with rzp_live_." : "No real money. Key ID starts with rzp_test_."}
      </Typography>

      {saved && (
        <Alert severity={pair.unreadable ? "warning" : "success"} icon={<LockRoundedIcon fontSize="inherit" />} sx={{ mb: 2, fontSize: 13 }}>
          {pair.unreadable ? (
            "The saved secret can't be read any more. Enter the keys again."
          ) : (
            <>
              <strong>{pair.keyId}</strong> · secret saved (encrypted)
              {pair.updatedAt ? <> · updated {fmt(pair.updatedAt)}</> : null}
            </>
          )}
        </Alert>
      )}

      <TextField
        fullWidth
        size="small"
        label="Key ID"
        placeholder={`rzp_${env}_xxxxxxxxxxxxxx`}
        value={keyId}
        onChange={(e) => setKeyId(e.target.value)}
        autoComplete="off"
        sx={{ mb: 1.5 }}
      />
      <TextField
        fullWidth
        size="small"
        label="Key Secret"
        type={show ? "text" : "password"}
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        autoComplete="new-password"
        helperText={saved ? "Enter new keys to replace the saved ones. The saved secret is never shown." : "Stored encrypted. It can't be viewed again after saving."}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShow((s) => !s)} edge="end" aria-label="Show or hide secret">
                  {show ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="contained" disableElevation disabled={!keyId.trim() || !secret.trim() || !!busy} onClick={save} startIcon={busy === "save" ? <CircularProgress size={14} color="inherit" /> : null}>
          Verify &amp; save
        </Button>
        {saved && !pair.unreadable && (
          <Button variant="outlined" disabled={!!busy} onClick={() => call("test", () => fetch(API, { method: "POST", headers: { ...json, ...authHeaders() }, body: JSON.stringify({ env }) }), "Keys are working.")}>
            {busy === "test" ? "Checking…" : "Test saved keys"}
          </Button>
        )}
        {saved && (
          <Button
            color="error"
            disabled={!!busy}
            onClick={() => {
              if (confirm(`Remove the saved ${env} keys?`)) call("remove", () => fetch(`${API}?env=${env}`, { method: "DELETE", headers: authHeaders() }), `${live ? "Live" : "Test"} keys removed.`);
            }}
          >
            Remove
          </Button>
        )}
      </Box>
    </Paper>
  );
}

export default function IntegrationsPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [switching, setSwitching] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(API, { headers: authHeaders(), cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load");
      setData(d.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const switchMode = async (mode: Env) => {
    if (!data || mode === data.mode) return;
    if (mode === "live" && !confirm("Switch to LIVE keys? Customers will be charged real money.")) return;
    setSwitching(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch(API, { method: "PATCH", headers: { ...json, ...authHeaders() }, body: JSON.stringify({ mode }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Couldn't switch");
      setData(d.data);
      setNotice(`Checkout now uses the ${mode} keys.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSwitching(false);
    }
  };

  if (loading) return <Box sx={{ p: 6, textAlign: "center" }}><CircularProgress /></Box>;

  const a = data?.active;
  const adminActive = a?.source === "admin";

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000 }}>
      <Typography sx={{ fontSize: 22, fontWeight: 800 }}>Integrations</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 3 }}>Connect third-party services. Only super admins can see this page.</Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <PaymentsRoundedIcon sx={{ color: "#2563eb" }} />
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Razorpay</Typography>
        {a ? (
          <Chip size="small" color={a.mode === "live" ? "error" : "success"} label={`${a.mode === "live" ? "Live" : "Test"} mode${adminActive ? "" : " (from server env)"}`} />
        ) : (
          <Chip size="small" label="Not connected: payments run in the simulator" />
        )}
      </Box>
      <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 2 }}>
        Save a test and/or live key pair, then choose which one checkout uses. Switching takes effect straight away, no redeploy. Find the keys in Razorpay Dashboard → Account &amp; Settings → API Keys.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}
      {data && !adminActive && data.envFallback && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Checkout is currently using the RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET environment variables. Keys saved here take priority once you add them.
        </Alert>
      )}

      {data && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Checkout uses:</Typography>
            <ToggleButtonGroup exclusive size="small" value={data.mode} disabled={switching} onChange={(_, v) => v && switchMode(v)}>
              <ToggleButton value="test" disabled={!data.test.hasSecret} sx={{ px: 2, textTransform: "none" }}>Test keys</ToggleButton>
              <ToggleButton value="live" disabled={!data.live.hasSecret} sx={{ px: 2, textTransform: "none" }}>Live keys</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "stretch" }}>
            <KeyCard env="test" pair={data.test} active={adminActive && data.mode === "test"} onChange={setData} onError={setError} onNotice={setNotice} />
            <KeyCard env="live" pair={data.live} active={adminActive && data.mode === "live"} onChange={setData} onError={setError} onNotice={setNotice} />
          </Box>
        </>
      )}
    </Box>
  );
}
