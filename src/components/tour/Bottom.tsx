"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import { MANROPE, BALOO, INK, MUTED, RED, inr, SectionHead } from "./ui";

/* ───────── Other tours from this city ───────── */
export function OtherTours({ tours, city, cityId }: { tours: any[]; city: string; cityId: string }) {
  if (tours.length === 0) return null;
  return (
    <Box component="section" sx={{ bgcolor: "#EDEDED", py: { xs: 6, md: "48px" } }}>
      <Box sx={{ maxWidth: 1160, mx: "auto", px: { xs: 2, lg: 0 } }}>
        <SectionHead eyebrow={`More from ${city}`} title="Other tours" red={`leaving from ${city}`} />
        <Box sx={{ mt: "24px", display: "grid", gap: "20px", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, alignItems: "start" }}>
          {tours.map((t) => {
            const href = `/tours/${t.slug || t._id}${cityId && cityId !== "base" ? `?from=${cityId}` : ""}`;
            const hasDates = (t.departures || []).length > 0;
            return (
              <Box key={t._id} sx={{ bgcolor: "#fff", borderRadius: "14px", p: "8px 8px 16px" }}>
                <Box component={Link} href={href} sx={{ display: "block" }}>
                  <Box component="img" src={t.coverImage} alt="" loading="lazy" sx={{ width: "100%", height: 150, objectFit: "cover", borderRadius: "8px", display: "block" }} />
                </Box>
                <Box sx={{ px: "8px" }}>
                  <Box component={Link} href={href} sx={{ display: "block", mt: "16px", textDecoration: "none", color: INK, fontFamily: BALOO, fontWeight: 500, fontSize: 24, lineHeight: "30px", letterSpacing: "-0.02em" }}>{t.title}</Box>
                  <Box sx={{ mt: "8px", fontFamily: MANROPE, fontWeight: 500, fontSize: 14, lineHeight: "20px", color: MUTED }}>{t.durationDays}D / {t.durationNights}N · {[t.targetCity, t.state].filter(Boolean).join(", ")}</Box>
                  <Box sx={{ mt: "6px", fontFamily: MANROPE, fontWeight: 700, fontSize: 14, lineHeight: "20px" }}>Starts at your lounge in {city}</Box>
                  <Box sx={{ mt: "12px", pt: "10px", borderTop: "1px solid #EDEDED", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 1 }}>
                    <Box>
                      <Box sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 12, lineHeight: "16px", color: MUTED }}>Starting from</Box>
                      <Box sx={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 20, lineHeight: "26px" }}>{inr(t.priceInr)}</Box>
                    </Box>
                    <Box component={Link} href={hasDates ? href : "#request"} sx={{ height: 38, px: "14px", display: "flex", alignItems: "center", bgcolor: INK, color: "#fff", textDecoration: "none", fontFamily: MANROPE, fontWeight: 600, fontSize: 12, letterSpacing: "0.28px", textTransform: "uppercase", whiteSpace: "nowrap", "&:hover": { bgcolor: "#262626" } }}>{hasDates ? "View tour" : "Ask for dates"}</Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

/* ───────── Request dates or a city ───────── */
const label = { display: "block", fontFamily: MANROPE, fontWeight: 700, fontSize: 14, lineHeight: "20px", color: INK, mb: "8px" } as const;
const field = { boxSizing: "border-box", width: "100%", height: 48, px: "16px", border: "1px solid #D0D0D0", borderRadius: 0, bgcolor: "#fff", outline: 0, fontFamily: MANROPE, fontWeight: 500, fontSize: 15, color: INK, "&::placeholder": { color: "#9A9A9A", opacity: 1 }, "&:focus": { borderColor: INK } } as const;
const WHEN = ["Any time", "Next 30 days", "In 1–2 months", "In 3–6 months", "After 6 months"];

export function DatesRequest({ tourTitle, city, state }: { tourTitle: string; city: string; state: string }) {
  const [v, setV] = useState({ name: "", phone: "", city, when: "Any time", website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const r = await fetch("/api/public/callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "dates", tour: tourTitle, ...v }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Something went wrong. Please try again.");
      setDone(true);
    } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <Box component="section" id="request" sx={{ bgcolor: "#EDEDED", py: { xs: 6, md: "72px" } }}>
      <Box sx={{ maxWidth: 1160, mx: "auto", px: { xs: 2, lg: 0 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "560px 520px" }, columnGap: "80px", rowGap: 5, alignItems: "center" }}>
        <Box>
          <SectionHead eyebrow="Ask for your city or dates" title="Different dates? Or a lounge closer to home?" size={40} />
          <Box sx={{ mt: "20px", fontFamily: MANROPE, fontWeight: 500, fontSize: 18, lineHeight: "29px", color: MUTED }}>
            Tell us your town and when you&apos;d like to travel. A coordinator{state ? ` for ${state}` : ""} will call you back. New lounges open where enough families ask.
          </Box>
        </Box>
        <Box sx={{ bgcolor: "#fff", borderTop: `4px solid ${RED}`, p: { xs: "24px 20px", md: "32px 36px" } }}>
          {done ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Box sx={{ fontFamily: BALOO, fontWeight: 500, fontSize: 32 }}>Thanks, we have your request.</Box>
              <Box sx={{ mt: 1.5, fontFamily: MANROPE, fontWeight: 500, fontSize: 15, color: MUTED }}>A coordinator will call you back soon.</Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={submit} noValidate>
              <Box sx={{ fontFamily: BALOO, fontWeight: 500, fontSize: 30, lineHeight: "40px", letterSpacing: "-0.02em" }}>Request dates or a city</Box>
              <Box sx={{ mt: "6px", mb: "22px", fontFamily: MANROPE, fontWeight: 500, fontSize: 14, lineHeight: "20px", color: MUTED }}>Takes under a minute. Fields marked * are required.</Box>
              <Box component="label" htmlFor="dr-name" sx={label}>Your name *</Box>
              <Box component="input" id="dr-name" value={v.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("name", e.target.value)} placeholder="e.g. Sushma Agarwal" autoComplete="name" sx={field} />
              <Box component="label" htmlFor="dr-phone" sx={{ ...label, mt: "16px" }}>Phone number *</Box>
              <Box sx={{ display: "flex" }}>
                <Box sx={{ boxSizing: "border-box", width: 64, height: 48, flexShrink: 0, border: "1px solid #D0D0D0", borderRight: 0, bgcolor: "#EDEDED", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MANROPE, fontWeight: 700, fontSize: 15 }}>+91</Box>
                <Box component="input" id="dr-phone" type="tel" inputMode="numeric" value={v.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" autoComplete="tel-national" sx={field} />
              </Box>
              <Box component="label" htmlFor="dr-city" sx={{ ...label, mt: "16px" }}>Your town *</Box>
              <Box component="input" id="dr-city" value={v.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("city", e.target.value)} autoComplete="address-level2" sx={field} />
              <Box component="label" htmlFor="dr-when" sx={{ ...label, mt: "16px" }}>When would you like to go?</Box>
              <Box component="select" id="dr-when" value={v.when} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set("when", e.target.value)} sx={field}>
                {WHEN.map((w) => <option key={w}>{w}</option>)}
              </Box>
              <Box component="input" tabIndex={-1} autoComplete="off" aria-hidden="true" value={v.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("website", e.target.value)} sx={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }} />
              {error && <Box role="alert" sx={{ mt: 2, fontFamily: MANROPE, fontWeight: 600, fontSize: 14, color: "#C4260F" }}>{error}</Box>}
              <Box component="button" type="submit" disabled={busy} sx={{ mt: "20px", width: "100%", height: 52, border: 0, bgcolor: RED, color: "#fff", cursor: "pointer", opacity: busy ? 0.7 : 1, fontFamily: MANROPE, fontWeight: 600, fontSize: 14, letterSpacing: "0.28px", textTransform: "uppercase", "&:hover": { bgcolor: "#C4260F" } }}>{busy ? "Sending…" : "Send my request"}</Box>
              <Box sx={{ mt: "16px", textAlign: "center", fontFamily: MANROPE, fontWeight: 500, fontSize: 14, color: MUTED }}>We&apos;ll only use your number to call you about this trip.</Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
