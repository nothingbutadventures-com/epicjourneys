import React from "react";
import Image from "next/image";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

const STEPS = ["LocalStart Lounge", "The journey", "Stays", "Days out"];

/** Full-width photo with the story of a tour day; the design shows the first step. */
export default function OnTourSection() {
  return (
    <Box component="section" sx={{ position: "relative", overflow: "hidden", bgcolor: "#0C0C0C", color: "#fff", minHeight: { xs: 640, md: 828 }, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <Image src="/images/home/ontour.jpg" alt="" fill quality={80} sizes="100vw" style={{ objectFit: "cover" }} />
      <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,12,12,0.88) 0%, rgba(12,12,12,0.6) 20%, rgba(12,12,12,0.08) 40%, rgba(12,12,12,0.5) 60%, rgba(12,12,12,0.92) 100%)" }} />

      <Box sx={{ position: "relative", width: "100%", maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" }, pt: "54px" }}>
        <Box component="h2" sx={{ m: 0, maxWidth: 760, fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 36, sm: 48, md: 60.5 }, lineHeight: 1.02, letterSpacing: "-0.0347em" }}>
          What a day on tour <Box component="span" sx={{ color: "#FF5A45" }}>feels like</Box>
        </Box>
      </Box>

      <Box sx={{ position: "relative", width: "100%", maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" }, pb: "73px", pt: 6 }}>
        <Box sx={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 11.5, lineHeight: "16px", letterSpacing: "1.2px" }}>START IN YOUR OWN TOWN</Box>
        <Box component="h3" sx={{ m: 0, mt: "7px", fontFamily: MANROPE, fontWeight: 600, fontSize: { xs: 34, md: 44 }, lineHeight: "46.2px", letterSpacing: "-0.025em" }}>LocalStart Lounge</Box>
        <Box sx={{ mt: "21px", maxWidth: 525, fontFamily: MANROPE, fontWeight: 500, fontSize: 16, lineHeight: "25.6px", color: "rgba(255,255,255,0.86)" }}>
          Arrive at a partner lounge a short ride from home. Take a seat, have a glass of water and hand your bags to the coordinator, who checks you in before the transport collects the group.
        </Box>
        <Box sx={{ mt: "45px", display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 300px)" }, columnGap: "20px", rowGap: 2 }}>
          {STEPS.map((s, i) => (
            <Box key={s} sx={{ borderTop: i === 0 ? "2px solid #FF5A45" : "1px solid rgba(255,255,255,0.3)", pt: i === 0 ? "13px" : "14px", fontFamily: MANROPE, fontWeight: 600, fontSize: 14, lineHeight: "20px", color: i === 0 ? "#fff" : "rgba(255,255,255,0.6)" }}>
              {String(i + 1).padStart(2, "0")}&nbsp;&nbsp;{s}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
