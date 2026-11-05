"use client";

import React from "react";
import Link from "next/link";
import { Box, Skeleton } from "@mui/material";
import { BALOO, INK } from "./ui";

const Bar = ({ w = "100%", h = 14, mt = 0, dark = false }: { w?: number | string; h?: number; mt?: number | string; dark?: boolean }) => (
  <Skeleton
    animation="wave"
    variant="rectangular"
    sx={{ width: w, maxWidth: "100%", height: h, mt, borderRadius: 0, bgcolor: dark ? "rgba(255,255,255,0.12)" : "#EDEDED", transform: "none" }}
  />
);

const Divider = () => <Box sx={{ borderTop: "1px solid #EDEDED", my: "40px" }} />;

/** Placeholder with the same layout as the tour page, shown while the tour loads. */
export default function TourSkeleton() {
  return (
    <Box sx={{ bgcolor: "#fff", color: INK }} aria-busy="true" aria-label="Loading tour">
      {/* Utility bar + hero */}
      <Box sx={{ bgcolor: INK, height: 40 }} />
      <Box sx={{ position: "relative", height: { xs: 360, md: 450 }, bgcolor: "#1B1B1B", overflow: "hidden" }}>
        <Skeleton animation="wave" variant="rectangular" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", bgcolor: "rgba(255,255,255,0.06)", transform: "none" }} />
        <Box sx={{ position: "relative", maxWidth: 1160, mx: "auto", px: { xs: 2, lg: 0 }, height: 79, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box component={Link} href="/" aria-label="EpicJourneys home" sx={{ textDecoration: "none", fontFamily: BALOO, fontWeight: 700, fontSize: 32, lineHeight: "51px", letterSpacing: "-0.32px", color: "#fff" }}>
            epic <Box component="span" sx={{ color: "#FF5A45" }}>journeys</Box>
            <Box component="span" sx={{ fontWeight: 600, fontSize: 20, color: "rgba(255,255,255,0.5)" }}>.in</Box>
          </Box>
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: "24px" }}>
            <Bar w={110} h={16} dark />
            <Bar w={90} h={16} dark />
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1160, mx: "auto", px: { xs: 2, lg: 0 }, display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "716px 380px" }, columnGap: "64px", alignItems: "start" }}>
        <Box sx={{ minWidth: 0, pb: "72px" }}>
          {/* Title block */}
          <Box sx={{ pt: "40px", pb: "24px" }}>
            <Bar w={260} h={14} />
            <Bar w="92%" h={48} mt="20px" />
            <Bar w="60%" h={48} mt="10px" />
            <Bar w="85%" h={16} mt="24px" />
            <Bar w="70%" h={16} mt="10px" />
            <Box sx={{ display: "flex", gap: "12px", mt: "24px" }}>
              <Bar w={140} h={16} />
              <Bar w={160} h={16} />
            </Box>
          </Box>

          {/* Section tabs */}
          <Box sx={{ display: "flex", gap: "28px", py: "16px", borderTop: "1px solid #EDEDED", borderBottom: "1px solid #EDEDED", overflow: "hidden" }}>
            {[90, 80, 90, 80, 100, 50].map((w, i) => <Bar key={i} w={w} h={16} />)}
          </Box>

          {/* Overview */}
          <Box sx={{ pt: "40px" }}>
            <Bar w={180} h={30} />
            <Bar h={16} mt="24px" />
            <Bar h={16} mt="10px" />
            <Bar w="90%" h={16} mt="10px" />
            <Bar w="75%" h={16} mt="10px" />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: "16px", mt: "32px" }}>
              {[0, 1, 2, 3].map((i) => <Bar key={i} h={64} />)}
            </Box>
          </Box>
          <Divider />

          {/* Photos */}
          <Bar w={200} h={30} />
          <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gridTemplateRows: "150px 150px", gap: "8px", mt: "24px" }}>
            <Skeleton animation="wave" variant="rectangular" sx={{ gridRow: "span 2", height: "100%", borderRadius: 0, bgcolor: "#EDEDED", transform: "none" }} />
            <Bar h={150} />
            <Bar h={150} />
          </Box>
          <Divider />

          {/* Dates & prices */}
          <Bar w={220} h={30} />
          <Bar w="50%" h={16} mt="16px" />
          <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", mt: "24px" }}>
            {[0, 1, 2].map((i) => <Bar key={i} h={72} />)}
          </Box>
          <Divider />

          {/* Itinerary */}
          <Bar w={200} h={30} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: "16px", mt: "24px" }}>
            {[0, 1, 2].map((i) => <Bar key={i} h={56} />)}
          </Box>
        </Box>

        {/* Booking aside */}
        <Box sx={{ pt: { lg: "40px" }, pb: { xs: 6, lg: 0 }, minWidth: 0, alignSelf: "stretch" }}>
          <Box sx={{ border: "1px solid #EDEDED", p: "24px" }}>
            <Bar w={120} h={14} />
            <Bar w={170} h={40} mt="12px" />
            <Bar h={48} mt="24px" />
            <Bar h={48} mt="12px" />
            <Bar h={52} mt="24px" />
            <Bar w="80%" h={12} mt="16px" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
