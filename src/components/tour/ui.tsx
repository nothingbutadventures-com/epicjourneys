import React from "react";
import { Box } from "@mui/material";

export const MANROPE = "var(--font-manrope), Manrope, sans-serif";
export const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";
export const INK = "#0C0C0C";
export const MUTED = "#555555";
export const RED = "#EA321E";
export const LINE = "#EDEDED";
export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Small round brand mark used before section eyebrows. */
export const Mark = () => (
  <Box component="span" aria-hidden="true" sx={{ width: 16, height: 16, borderRadius: "8px", bgcolor: RED, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: BALOO, fontWeight: 700, fontSize: 11, lineHeight: 1, flexShrink: 0, pb: "1px" }}>e</Box>
);

/** Eyebrow + two-tone heading ("red" is the highlighted part). */
export function SectionHead({ eyebrow, title, red, sub, id, size = 36 }: { eyebrow: string; title: string; red?: string; sub?: string; id?: string; size?: number }) {
  return (
    <Box id={id} sx={{ scrollMarginTop: "70px" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "16px", letterSpacing: "1.68px", textTransform: "uppercase", color: INK }}>
        <Mark />
        {eyebrow}
      </Box>
      <Box component="h2" sx={{ m: 0, mt: "8px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 30, md: size }, lineHeight: size === 36 ? "40px" : "44px", letterSpacing: "-0.03em", color: INK }}>
        {title}
        {red && <Box component="span" sx={{ color: RED }}> {red}</Box>}
      </Box>
      {sub && <Box sx={{ mt: "8px", fontFamily: MANROPE, fontWeight: 500, fontSize: 16, lineHeight: "24px", color: MUTED }}>{sub}</Box>}
    </Box>
  );
}

/** Thin divider that separates body sections. */
export const Rule = () => <Box sx={{ height: "1px", bgcolor: LINE, my: "48px" }} />;
