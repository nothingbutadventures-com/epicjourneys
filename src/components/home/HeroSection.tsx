"use client";

import React from "react";
import Image from "next/image";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

// Destination indicator from the design (the photo shown is the active one).
const SLIDES = ["Rajasthan", "Bhutan", "Sri Lanka", "Nepal", "Himachal"];
const ACTIVE = 2;
const CAPTION = "Mirissa, Sri Lanka";

function SearchPinIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <g stroke="#0C0C0C" strokeWidth="1.54375" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10.97" cy="10.97" r="6.906" />
        <path d="M16.05 16.05L23 23" />
      </g>
      <g stroke="#EA321E" strokeWidth="1.54375" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.97 15.44C10.97 15.44 7.92 12.3 7.92 10.32a3.047 3.047 0 0 1 6.094 0c0 1.98-3.05 5.12-3.05 5.12z" />
        <circle cx="10.97" cy="10.24" r="1.056" />
      </g>
    </svg>
  );
}

interface HeroSectionProps {
  /** City the visitor is leaving from (their detected / chosen location). */
  city: string;
  /** Opens the location picker so the visitor can change that city. */
  onCityClick: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
}

export default function HeroSection({ city, onCityClick, query, onQueryChange, onSearch }: HeroSectionProps) {
  return (
    <Box
      component="section"
      sx={{ position: "relative", overflow: "hidden", bgcolor: "#0C0C0C", color: "#fff", minHeight: { xs: 640, md: 862 }, height: { md: 862 } }}
    >
      <Image src="/images/home/hero-mirissa.jpg" alt="" fill priority quality={85} sizes="100vw" style={{ objectFit: "cover" }} />

      {/* Scrims: left-to-right darkening, bottom darkening, and a top band for the header. */}
      <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0) 100%)" }} />
      <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)" }} />
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 160, background: "linear-gradient(180deg, rgba(12,12,12,0.7) 0%, rgba(12,12,12,0.45) 40%, rgba(12,12,12,0) 100%)" }} />

      <Box sx={{ position: "relative", maxWidth: 1440, mx: "auto", px: { xs: 2.5, md: "60px" }, pt: { xs: 14, md: "272px" }, pb: { xs: 8, md: 0 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "4px", bgcolor: "#EA321E", flexShrink: 0 }} />
          <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 14.5, lineHeight: "20.3px", color: "rgba(255,255,255,0.92)" }}>
            India&rsquo;s trusted online travel network, operating right out of your neighborhood.
          </Box>
        </Box>

        <Box
          component="h1"
          sx={{
            m: 0,
            mt: "17.7px",
            fontFamily: BALOO,
            fontWeight: 500,
            fontSize: { xs: 40, sm: 52, md: 61.9 },
            lineHeight: 1.021,
            letterSpacing: "-0.0355em",
            color: "#fff",
          }}
        >
          <Box component="span" sx={{ display: "block" }}>Group tours made easy.</Box>
          <Box component="span" sx={{ display: "block" }}>
            Your journey from{" "}
            <Box
              component="button"
              type="button"
              onClick={onCityClick}
              title="Change your starting city"
              sx={{
                all: "unset",
                cursor: "pointer",
                color: "#FF5A45",
                borderRadius: "4px",
                "&:hover": { textDecoration: "underline", textUnderlineOffset: "6px", textDecorationThickness: "2px" },
                "&:focus-visible": { outline: "2px solid #fff", outlineOffset: 4 },
              }}
            >
              {city}
            </Box>
          </Box>
          <Box component="span" sx={{ display: "block" }}>to Colombo starts here.</Box>
        </Box>

        <Box sx={{ mt: "37.4px", maxWidth: 818, fontFamily: MANROPE, fontWeight: 500, fontSize: 16, lineHeight: "25.6px", color: "rgba(255,255,255,0.86)" }}>
          No exhausting 200 km journeys to catch a bus or train. Comfortable, budget-friendly group tours across India, Nepal, Bhutan and Sri Lanka, starting at the EpicJourneys LocalStart Lounge in your town.
        </Box>

        <Box
          component="form"
          id="journey-search"
          role="search"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            onSearch();
          }}
          sx={{ mt: "31.8px", maxWidth: 760, height: 62, boxSizing: "border-box", display: "flex", alignItems: "center", bgcolor: "#fff", border: "1px solid #fff", pl: "20px" }}
        >
          <SearchPinIcon />
          <Box
            component="input"
            type="search"
            name="q"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onQueryChange(e.target.value)}
            placeholder="Search tours, places or themes"
            aria-label="Search tours, places or themes"
            autoComplete="off"
            sx={{
              flex: 1,
              minWidth: 0,
              height: "100%",
              ml: "21px",
              p: 0,
              border: 0,
              outline: 0,
              bgcolor: "transparent",
              fontFamily: MANROPE,
              fontWeight: 500,
              fontSize: 16,
              color: "#0C0C0C",
              "&::placeholder": { color: "#8A8A8A", opacity: 1 },
              "&::-webkit-search-cancel-button": { display: "none" },
            }}
          />
          <Box
            component="button"
            type="submit"
            sx={{
              width: { xs: 104, md: 136 },
              height: 60,
              flexShrink: 0,
              border: 0,
              borderRadius: 0,
              bgcolor: "#0C0C0C",
              color: "#fff",
              cursor: "pointer",
              fontFamily: MANROPE,
              fontWeight: 700,
              fontSize: 14,
              lineHeight: "17.5px",
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              transition: "background-color .2s",
              "&:hover": { bgcolor: "#262626" },
              "&:focus-visible": { outline: "2px solid #EA321E", outlineOffset: -4 },
            }}
          >
            Search
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: { xs: "none", md: "block" }, position: "absolute", right: 75, bottom: 44 }}>
        <Box sx={{ mb: "24px", textAlign: "right", fontFamily: MANROPE, fontWeight: 700, fontSize: 11, lineHeight: "13.8px", letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
          {CAPTION}
        </Box>
        <Box sx={{ display: "flex", gap: "16px" }}>
          {SLIDES.map((name, i) => {
            const active = i === ACTIVE;
            return (
              <Box key={name} sx={{ width: 104 }}>
                <Box sx={{ opacity: 0.8, fontFamily: MANROPE, fontWeight: 600, fontSize: 11, lineHeight: "13.8px", letterSpacing: "0.9px", color: active ? "#fff" : "rgba(255,255,255,0.62)" }}>
                  {String(i + 1).padStart(2, "0")}
                </Box>
                <Box sx={{ mt: "3.2px", fontFamily: MANROPE, fontWeight: 700, fontSize: 13, lineHeight: "16.3px", color: active ? "#fff" : "rgba(255,255,255,0.62)" }}>{name}</Box>
                <Box sx={{ mt: "9.7px", position: "relative", height: 2, bgcolor: "rgba(255,255,255,0.28)" }}>
                  {active && <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, bgcolor: "#fff" }} />}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
