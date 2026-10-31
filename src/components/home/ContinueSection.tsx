"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const KEY = "ej_recent";

interface Recent {
  id: string;
  slug: string;
  title: string;
  image: string;
  days: number;
  nights: number;
  price: number;
}

/** Tours this visitor opened recently (saved in this browser by the tour page). Hidden when there are none. */
export default function ContinueSection() {
  const [items, setItems] = useState<Recent[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) setItems(saved.filter((x) => x?.id && x?.title));
    } catch {}
  }, []);

  if (items.length === 0) return null;

  const clear = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setItems([]);
  };

  return (
    <Box component="section" sx={{ bgcolor: "#fff", pt: "67px", pb: "73px" }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box component="h2" sx={{ m: 0, fontFamily: MANROPE, fontWeight: 600, fontSize: { xs: 22, md: 26 }, lineHeight: "41.6px", letterSpacing: "-0.023em", color: "#0C0C0C" }}>
            Pick up where you left off
          </Box>
          <Box component="button" type="button" onClick={clear} sx={{ all: "unset", cursor: "pointer", fontFamily: MANROPE, fontWeight: 400, fontSize: 14, lineHeight: "22.4px", color: "#0C0C0C", "&:hover": { textDecoration: "underline" }, "&:focus-visible": { outline: "2px solid #0C0C0C", outlineOffset: 2 } }}>
            Clear history
          </Box>
        </Box>

        <Box sx={{ mt: "44px", display: "flex", flexWrap: "wrap", columnGap: "48px", rowGap: 4 }}>
          {items.map((t) => (
            <Box key={t.id} component={Link} href={`/tours/${t.slug}`} sx={{ display: "flex", gap: "14px", width: { xs: "100%", sm: 312 }, textDecoration: "none", color: "inherit" }}>
              <Box component="img" src={t.image} alt="" sx={{ width: 84, height: 70, mt: "10px", flexShrink: 0, objectFit: "cover", display: "block" }} />
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 17, lineHeight: "22.1px", letterSpacing: "-0.3px", color: "#0C0C0C", maxWidth: 214 }}>{t.title}</Box>
                <Box sx={{ mt: "5.8px", fontFamily: MANROPE, fontWeight: 400, fontSize: 12, lineHeight: "25.6px", color: "#6B6B6B" }}>
                  {t.days}D / {t.nights}N · <Box component="span" sx={{ fontWeight: 700 }}>₹{Number(t.price).toLocaleString("en-IN")}</Box> /person
                </Box>
                <Box sx={{ mt: "-1.6px", fontFamily: MANROPE, fontWeight: 400, fontSize: 10, lineHeight: "16px", letterSpacing: "0.5px", color: "#0C0C0C" }}>CONTINUE →</Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
