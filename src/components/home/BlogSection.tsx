import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

// There are no guide articles yet, so each card opens the tours for that place.
const GUIDES = [
  { img: "cat-udaipur", tag: "HERITAGE · 4 MIN READ", title: "A slow weekend in Udaipur: lakes, palaces and sunset points", text: "How to spend three unhurried days around Lake Pichola, from the City Palace to sunset at the Monsoon Palace.", q: "Udaipur" },
  { img: "clip-rishikesh", tag: "ADVENTURE · 5 MIN READ", title: "First time rafting in Rishikesh? Here’s what to expect", text: "Seasons, what to wear and how a day on the Ganges rapids actually goes, for first-timers.", q: "Rishikesh" },
  { img: "cat-haridwar", tag: "SPIRITUAL · 3 MIN READ", title: "Watching the evening Ganga Aarti at Har Ki Pauri", text: "When to arrive, where to stand and what happens during Haridwar’s best-known evening ritual.", q: "Haridwar" },
];

/** "From the journal": three travel-guide cards. */
export default function BlogSection() {
  return (
    <Box component="section" id="journal" sx={{ bgcolor: "#fff", pt: "62px", pb: { xs: 8, md: "128px" } }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Box sx={{ width: 14, height: 14, borderRadius: "7px", bgcolor: "#EA321E", flexShrink: 0 }} />
          <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "14.4px", letterSpacing: "1.7px", color: "#0C0C0C" }}>TRAVEL GUIDES</Box>
        </Box>
        <Box component="h2" sx={{ m: 0, mt: "2px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 34, md: 46 }, lineHeight: "46.9px", letterSpacing: "-0.035em", color: "#0C0C0C" }}>
          From the <Box component="span" sx={{ color: "#EA321E" }}>journal</Box>
        </Box>
        <Box sx={{ mt: "29px", maxWidth: 560, fontFamily: MANROPE, fontWeight: 500, fontSize: 17, lineHeight: "27.2px", color: "#4A4A4A" }}>
          Short guides to the places our tours go: when to visit, what to expect and what to pack.
        </Box>

        <Box sx={{ mt: "46px", display: "grid", gap: "32px", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "repeat(3, minmax(0,1fr))" } }}>
          {GUIDES.map((g) => (
            <Box
              key={g.q}
              component={Link}
              href={`/tours?q=${encodeURIComponent(g.q)}`}
              sx={{ boxSizing: "border-box", display: "flex", flexDirection: "column", p: "11px 11px 18px", border: "1px solid #E1E1E1", borderRadius: "14px", bgcolor: "#fff", color: "inherit", textDecoration: "none", transition: "border-color .2s, box-shadow .2s", "&:hover": { borderColor: "#0C0C0C", boxShadow: "0 10px 24px -14px rgba(12,12,12,0.35)" }, "&:hover .guide-arrow": { transform: "translateX(4px)" } }}
            >
              <Box sx={{ position: "relative", height: 248, borderRadius: "8px", overflow: "hidden" }}>
                <Image src={`/images/home/${g.img}.jpg`} alt="" fill quality={80} sizes="(min-width: 900px) 33vw, 100vw" style={{ objectFit: "cover" }} />
              </Box>
              <Box sx={{ mt: "14px", px: "1px", fontFamily: MANROPE, fontWeight: 700, fontSize: 11.5, lineHeight: "14.4px", letterSpacing: "1.2px", color: "rgba(0,0,0,0.6)" }}>{g.tag}</Box>
              <Box component="h3" sx={{ m: 0, mt: "7px", px: "1px", minHeight: 55, fontFamily: MANROPE, fontWeight: 600, fontSize: 22, lineHeight: "27.5px", letterSpacing: "-0.5px", color: "#0C0C0C" }}>{g.title}</Box>
              <Box sx={{ mt: "11px", px: "1px", minHeight: 44, fontFamily: MANROPE, fontWeight: 400, fontSize: 15, lineHeight: "22px", color: "#444" }}>{g.text}</Box>
              <Box sx={{ mt: "6px", height: "1px", bgcolor: "rgba(0,0,0,0.12)" }} />
              <Box sx={{ mt: "10px", px: "1px", fontFamily: MANROPE, fontWeight: 700, fontSize: 11.5, lineHeight: "14.4px", letterSpacing: "1.2px", color: "#0C0C0C" }}>
                READ GUIDE <Box component="span" className="guide-arrow" sx={{ display: "inline-block", ml: "6px", transition: "transform .2s" }}>→</Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
