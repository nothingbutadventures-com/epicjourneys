import React from "react";
import Image from "next/image";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

const TILES = [
  { src: "clip-varanasi", title: "Evenings on the ghats", sub: "Aarti hour, Varanasi", big: true },
  { src: "cat-kerala", title: "Slow days on the water", sub: "Houseboat cruise, Kerala" },
  { src: "clip-rishikesh", title: "A little adventure", sub: "Rafting on the Ganga, Rishikesh" },
  { src: "clip-pushkar", title: "Unhurried visits", sub: "Temple trail, Karnataka", wide: true },
];

/** "See it before you book": photo gallery of life on tour. */
export default function ClipsSection() {
  return (
    <Box component="section" sx={{ bgcolor: "#fff", pt: { xs: 8, md: "126px" }, pb: { xs: 8, md: "92px" } }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" } }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { md: "flex-start" }, gap: { xs: 2, md: 4 } }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Box sx={{ width: 14, height: 14, borderRadius: "7px", bgcolor: "#EA321E", flexShrink: 0 }} />
              <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "14.4px", letterSpacing: "1.7px", color: "#0C0C0C" }}>SEE IT BEFORE YOU BOOK</Box>
            </Box>
            <Box component="h2" sx={{ m: 0, mt: "2px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 34, md: 46 }, lineHeight: "46.9px", letterSpacing: "-0.035em", color: "#0C0C0C" }}>
              This is what <Box component="span" sx={{ color: "#EA321E" }}>your trip</Box> looks like
            </Box>
          </Box>
          <Box sx={{ mt: { md: "25px" }, maxWidth: 560, fontFamily: MANROPE, fontWeight: 500, fontSize: 17, lineHeight: "27.2px", color: "#4A4A4A" }}>
            Families, friends and small groups on the road with us: the coach, the sights and the slow moments in between.
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 4, md: "42px" }, display: "grid", gap: "20px", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "640fr 320fr 320fr" }, gridAutoRows: { xs: 260, md: 253 } }}>
          {TILES.map((t) => (
            <Box
              key={t.title}
              sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "14px",
                bgcolor: "#0C0C0C",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                p: "0 24px 23px",
                gridRow: { md: t.big ? "span 2" : "auto" },
                gridColumn: { md: t.wide ? "span 2" : "auto" },
                minHeight: { xs: t.big ? 360 : 260, md: 0 },
                "& img": { transition: "transform .5s ease" },
                "&:hover img": { transform: "scale(1.03)" },
              }}
            >
              <Image src={`/images/home/${t.src}.jpg`} alt={`${t.title}: ${t.sub}`} fill quality={80} sizes={t.big ? "(min-width: 900px) 50vw, 100vw" : "(min-width: 900px) 25vw, 100vw"} style={{ objectFit: "cover" }} />
              <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(12,12,12,0) ${t.big ? 55 : 40}%, rgba(12,12,12,0.75) 100%)` }} />
              <Box sx={{ position: "relative" }}>
                <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 17, lineHeight: "21.3px" }}>{t.title}</Box>
                <Box sx={{ mt: "5.7px", fontFamily: MANROPE, fontWeight: 500, fontSize: 13, lineHeight: "18px" }}>{t.sub}</Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
