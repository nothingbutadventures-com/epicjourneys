"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

const EXPLORE = [
  { label: "Destinations", href: "/#tour-results" },
  { label: "Tour categories", href: "/#categories" },
  { label: "Popular tours", href: "/#tour-results" },
  { label: "Winter Sale", href: "/tours?sale=1" },
];
const COMPANY = [
  { label: "FAQs", href: "/#faq" },
  { label: "LocalStart Lounges", href: "/#why" },
  { label: "Partner registration (local agents)", href: "/become-a-partner" },
  { label: "Help & support", href: "/help" },
];
const STATES = ["Himachal Pradesh", "Rajasthan", "Uttarakhand", "Kerala", "Goa"];
const PLACES: { state: string; cities: { label: string; q: string }[] }[] = [
  { state: "Uttarakhand", cities: [{ label: "Haridwar tours", q: "Haridwar" }, { label: "Rishikesh tours", q: "Rishikesh" }] },
  { state: "Rajasthan", cities: [{ label: "Jaipur tours", q: "Jaipur" }, { label: "Udaipur tours", q: "Udaipur" }, { label: "Pushkar tours", q: "Pushkar" }] },
  { state: "Himachal Pradesh", cities: [{ label: "Manali tours", q: "Manali" }, { label: "Solang Valley", q: "Solang" }] },
  { state: "Goa", cities: [{ label: "North Goa tours", q: "North Goa" }] },
  { state: "Kerala", cities: [{ label: "Munnar tours", q: "Munnar" }] },
];
const PAYMENTS = [
  { icon: "pay-upi", label: "UPI" },
  { icon: "pay-card", label: "Credit & debit cards" },
  { icon: "pay-bank", label: "NetBanking" },
  { icon: "pay-ssl", label: "256-bit SSL checkout" },
];
// Policy pages are not published yet, so these open the help page.
const LEGAL = [
  { label: "Privacy Policy", href: "/help" },
  { label: "Terms & Conditions", href: "/help" },
  { label: "Cancellation Policy", href: "/help" },
  { label: "FAQs", href: "/#faq" },
  { label: "Careers", href: "/careers" },
];

const head = { fontFamily: MANROPE, fontWeight: 700, fontSize: 11.5, lineHeight: "18.4px", letterSpacing: "1.2px", color: "#fff" } as const;
const link = { display: "block", fontFamily: MANROPE, fontWeight: 400, fontSize: 13, lineHeight: "20.8px", color: "#A3A3A3", textDecoration: "none", transition: "color .15s", "&:hover": { color: "#fff" } } as const;

export default function Footer() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setState("busy");
    try {
      const r = await fetch("/api/public/callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "newsletter", email }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Something went wrong. Please try again.");
      setState("done");
    } catch (err: any) {
      setError(err.message);
      setState("idle");
    }
  };

  return (
    <Box component="footer" sx={{ bgcolor: "#0C0C0C", color: "#fff" }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" }, pt: { xs: 6, md: "77px" } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "348px 208px 208px 208px 1fr" }, rowGap: 5, pb: { xs: 5, md: "73px" } }}>
          <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" }, pr: { md: "40px" } }}>
            <Box component={Link} href="/" aria-label="EpicJourneys home" sx={{ display: "inline-block", textDecoration: "none", fontFamily: BALOO, fontWeight: 700, fontSize: 36, lineHeight: "36px", letterSpacing: "-0.4px", color: "#fff" }}>
              epic <Box component="span" sx={{ color: "#FF5A45" }}>journeys</Box>
              <Box component="span" sx={{ fontWeight: 600, fontSize: 22, color: "rgba(255,255,255,0.45)" }}>.in</Box>
            </Box>
            <Box sx={{ mt: "28px", fontFamily: MANROPE, fontWeight: 400, fontSize: 15, lineHeight: "29px", color: "#fff", maxWidth: 252 }}>
              <Box component="span" sx={{ color: "#FF5A45", fontWeight: 600 }}>EpicJourneys:</Box> India’s trusted online travel network, operating right out of your neighborhood.
            </Box>
            <Box sx={{ mt: "9px", fontFamily: MANROPE, fontWeight: 400, fontSize: 14, lineHeight: "21px", color: "#8A8A8A", maxWidth: 300 }}>
              Curated Indian journeys starting closest to you. Verified local partners, transparent pricing in ₹ and round-trip itineraries.
            </Box>
            <Box component="a" href="mailto:support@epicjourneys.in" sx={{ ...link, mt: "10px", fontWeight: 500, color: "#8A8A8A" }}>support@epicjourneys.in</Box>
          </Box>

          <Box>
            <Box sx={{ ...head, mt: { md: "12px" }, mb: "26px" }}>EXPLORE</Box>
            <Box sx={{ display: "grid", rowGap: "10.2px" }}>{EXPLORE.map((l) => <Box key={l.label} component={Link} href={l.href} sx={link}>{l.label}</Box>)}</Box>
          </Box>
          <Box>
            <Box sx={{ ...head, mt: { md: "12px" }, mb: "26px" }}>COMPANY</Box>
            <Box sx={{ display: "grid", rowGap: "10.2px" }}>{COMPANY.map((l) => <Box key={l.label} component={Link} href={l.href} sx={{ ...link, maxWidth: 154 }}>{l.label}</Box>)}</Box>
          </Box>
          <Box>
            <Box sx={{ ...head, mt: { md: "12px" }, mb: "26px" }}>POPULAR STATES</Box>
            <Box sx={{ display: "grid", rowGap: "10.2px" }}>{STATES.map((s) => <Box key={s} component={Link} href={`/tours?state=${encodeURIComponent(s)}`} sx={link}>{s}</Box>)}</Box>
          </Box>

          <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
            <Box sx={{ ...head, mt: { md: "12px" } }}>NEW TOURS &amp; SALE ALERTS</Box>
            {state === "done" ? (
              <Box sx={{ mt: "40px", fontFamily: MANROPE, fontWeight: 500, fontSize: 14, lineHeight: "20px", color: "#fff" }}>Thanks! We&apos;ll email you new tours and sale alerts.</Box>
            ) : (
              <Box component="form" onSubmit={subscribe} noValidate>
                <Box component="input" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="Your email" aria-label="Your email" autoComplete="email" sx={{ mt: "40px", boxSizing: "border-box", width: "100%", height: 32, p: 0, border: 0, borderBottom: "1px solid #fff", borderRadius: 0, bgcolor: "transparent", outline: 0, fontFamily: MANROPE, fontWeight: 500, fontSize: 14, color: "#fff", "&::placeholder": { color: "#6B6B6B", opacity: 1 } }} />
                {error && <Box role="alert" sx={{ mt: 1, fontFamily: MANROPE, fontWeight: 600, fontSize: 12.5, color: "#FF5A45" }}>{error}</Box>}
                <Box component="button" type="submit" disabled={state === "busy"} sx={{ mt: "10px", width: 119, height: 47, border: 0, bgcolor: "#EA321E", color: "#fff", cursor: "pointer", fontFamily: MANROPE, fontWeight: 700, fontSize: 13, letterSpacing: "0.8px", opacity: state === "busy" ? 0.7 : 1, "&:hover": { bgcolor: "#C4260F" } }}>
                  SUBSCRIBE
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.08)", py: { xs: 4, md: "37px" }, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 167.5px)" }, rowGap: 4 }}>
          {PLACES.map((p) => (
            <Box key={p.state}>
              <Box sx={{ ...head, textTransform: "uppercase" }}>{p.state}</Box>
              <Box sx={{ mt: "12px", display: "grid", rowGap: "5.7px" }}>
                {p.cities.map((c) => <Box key={c.q} component={Link} href={`/tours?q=${encodeURIComponent(c.q)}`} sx={link}>{c.label}</Box>)}
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.08)", pt: { xs: 0, md: "33px" } }}>
          <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.12)", pt: "25px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
            <Box sx={{ mr: "5px", fontFamily: MANROPE, fontWeight: 700, fontSize: 11, lineHeight: "13.8px", letterSpacing: "1.1px", color: "rgba(255,255,255,0.6)" }}>SECURE PAYMENTS</Box>
            {PAYMENTS.map((p) => (
              <Box key={p.label} sx={{ boxSizing: "border-box", height: 34, display: "inline-flex", alignItems: "center", gap: "8px", pl: "15px", pr: "14px", border: "1px solid rgba(255,255,255,0.25)", fontFamily: MANROPE, fontWeight: 600, fontSize: 13, lineHeight: "16.3px" }}>
                <Box component="img" src={`/images/home/${p.icon}.svg`} alt="" sx={{ width: 30, height: 30, mt: "-1px" }} />
                {p.label}
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: "28px", boxSizing: "border-box", minHeight: 48, display: "flex", alignItems: "center", px: "19px", py: "10px", border: "1px solid #333", fontFamily: MANROPE, fontWeight: 500, fontSize: 13, lineHeight: "16.3px", color: "#BBBBBB" }}>
            <Box component="span" sx={{ color: "#F5C400", mr: "4px" }}>⚠</Box> Beware of fake offers. We only contact you from @epicjourneys.in email addresses.
          </Box>

          <Box sx={{ mt: "29px", pb: "18px", display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", gap: 1.5, fontFamily: MANROPE, fontWeight: 400, fontSize: 13, lineHeight: "20.8px", color: "#A3A3A3" }}>
            <Box>© {new Date().getFullYear()} EpicJourneys. All rights reserved.</Box>
            <Box sx={{ maxWidth: 455, textAlign: { md: "right" } }}>
              {LEGAL.map((l, i) => (
                <React.Fragment key={l.label}>
                  {i > 0 && " · "}
                  <Box component={Link} href={l.href} sx={{ color: "inherit", textDecoration: "none", "&:hover": { color: "#fff" } }}>{l.label}</Box>
                </React.Fragment>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
