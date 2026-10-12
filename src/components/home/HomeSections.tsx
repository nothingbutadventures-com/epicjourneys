"use client";

import React, { useEffect, useRef } from "react";
import { Box, Container, Typography, Button, Grid } from "@mui/material";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
  type Variants,
} from "framer-motion";
import HikingRoundedIcon from "@mui/icons-material/HikingRounded";
import TempleHinduRoundedIcon from "@mui/icons-material/TempleHinduRounded";
import FortRoundedIcon from "@mui/icons-material/FortRounded";
import ForestRoundedIcon from "@mui/icons-material/ForestRounded";
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import LandscapeRoundedIcon from "@mui/icons-material/LandscapeRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import SyncAltRoundedIcon from "@mui/icons-material/SyncAltRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import LocationCityRoundedIcon from "@mui/icons-material/LocationCityRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { CompassRose, MountainScene, StepIllustration } from "./Illustrations";

const EASE = [0.22, 1, 0.36, 1] as const;

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
export const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  accent,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <Reveal>
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 0.5,
            mb: 1.5,
            borderRadius: "999px",
            bgcolor: "#fef9c3",
            color: "#a16207",
            fontSize: "0.7rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <ExploreRoundedIcon sx={{ fontSize: 14 }} />
          {eyebrow}
        </Box>
        <Typography sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          {title}{" "}
          {accent && (
            <Box component="span" sx={{ color: "#ca8a04", position: "relative" }}>
              {accent}
              <motion.svg
                viewBox="0 0 120 10"
                preserveAspectRatio="none"
                style={{ position: "absolute", left: 0, bottom: -6, width: "100%", height: 8 }}
                aria-hidden
              >
                <motion.path
                  d="M2 6 Q30 0 60 5 T118 4"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.3 }}
                />
              </motion.svg>
            </Box>
          )}
        </Typography>
        {subtitle && (
          <Typography sx={{ color: "#64748b", fontSize: "0.98rem", mt: 1.5, maxWidth: 560, mx: "auto" }}>{subtitle}</Typography>
        )}
      </Box>
    </Reveal>
  );
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${Math.round(v).toLocaleString("en-IN")}${suffix}`);
  useEffect(() => {
    if (inView) {
      const c = animate(mv, value, { duration: 1.6, ease: "easeOut" });
      return () => c.stop();
    }
  }, [inView, value, mv]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

/** Scrolling ribbon of destination names. */
export function DestinationMarquee({ names }: { names: string[] }) {
  const list = names.length ? names : ["Manali", "Jaipur", "Rishikesh", "Goa", "Kerala", "Leh", "Udaipur", "Varanasi"];
  const loop = [...list, ...list];
  return (
    <Box sx={{ bgcolor: "#0f172a", py: 1.4, overflow: "hidden", mt: 5, borderTop: "3px solid #facc15" }}>
      <motion.div
        style={{ display: "flex", gap: 40, width: "max-content" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: Math.max(20, loop.length * 2.2), repeat: Infinity, ease: "linear" }}
      >
        {loop.map((n, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "#fff", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            <ExploreRoundedIcon sx={{ fontSize: 16, color: "#facc15" }} />
            {n}
          </Box>
        ))}
      </motion.div>
    </Box>
  );
}

export function StatsStrip({ tours, destinations, states, cities }: { tours: number; destinations: number; states: number; cities: number }) {
  const stats = [
    { icon: <RouteRoundedIcon />, value: tours, label: "Curated tours", color: "#facc15" },
    { icon: <MapRoundedIcon />, value: destinations, label: "Destinations", color: "#38bdf8" },
    { icon: <LocationCityRoundedIcon />, value: cities, label: "Departure cities", color: "#34d399" },
    { icon: <LandscapeRoundedIcon />, value: states, label: "Indian states", color: "#fb7185" },
  ];
  return (
    <Container maxWidth="lg" sx={{ pt: 6 }}>
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
        <Grid container spacing={2}>
          {stats.map((s) => (
            <Grid size={{ xs: 6, md: 3 }} key={s.label}>
              <motion.div variants={rise} whileHover={{ y: -4 }}>
                <Box
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    p: 2.5,
                    borderRadius: "10px",
                    bgcolor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.75,
                  }}
                >
                  <Box sx={{ position: "absolute", right: -18, top: -18, width: 80, height: 80, borderRadius: "50%", bgcolor: s.color, opacity: 0.18 }} />
                  <Box sx={{ width: 44, height: 44, borderRadius: "10px", bgcolor: s.color, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {s.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" }, fontWeight: 800, lineHeight: 1 }}>
                      <Counter value={s.value} suffix="+" />
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mt: 0.5, fontWeight: 600 }}>{s.label}</Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
}

const EXPERIENCES = [
  { label: "Adventure", icon: HikingRoundedIcon, bg: "#fef3c7", fg: "#b45309" },
  { label: "Mountains", icon: LandscapeRoundedIcon, bg: "#e0f2fe", fg: "#0369a1" },
  { label: "Heritage", icon: FortRoundedIcon, bg: "#ffe4e6", fg: "#be123c" },
  { label: "Spiritual", icon: TempleHinduRoundedIcon, bg: "#ede9fe", fg: "#6d28d9" },
  { label: "Wildlife", icon: ForestRoundedIcon, bg: "#dcfce7", fg: "#15803d" },
  { label: "Beaches", icon: BeachAccessRoundedIcon, bg: "#cffafe", fg: "#0e7490" },
];

export function ExperienceRail({ onPick }: { onPick: () => void }) {
  return (
    <Container maxWidth="lg" sx={{ pt: 9 }}>
      <SectionHeading eyebrow="Pick your vibe" title="Journeys for every" accent="kind of traveller" subtitle="From snow-capped passes to temple towns and sun-soaked shores." />
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
        <Grid container spacing={2}>
          {EXPERIENCES.map(({ label, icon: Icon, bg, fg }) => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={label}>
              <motion.div variants={rise} whileHover={{ y: -6, rotate: -1.5 }} whileTap={{ scale: 0.96 }} onClick={onPick} style={{ cursor: "pointer" }}>
                <Box sx={{ p: 2.5, textAlign: "center", borderRadius: "12px", bgcolor: "#fff", border: "1px solid #e2e8f0", transition: "box-shadow .2s", "&:hover": { boxShadow: "0 16px 30px -16px rgba(15,23,42,0.3)" } }}>
                  <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }}>
                    <Box sx={{ width: 64, height: 64, mx: "auto", mb: 1.5, borderRadius: "50%", bgcolor: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon sx={{ fontSize: 32 }} />
                    </Box>
                  </motion.div>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a" }}>{label}</Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
}

const STEPS = [
  { kind: "search", title: "Search", text: "Choose where you start and where you want to go." },
  { kind: "pick", title: "Pick a date", text: "Compare departures and lock in the one that suits you." },
  { kind: "pack", title: "Pack up", text: "Get itinerary, inclusions and everything you need to carry." },
  { kind: "go", title: "Go!", text: "Meet your group at the starting point and enjoy the ride." },
] as const;

export function HowItWorks() {
  return (
    <Box sx={{ mt: 10, py: 8, bgcolor: "#fffbeb", position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.5, backgroundImage: "radial-gradient(#fde68a 1.5px, transparent 1.5px)", backgroundSize: "26px 26px" }} />
      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <SectionHeading eyebrow="Simple as 1-2-3-4" title="How your" accent="journey begins" />
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
          <Grid container spacing={3}>
            {STEPS.map((s, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.title}>
                <motion.div variants={rise} whileHover={{ y: -6 }} style={{ height: "100%" }}>
                  <Box sx={{ position: "relative", height: "100%", p: 3, pt: 4, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #fde68a", textAlign: "center" }}>
                    <Box sx={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", width: 34, height: 34, borderRadius: "50%", bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fffbeb" }}>
                      {i + 1}
                    </Box>
                    <StepIllustration kind={s.kind} />
                    <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", mt: 1.5, mb: 0.5 }}>{s.title}</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "0.86rem", lineHeight: 1.6 }}>{s.text}</Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}

const PROMISES = [
  { icon: VerifiedRoundedIcon, title: "Verified tours", text: "Every itinerary is reviewed before it goes live.", color: "#10b981" },
  { icon: HandshakeRoundedIcon, title: "Trusted partners", text: "Local operators who know the roads and the stories.", color: "#6366f1" },
  { icon: CurrencyRupeeRoundedIcon, title: "Clear pricing", text: "Per-person prices in rupees, with discounts shown upfront.", color: "#f59e0b" },
  { icon: SyncAltRoundedIcon, title: "Flexible plans", text: "Choose the departure city that is closest to you.", color: "#0ea5e9" },
  { icon: SupportAgentRoundedIcon, title: "Real support", text: "Got a question? Our team is a message away.", color: "#ec4899" },
];

export function WhyUs() {
  return (
    <Container maxWidth="lg" sx={{ pt: 10 }}>
      <SectionHeading eyebrow="Why EpicJourneys" title="Travel that feels" accent="effortless" subtitle="We handle the details so you can focus on the view." />
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
        <Grid container spacing={2.5} sx={{ justifyContent: "center" }}>
          {PROMISES.map(({ icon: Icon, title, text, color }) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={title}>
              <motion.div variants={rise} whileHover={{ y: -5 }} style={{ height: "100%" }}>
                <Box sx={{ height: "100%", p: 3, borderRadius: "12px", bgcolor: "#fff", border: "1px solid #e2e8f0", display: "flex", gap: 2, position: "relative", overflow: "hidden", "&:hover .glow": { opacity: 0.18, transform: "scale(1.4)" } }}>
                  <Box className="glow" sx={{ position: "absolute", right: -30, bottom: -30, width: 110, height: 110, borderRadius: "50%", bgcolor: color, opacity: 0.08, transition: "all .4s" }} />
                  <Box sx={{ width: 52, height: 52, borderRadius: "12px", bgcolor: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 10px 20px -8px ${color}` }}>
                    <Icon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", mb: 0.5 }}>{title}</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "0.86rem", lineHeight: 1.6 }}>{text}</Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
}

export function CtaBanner({ onExplore }: { onExplore: () => void }) {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Reveal>
        <Box sx={{ position: "relative", overflow: "hidden", borderRadius: "16px", bgcolor: "#fde68a", border: "1px solid #facc15" }}>
          <Box sx={{ position: "relative", zIndex: 2, p: { xs: 3, md: 6 }, maxWidth: { md: 560 } }}>
            <Typography sx={{ fontSize: { xs: "1.7rem", md: "2.4rem" }, fontWeight: 800, color: "#0f172a", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Your next story starts at a trailhead.
            </Typography>
            <Typography sx={{ color: "#422006", mt: 1.5, mb: 3, fontSize: "1rem", opacity: 0.85 }}>
              Pick a destination, choose a date and hit the road with people who love it as much as you do.
            </Typography>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
              <Button
                variant="contained"
                onClick={onExplore}
                endIcon={
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ display: "inline-flex" }}>
                    <ArrowForwardRoundedIcon />
                  </motion.span>
                }
                sx={{ px: 3.5, py: 1.3, fontSize: "0.95rem", fontWeight: 700, borderRadius: "8px" }}
              >
                Explore tours
              </Button>
            </motion.div>
          </Box>
          <Box sx={{ position: "absolute", right: 24, top: 20, zIndex: 3, display: { xs: "none", md: "block" } }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
              <CompassRose size={110} />
            </motion.div>
          </Box>
          <Box sx={{ position: { xs: "relative", md: "absolute" }, right: 0, bottom: 0, left: { md: "40%" }, zIndex: 1, lineHeight: 0 }}>
            <MountainScene height={220} />
          </Box>
        </Box>
      </Reveal>
    </Container>
  );
}
