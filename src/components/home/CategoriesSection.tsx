import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

// Each card opens the tours list filtered to the closest travel style(s) set up in admin.
// A card without styles opens every tour.
const CARDS = [
  { title: "Spiritual & Pilgrimage", text: "Hassle-free sacred journeys for your parents.", image: "haridwar", styles: ["Spiritual & Pilgrimage"], big: true },
  { title: "Women's Special", text: "Safe, liberating escapes with direct local departure.", image: "udaipur", styles: ["Women-only"] },
  { title: "Cultural Wonders", text: "Explore the heritage of India, Bhutan and Sri Lanka.", image: "bhutan", styles: ["Heritage & Culture"] },
  { title: "Easy Adventures", text: "Budget-friendly hill stations, wildlife and nature trails.", image: "solang", styles: ["Wildlife & Nature Safari", "Mountain Trekking & Hiking"] },
  { title: "Family Bonanza", text: "Kid-friendly plans designed to keep everyone smiling.", image: "kerala", styles: [] as string[] },
];

export default function CategoriesSection() {
  return (
    <Box component="section" id="categories" sx={{ bgcolor: "#fff", pt: { xs: 8, md: "126px" }, pb: "64px" }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" } }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { md: "flex-start" }, gap: { xs: 2, md: 4 } }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Box sx={{ width: 14, height: 14, borderRadius: "7px", bgcolor: "#EA321E", flexShrink: 0 }} />
              <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "14.4px", letterSpacing: "1.7px", color: "#0C0C0C" }}>TOUR CATEGORIES</Box>
            </Box>
            <Box component="h2" sx={{ m: 0, mt: "2px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 34, md: 46 }, lineHeight: "46.9px", letterSpacing: "-0.035em", color: "#0C0C0C" }}>
              Explore by <Box component="span" sx={{ color: "#EA321E" }}>tour category</Box>
            </Box>
          </Box>
          <Box sx={{ mt: { md: "25px" }, maxWidth: 560, fontFamily: MANROPE, fontWeight: 500, fontSize: 17, lineHeight: "27.2px", color: "#4A4A4A" }}>
            Pick the kind of trip you want. Every category starts from a LocalStart Lounge near you.
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 4, md: "45px" }, display: "grid", gap: "24px", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "489fr 391fr 391fr" }, gridAutoRows: { xs: 300, md: 300 } }}>
          {CARDS.map((c) => (
            <Box
              key={c.title}
              component={Link}
              href={c.styles.length ? `/tours?style=${encodeURIComponent(c.styles.join(","))}` : "/tours"}
              sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "14px",
                bgcolor: "#0C0C0C",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                p: "0 28px 27px",
                color: "#fff",
                textDecoration: "none",
                gridRow: { md: c.big ? "span 2" : "auto" },
                gridColumn: { sm: c.big ? "1 / -1" : "auto", md: "auto" },
                minHeight: { xs: c.big ? 420 : 300, md: 0 },
                "& img": { transition: "transform .5s ease" },
                "&:hover img": { transform: "scale(1.04)" },
                "&:hover .cat-arrow": { transform: "translateX(4px)" },
              }}
            >
              <Image src={`/images/home/cat-${c.image}.jpg`} alt="" fill quality={80} sizes="(min-width: 900px) 40vw, 100vw" style={{ objectFit: "cover" }} />
              <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(12,12,12,0) ${c.big ? 40 : 30}%, rgba(12,12,12,0.78) 100%)` }} />
              <Box sx={{ position: "relative" }}>
                <Box component="h3" sx={{ m: 0, fontFamily: MANROPE, fontWeight: 400, fontSize: c.big ? { xs: 30, md: 38 } : 28, lineHeight: c.big ? "41.8px" : "30.8px", letterSpacing: c.big ? "-0.4px" : "-0.3px" }}>{c.title}</Box>
                <Box sx={{ mt: "11.5px", fontFamily: MANROPE, fontWeight: 500, fontSize: 15, lineHeight: "22.5px", color: "rgba(255,255,255,0.88)" }}>{c.text}</Box>
                <Box sx={{ mt: "13px", fontFamily: MANROPE, fontWeight: 700, fontSize: 12, lineHeight: "15px", letterSpacing: "1px" }}>
                  SEE TOURS <Box component="span" className="cat-arrow" sx={{ display: "inline-block", ml: "4px", color: "#FF5A45", transition: "transform .2s" }}>→</Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
