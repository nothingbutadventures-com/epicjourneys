import React from "react";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";

const ITEMS = [
  { icon: "bus", title: "Hometown Boarding", text: "No travelling to distant hub cities just to join the main tour." },
  { icon: "lounge", title: "LocalStart Lounges", text: "Wait in a comfortable, seated partner venue in your town until your transport arrives." },
  { icon: "partner", title: "Verified Local Partners", text: "Book online, or walk into a certified partner office in your city." },
  { icon: "wallet", title: "100% Fixed Budget", text: "Pocket-friendly, all-inclusive prices with zero hidden costs." },
];

/** Four-point value strip under the offers. */
export default function RibbonSection() {
  return (
    <Box component="section" sx={{ bgcolor: "#EDEDED", pt: "64px", pb: "63px" }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, columnGap: "40px", rowGap: "40px" }}>
        {ITEMS.map((it) => (
          <Box key={it.icon}>
            <Box component="img" src={`/images/home/ribbon-${it.icon}.svg`} alt="" width={72} height={72} sx={{ display: "block", width: 72, height: 72 }} />
            <Box component="h3" sx={{ m: 0, mt: "18px", fontFamily: MANROPE, fontWeight: 700, fontSize: 16, lineHeight: "20px", letterSpacing: "-0.1px", color: "#0C0C0C" }}>{it.title}</Box>
            <Box sx={{ mt: "9px", fontFamily: MANROPE, fontWeight: 400, fontSize: 14, lineHeight: "21px", color: "#4A4A4A" }}>{it.text}</Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
