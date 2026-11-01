"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

const POINTS = ["A local expert calls you back within 24 hours", "No obligation, and no spam calls", "Group and family departures planned from your town"];

const label = { display: "block", fontFamily: MANROPE, fontWeight: 700, fontSize: 12.5, lineHeight: "15.6px", letterSpacing: "0.3px", color: "#0C0C0C", mb: "9px" } as const;
const field = {
  boxSizing: "border-box", width: "100%", height: 50, px: "16px", border: "1px solid #D0D0D0", borderRadius: 0, bgcolor: "#fff", outline: 0,
  fontFamily: MANROPE, fontWeight: 500, fontSize: 15, color: "#0C0C0C",
  "&::placeholder": { color: "#9A9A9A", opacity: 1 }, "&:focus": { borderColor: "#0C0C0C" },
} as const;

/** Callback request form; submissions arrive in the admin CRM as new leads. */
export default function LeadSection() {
  const [v, setV] = useState({ name: "", phone: "", city: "", destination: "", group: false, website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const set = (k: string, val: string | boolean) => setV((s) => ({ ...s, [k]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/public/callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "callback", ...v }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Something went wrong. Please try again.");
      setDone(v.name.trim().split(" ")[0]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box component="section" id="callback" sx={{ bgcolor: "#EDEDED", py: { xs: 8, md: "128px" } }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" }, display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { md: "center" }, gap: { xs: 5, md: 4 } }}>
        <Box sx={{ maxWidth: 640 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Box sx={{ width: 14, height: 14, borderRadius: "7px", bgcolor: "#EA321E", flexShrink: 0 }} />
            <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "14.4px", letterSpacing: "1.7px", color: "#0C0C0C" }}>TALK TO A TRAVEL EXPERT</Box>
          </Box>
          <Box component="h2" sx={{ m: 0, mt: "2px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 32, sm: 40, md: 46 }, lineHeight: "46.9px", letterSpacing: "-0.035em", color: "#0C0C0C" }}>
            Can&apos;t find your city listed?
            <Box component="span" sx={{ display: "block", color: "#EA321E" }}>Or planning a group departure?</Box>
          </Box>
          <Box sx={{ mt: "33px", maxWidth: 450, fontFamily: MANROPE, fontWeight: 500, fontSize: 17, lineHeight: "27.2px", color: "#4A4A4A" }}>
            Tell us where you are. We frequently add new Tier-2 and Tier-3 partner network points based on demand.
          </Box>
          <Box sx={{ mt: "22px", display: "grid", rowGap: "12px" }}>
            {POINTS.map((p) => (
              <Box key={p} sx={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: MANROPE, fontWeight: 500, fontSize: 15.5, lineHeight: "19.4px", color: "#0C0C0C" }}>
                <Box component="span" aria-hidden="true" sx={{ width: 22, height: 22, borderRadius: "11px", bgcolor: "#0C0C0C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>✓</Box>
                {p}
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ boxSizing: "border-box", width: { xs: "100%", md: 520 }, flexShrink: 0, bgcolor: "#fff", borderTop: "4px solid #EA321E", p: { xs: "28px 20px", md: "32px 36px 30px" } }}>
          {done ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Box sx={{ mx: "auto", width: 48, height: 48, borderRadius: "24px", bgcolor: "#0C0C0C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✓</Box>
              <Box sx={{ mt: 3, fontFamily: MANROPE, fontWeight: 600, fontSize: 26, letterSpacing: "-0.03em", color: "#0C0C0C" }}>Thanks, {done}!</Box>
              <Box sx={{ mt: 1.5, fontFamily: MANROPE, fontWeight: 500, fontSize: 15, lineHeight: "23px", color: "#4A4A4A" }}>A local expert will call you back within 24 hours.</Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={submit} noValidate>
              <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 28, lineHeight: "30.8px", letterSpacing: "-0.025em", color: "#0C0C0C" }}>Request a callback</Box>
              <Box sx={{ mt: "12px", mb: "26px", fontFamily: MANROPE, fontWeight: 500, fontSize: 13.5, lineHeight: "16.9px", color: "#6B6B6B" }}>Takes under a minute. Fields marked * are required.</Box>

              <Box component="label" htmlFor="cb-name" sx={label}>Your name *</Box>
              <Box component="input" id="cb-name" value={v.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("name", e.target.value)} placeholder="e.g. Sunita Rao" autoComplete="name" required sx={field} />

              <Box component="label" htmlFor="cb-phone" sx={{ ...label, mt: "18px" }}>Phone number *</Box>
              <Box sx={{ display: "flex" }}>
                <Box sx={{ boxSizing: "border-box", width: 54, height: 50, flexShrink: 0, border: "1px solid #D0D0D0", borderRight: 0, bgcolor: "#EDEDED", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MANROPE, fontWeight: 700, fontSize: 15 }}>+91</Box>
                <Box component="input" id="cb-phone" type="tel" inputMode="numeric" value={v.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" autoComplete="tel-national" required sx={field} />
              </Box>

              <Box component="label" htmlFor="cb-city" sx={{ ...label, mt: "18px" }}>Your city *</Box>
              <Box component="input" id="cb-city" value={v.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("city", e.target.value)} placeholder="e.g. Jhansi" autoComplete="address-level2" required sx={field} />

              <Box component="label" htmlFor="cb-dest" sx={{ ...label, mt: "18px" }}>Where do you want to go? *</Box>
              <Box component="input" id="cb-dest" value={v.destination} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("destination", e.target.value)} placeholder="e.g. Haridwar, Manali, not sure yet" required sx={field} />

              {/* Honeypot: hidden from people, bots fill it */}
              <Box component="input" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={v.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("website", e.target.value)} sx={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }} />

              <Box component="label" sx={{ mt: "19px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontFamily: MANROPE, fontWeight: 500, fontSize: 14.5, lineHeight: "18.1px", color: "#0C0C0C" }}>
                <Box component="input" type="checkbox" checked={v.group} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("group", e.target.checked)} sx={{ appearance: "none", m: 0, width: 18, height: 18, border: "1.5px solid #0C0C0C", bgcolor: "#fff", cursor: "pointer", flexShrink: 0, position: "relative", "&:checked": { bgcolor: "#0C0C0C" }, "&:checked::after": { content: '"✓"', position: "absolute", inset: 0, color: "#fff", fontSize: 12, lineHeight: "15px", textAlign: "center" }, "&:focus-visible": { outline: "2px solid #EA321E", outlineOffset: 2 } }} />
                I&apos;m planning a group departure (10 or more people)
              </Box>

              {error && <Box role="alert" sx={{ mt: 2, fontFamily: MANROPE, fontWeight: 600, fontSize: 13.5, color: "#C4260F" }}>{error}</Box>}

              <Box component="button" type="submit" disabled={busy} sx={{ mt: "21px", width: "100%", height: 54, border: 0, bgcolor: "#EA321E", color: "#fff", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, fontFamily: MANROPE, fontWeight: 700, fontSize: 14, letterSpacing: "0.8px", "&:hover": { bgcolor: "#C4260F" }, "&:focus-visible": { outline: "2px solid #0C0C0C", outlineOffset: 2 } }}>
                {busy ? "SENDING…" : "REQUEST A CALLBACK"}
              </Box>
              <Box sx={{ mt: "50px", textAlign: "center", fontFamily: MANROPE, fontWeight: 500, fontSize: 12.5, lineHeight: "15.6px", color: "#6B6B6B" }}>We&apos;ll only use your number to call you about this trip.</Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
