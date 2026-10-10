"use client";

import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Button, IconButton } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

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
    bgcolor: "rgba(255,255,255,0.7)",
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
          bgcolor: "#0f172a",
          "&, & *": { outline: "none" },
          "& *:focus, & *:focus-visible": { outline: "none !important", boxShadow: "none" },
        }}
      >
        {SLIDES.map((s, i) => (
          <Box
            key={s.image}
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url('${s.image}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === index ? 1 : 0,
              transition: "opacity 0.8s ease",
            }}
          />
        ))}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0) 70%)",
          }}
        />

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
            color: "#fff",
          }}
        >
          <Box sx={{ maxWidth: 620 }}>
            <Box sx={{ borderLeft: "3px solid #facc15", pl: 2, mb: 2.5 }}>
              <Typography sx={{ fontSize: "1rem", opacity: 0.95 }}>{SLIDES[index].region}</Typography>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "1.9rem", md: "2.8rem" },
                  fontWeight: 700,
                  color: "#facc15",
                  lineHeight: 1.15,
                }}
              >
                {SLIDES[index].title}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.95rem", mb: 1.5, opacity: 0.95 }}>
              {SLIDES[index].stops.join("  •  ")}
            </Typography>
            <Typography sx={{ fontSize: { xs: "1rem", md: "1.2rem" }, fontWeight: 600, mb: 3 }}>
              {SLIDES[index].meta}
            </Typography>
            <Button
              variant="contained"
              onClick={onBook}
              sx={{
                bgcolor: "#facc15",
                color: "#0f172a",
                fontWeight: 700,
                px: 4,
                borderRadius: "6px",
                "&:hover": { bgcolor: "#eab308" },
              }}
            >
              Book now
            </Button>
            <Typography sx={{ fontSize: "0.7rem", opacity: 0.6, mt: 1.5 }}>*T&C Apply</Typography>
          </Box>
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
              sx={{
                width: 44,
                height: 4,
                cursor: "pointer",
                borderRadius: "6px",
                bgcolor: i === index ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </Box>
      </Box>
    </Container>
  );
}
