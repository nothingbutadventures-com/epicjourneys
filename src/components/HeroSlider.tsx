"use client";

import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Button, IconButton } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { CompassRose, HeroScene, type HeroPalette } from "@/components/home/Illustrations";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const PALETTES: { variant: "mountain" | "fort" | "forest"; bg: string; p: HeroPalette }[] = [
  { variant: "mountain", bg: "linear-gradient(115deg, #e0f2fe 0%, #f0f9ff 45%, #bae6fd 100%)", p: { bg: "#e0f2fe", sun: "#fde047", far: "#93c5fd", mid: "#7dd3fc", near: "#86efac", accent: "#22c55e", ink: "#0f172a" } },
  { variant: "fort", bg: "linear-gradient(115deg, #ffedd5 0%, #fff7ed 45%, #fed7aa 100%)", p: { bg: "#ffedd5", sun: "#fb923c", far: "#fdba74", mid: "#fca5a5", near: "#fcd34d", accent: "#f97316", ink: "#7c2d12" } },
  { variant: "forest", bg: "linear-gradient(115deg, #dcfce7 0%, #f7fee7 45%, #bbf7d0 100%)", p: { bg: "#dcfce7", sun: "#facc15", far: "#86efac", mid: "#4ade80", near: "#bef264", accent: "#16a34a", ink: "#14532d" } },
];

const SLIDES = [
  {
    image: "/images/hero-slide-1.jpg",
    region: "Himalayas & Hill Stations",
    title: "Manali Kasol Dharamshala",
    stops: ["Manali", "Kasol", "Dharamshala", "Shimla"],
    meta: "7 Days | Every Saturday | from ₹18,500",
  },
  {
    image: "/images/hero-slide-2.jpg",
    region: "Royal Rajasthan",
    title: "Jaipur Jodhpur Jaisalmer",
    stops: ["Jaipur", "Jodhpur", "Jaisalmer", "Udaipur"],
    meta: "8 Days | Every Friday | from ₹24,000",
  },
  {
    image: "/images/hero-slide-3.jpg",
    region: "Road Trips & Wild Escapes",
    title: "Rishikesh Mussoorie Nainital",
    stops: ["Rishikesh", "Mussoorie", "Nainital"],
    meta: "6 Days | Daily departures | from ₹14,900",
  },
];

const META_ICONS = [CalendarMonthRoundedIcon, EventRepeatRoundedIcon, PaymentsRoundedIcon];

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function HeroSlider({ onBook }: { onBook?: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [index]);

  const go = (d: number) => setIndex((i) => (i + d + SLIDES.length) % SLIDES.length);
  const arrowSx = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    bgcolor: "rgba(255,255,255,0.85)",
    border: "1px solid #e2e8f0",
    color: "#0f172a",
    zIndex: 3,
    "&:hover": { bgcolor: "#ffffff" },
    display: { xs: "none", sm: "inline-flex" },
  } as const;

  return (
    <Container maxWidth="lg" sx={{ pt: 3 }}>
      <Box
        sx={{
          position: "relative",
          height: { xs: 360, md: 400 },
          borderRadius: "6px",
          overflow: "hidden",
          bgcolor: "#f0f9ff",
          border: "1px solid #e2e8f0",
          "&, & *": { outline: "none" },
          "& *:focus, & *:focus-visible": { outline: "none !important", boxShadow: "none" },
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: "absolute", inset: 0, background: PALETTES[index].bg }}
          >
            <Box sx={{ position: "absolute", inset: 0, opacity: 0.5, backgroundImage: "radial-gradient(rgba(15,23,42,0.12) 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} />
            <Box sx={{ position: "absolute", right: { xs: -80, md: 0 }, bottom: 0, top: 0, width: { xs: "100%", md: "62%" }, opacity: { xs: 0.55, md: 1 } }}>
              <HeroScene variant={PALETTES[index].variant} p={PALETTES[index].p} />
            </Box>
          </motion.div>
        </AnimatePresence>

        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", right: 90, top: 40, zIndex: 2 }}
        >
          <Box sx={{ display: { xs: "none", md: "block" }, filter: "drop-shadow(0 10px 18px rgba(15,23,42,0.18))" }}>
            <CompassRose size={96} />
          </Box>
        </motion.div>

        <IconButton aria-label="Previous slide" onClick={() => go(-1)} sx={{ ...arrowSx, left: 20 }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <IconButton aria-label="Next slide" onClick={() => go(1)} sx={{ ...arrowSx, right: 20 }}>
          <ArrowForwardRoundedIcon />
        </IconButton>

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            height: "100%",
            display: "flex",
            alignItems: "center",
            px: { xs: 3, sm: 10, md: 12 },
            color: "#0f172a",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
              style={{ maxWidth: 620 }}
            >
              <motion.div variants={item}>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, mb: 1.5, borderRadius: "999px", bgcolor: "#fef9c3", border: "1px solid #fde047", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                  <ExploreRoundedIcon sx={{ fontSize: 15, color: "#ca8a04" }} />
                  {SLIDES[index].region}
                </Box>
              </motion.div>
              <motion.div variants={item}>
                <Box sx={{ borderLeft: "3px solid #facc15", pl: 2, mb: 2 }}>
                  <Typography variant="h1" sx={{ fontSize: { xs: "1.9rem", md: "2.8rem" }, fontWeight: 800, color: "#0f172a", lineHeight: 1.15 }}>
                    {SLIDES[index].title}
                  </Typography>
                </Box>
              </motion.div>
              <motion.div variants={item}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
                  {SLIDES[index].stops.map((stop) => (
                    <Box key={stop} sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 1.1, py: 0.35, borderRadius: "6px", bgcolor: "#ffffff", border: "1px solid #e2e8f0", fontSize: "0.8rem", fontWeight: 600 }}>
                      <PlaceRoundedIcon sx={{ fontSize: 14, color: "#ca8a04" }} />
                      {stop}
                    </Box>
                  ))}
                </Box>
              </motion.div>
              <motion.div variants={item}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, fontSize: { xs: "0.85rem", md: "1rem" }, fontWeight: 600 }}>
                  {SLIDES[index].meta.split(" | ").map((m, k) => (
                    <Box key={m} sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}>
                      {(() => {
                        const Icon = META_ICONS[k] ?? CalendarMonthRoundedIcon;
                        return <Icon sx={{ fontSize: 18, color: "#ca8a04" }} />;
                      })()}
                      {m}
                    </Box>
                  ))}
                </Box>
              </motion.div>
              <motion.div variants={item}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} style={{ display: "inline-block" }}>
                  <Button
                    variant="contained"
                    onClick={onBook}
                    sx={{ bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, px: 4, py: 1.1, borderRadius: "8px", boxShadow: "0 12px 28px -8px rgba(250,204,21,0.6)", "&:hover": { bgcolor: "#eab308" } }}
                  >
                    Book now
                  </Button>
                </motion.div>
                <Typography sx={{ fontSize: "0.7rem", color: "#64748b", mt: 1.5 }}>*T&C Apply</Typography>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </Box>

        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 1,
            zIndex: 3,
          }}
        >
          {SLIDES.map((s, i) => (
            <Box
              key={s.image}
              onClick={() => setIndex(i)}
              sx={{ width: 44, height: 4, cursor: "pointer", borderRadius: "6px", bgcolor: "rgba(15,23,42,0.15)", overflow: "hidden" }}
            >
              {i === index && (
                <motion.div
                  key={`p${index}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 6, ease: "linear" }}
                  style={{ height: "100%", background: "#0f172a" }}
                />
              )}
              {i < index && <Box sx={{ width: "100%", height: "100%", bgcolor: "#0f172a" }} />}
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  );
}
