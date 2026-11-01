"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

const FAQS = [
  { q: "What is a LocalStart Lounge?", a: "A certified partner office or café in your own town where your group meets. You wait seated, hand over your bags, and our coordinated transport takes you to the main tour." },
  { q: "Who runs the tours?", a: "Trips are run by partners who live and work in the destination, and every itinerary is checked by our team before it is listed." },
  { q: "How do I find tours that start near me?", a: "Allow location access, or pick your starting city in the tours list. Tours and departure dates are sorted nearest first, so you can book from your own town." },
  { q: "Are prices per person and all-inclusive?", a: "Yes, prices are per person in rupees, shown after any discount. Each tour page lists exactly what is included." },
  { q: "Do I pay the full amount upfront?", a: "On many tours you can reserve with a small deposit and pay the rest in instalments before departure. The booking page shows the exact schedule." },
  { q: "Is it comfortable for elders and women travelling alone?", a: "Yes. You board from a seated lounge in your own town instead of travelling to a hub city, groups travel with a coordinator, and there are women-only departures." },
  { q: "What if I need to cancel?", a: "You can request a cancellation from your booking. Our team reviews it and gets back to you, and the refund follows the terms for your tour." },
  { q: "My city isn't listed. What can I do?", a: "Write to us at support@epicjourneys.in with your city and we'll let you know when tours start nearby." },
];

/** "Help & support": single-open accordion. */
export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Box component="section" id="faq" sx={{ bgcolor: "#fff", pt: { xs: 8, md: "126px" }, pb: { xs: 8, md: "78px" } }}>
      <Box sx={{ maxWidth: 880, mx: "auto", px: { xs: 2, md: 0 } }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
          <Box sx={{ width: 14, height: 14, borderRadius: "7px", bgcolor: "#EA321E", flexShrink: 0 }} />
          <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "14.4px", letterSpacing: "1.7px", color: "#0C0C0C" }}>HELP &amp; SUPPORT</Box>
        </Box>
        <Box component="h2" sx={{ m: 0, mt: "34px", textAlign: "center", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 32, md: 46 }, lineHeight: "46.9px", letterSpacing: "-0.035em", color: "#0C0C0C" }}>
          Questions? <Box component="span" sx={{ color: "#EA321E" }}>We&apos;ve got answers.</Box>
        </Box>

        <Box sx={{ mt: "53px", borderTop: "1px solid #0C0C0C" }}>
          {FAQS.map((f, i) => {
            const on = open === i;
            return (
              <Box key={f.q} sx={{ borderBottom: "1px solid rgba(12,12,12,0.14)" }}>
                <Box component="button" type="button" id={`faq-q-${i}`} aria-expanded={on} aria-controls={`faq-a-${i}`} onClick={() => setOpen(on ? null : i)} sx={{ all: "unset", boxSizing: "border-box", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, p: "24px 4px", cursor: "pointer", fontFamily: MANROPE, fontWeight: 600, fontSize: 18, lineHeight: "25.2px", color: "#0C0C0C", "&:focus-visible": { outline: "2px solid #EA321E", outlineOffset: -2 } }}>
                  <span>{f.q}</span>
                  <Box component="span" aria-hidden="true" sx={{ width: 32, height: 32, borderRadius: "16px", flexShrink: 0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: on ? "#EA321E" : "#0C0C0C", bgcolor: on ? "#EA321E" : "transparent", color: on ? "#fff" : "#0C0C0C", fontSize: 18, transition: "background-color .2s, border-color .2s" }}>
                    {on ? "–" : "+"}
                  </Box>
                </Box>
                <Box id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} sx={{ display: "grid", gridTemplateRows: on ? "1fr" : "0fr", transition: "grid-template-rows .25s ease" }}>
                  <Box sx={{ overflow: "hidden" }}>
                    <Box sx={{ p: "0 4px 24px", pr: { md: "78px" }, fontFamily: MANROPE, fontWeight: 400, fontSize: 17, lineHeight: "26.5px", color: "#4A4A4A" }}>{f.a}</Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ mt: "36px", textAlign: "center", fontFamily: MANROPE, fontWeight: 500, fontSize: 15, lineHeight: "18.8px", color: "#6B6B6B" }}>
          Still have a question? Email{" "}
          <Box component="a" href="mailto:support@epicjourneys.in" sx={{ color: "#0C0C0C", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>support@epicjourneys.in</Box> or{" "}
          <Box component={Link} href="/help" sx={{ color: "#0C0C0C", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>request a callback</Box>.
        </Box>
      </Box>
    </Box>
  );
}
