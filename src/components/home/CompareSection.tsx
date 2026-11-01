import React from "react";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

const ROWS = [
  { label: "Departure point", legacy: "Major Tier-1 metros only, so you travel 100–200 km before the tour starts.", epic: "Your own Tier-2 or Tier-3 city, directly or via a local partner point." },
  { label: "Pre-tour waiting", legacy: "Crowded bus stands or chaotic railway platforms.", epic: "Partner comfort points: clean, seated local partner offices and cafés." },
  { label: "Hidden costs", legacy: "You pay extra for the bus or train just to reach the tour.", epic: "All-inclusive: local transit to the main tour is built into the budget." },
  { label: "Who it’s for", legacy: "Mass market with little comfort, or premium and overpriced.", epic: "The sweet spot: affordable pricing with Tier-1 convenience." },
];

const cols = { xs: "1fr", md: "318px 487px 515px" };
const Icon = ({ name }: { name: string }) => <Box component="img" src={`/images/home/${name}.svg`} alt="" sx={{ width: 30, height: 30, flexShrink: 0, mt: "-1px" }} />;
const colLabel = { fontFamily: MANROPE, fontWeight: 700, fontSize: 11.5, lineHeight: "14.4px", letterSpacing: "1.2px", color: "#8A8A8A" } as const;

/** Legacy operators vs EpicJourneys. */
export default function CompareSection() {
  return (
    <Box component="section" id="compare" sx={{ bgcolor: "#fff", pt: "62px", pb: { xs: 8, md: "128px" } }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" } }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "7px" }}>
          <Box sx={{ width: 14, height: 14, borderRadius: "7px", bgcolor: "#EA321E" }} />
          <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "14.4px", letterSpacing: "1.7px", color: "#0C0C0C" }}>COMPARE</Box>
        </Box>
        <Box component="h2" sx={{ m: 0, mt: "32px", textAlign: "center", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 30, sm: 40, md: 46 }, lineHeight: "46.9px", letterSpacing: "-0.035em", color: "#0C0C0C" }}>
          The usual tour operator <Box component="span" sx={{ color: "#EA321E" }}>vs EpicJourneys</Box>
        </Box>
        <Box sx={{ mt: "43px", textAlign: "center", fontFamily: MANROPE, fontWeight: 500, fontSize: 17, lineHeight: "27.2px", color: "#4A4A4A" }}>
          The same holiday, without the hard journey to reach it.
        </Box>

        <Box sx={{ mt: "46px" }}>
          {/* Header row */}
          <Box sx={{ display: "grid", gridTemplateColumns: cols, height: { md: 94 } }}>
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "flex-end", pb: "22px", pl: "28px", ...colLabel }}>FEATURE</Box>
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "flex-end", pb: "22px", ...colLabel }}>LEGACY TOUR OPERATORS</Box>
            <Box sx={{ bgcolor: "#0C0C0C", color: "#fff", p: "10px 28px 0" }}>
              <Box sx={{ fontFamily: BALOO, fontWeight: 700, fontSize: 32, lineHeight: "32px", letterSpacing: "-0.3px" }}>
                epic <Box component="span" sx={{ color: "#FF5A45" }}>journeys</Box>
                <Box component="span" sx={{ fontWeight: 600, fontSize: 19.8, color: "rgba(255,255,255,0.45)" }}>.in</Box>
              </Box>
              <Box sx={{ mt: "18px", fontFamily: MANROPE, fontWeight: 500, fontSize: 10.5, lineHeight: "13.1px", letterSpacing: "0.8px", color: "rgba(255,255,255,0.65)" }}>SMART MIDDLE-CLASS TRAVEL</Box>
            </Box>
          </Box>
          {ROWS.map((r) => (
            <Box key={r.label} sx={{ display: "grid", gridTemplateColumns: cols }}>
              <Box sx={{ p: { xs: "20px 0 4px", md: "24px 0 24px 28px" }, borderBottom: { md: "1px solid #EAEAEA" }, fontFamily: MANROPE, fontWeight: 700, fontSize: 15, lineHeight: "18.8px", color: "#0C0C0C" }}>{r.label}</Box>
              <Box sx={{ p: { xs: "4px 0", md: "20px 40px 24px 0" }, borderBottom: { md: "1px solid #EAEAEA" }, display: "flex", gap: "12px", fontFamily: MANROPE, fontWeight: 400, fontSize: 15, lineHeight: "23.3px", color: "#333" }}>
                <Icon name="cmp-x" />
                <span>{r.legacy}</span>
              </Box>
              <Box sx={{ p: { xs: "4px 0 16px", md: "20px 30px 24px 28px" }, bgcolor: "#F5F5F5", borderBottom: "1px solid #E1E1E1", display: "flex", gap: "12px", fontFamily: MANROPE, fontWeight: 500, fontSize: 15, lineHeight: "23.3px", color: "#0C0C0C" }}>
                <Icon name="cmp-check" />
                <span>{r.epic}</span>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
