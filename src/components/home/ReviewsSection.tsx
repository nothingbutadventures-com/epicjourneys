"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";
const AVATARS = ["#0C0C0C", "#EA321E", "#4A4A4A"];

const TRUST = ["Only travellers who booked can leave a review", "Posted after the trip, and never edited by us", "Name, hometown and tour shown on every review"];

interface Review { _id: string; tourId?: string; tourTitle: string; customerName: string; rating: number; comment: string; location?: string; createdAt: string }

const initials = (n: string) => n.split(/\s+|&/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

/** First short sentence becomes the headline, the rest the body. */
function split(comment: string) {
  const m = comment.match(/^([^\n]{12,70}?[.!?])\s+([\s\S]+)$/);
  return m ? { title: m[1].replace(/[.]$/, ""), body: m[2] } : { title: "", body: comment };
}

const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <Box component="span" aria-label={`${n} out of 5`} sx={{ fontFamily: MANROPE, fontSize: size, lineHeight: 1.6, letterSpacing: "2px", whiteSpace: "nowrap" }}>
    <Box component="span" sx={{ color: "#EA321E" }}>{"★".repeat(n)}</Box>
    <Box component="span" sx={{ color: "#D0D0D0" }}>{"★".repeat(5 - n)}</Box>
  </Box>
);

function Meta({ r }: { r: Review }) {
  const from = r.location && !/^india$/i.test(r.location.trim()) ? r.location : "";
  return (
    <>
      <Box sx={{ mt: "14px", pt: "14px", borderTop: "1px solid #EDEDED", fontFamily: MANROPE, fontWeight: 500, fontSize: 13.5, lineHeight: "16.9px", color: "#4A4A4A" }}>
        {from && <><Box component="span" sx={{ fontWeight: 700, color: "#0C0C0C" }}>{from}</Box> → </>}{r.tourTitle}
      </Box>
      <Box sx={{ mt: "5px", fontFamily: MANROPE, fontWeight: 500, fontSize: 12.5, lineHeight: "15.6px", color: "#8A8A8A" }}>
        {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
      </Box>
    </>
  );
}

function Head({ r, i }: { r: Review; i: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <Box sx={{ width: 42, height: 42, borderRadius: "21px", bgcolor: AVATARS[i % 3], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 14, letterSpacing: "0.3px" }}>{initials(r.customerName)}</Box>
      <Box sx={{ flex: 1, minWidth: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 15, lineHeight: "18.8px", color: "#0C0C0C" }}>{r.customerName}</Box>
      <Stars n={r.rating} />
    </Box>
  );
}

/** "Traveller reviews": rating summary plus the published reviews. */
export default function ReviewsSection({ tours }: { tours: any[] }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => d.success && setReviews(d.data || []))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const n = reviews.length;
    const avg = n ? reviews.reduce((s, r) => s + r.rating, 0) / n : 0;
    const dist = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => r.rating === s).length);
    return { n, avg, dist };
  }, [reviews]);

  if (reviews.length === 0) return null;
  const top = reviews.slice(0, 7);
  const featured = top.find((r) => r.rating === 5) || top[0];
  const rest = top.filter((r) => r !== featured);
  const cover = tours.find((t) => (featured.tourId && t._id === featured.tourId) || t.title === featured.tourTitle)?.coverImage;
  const ft = split(featured.comment);

  return (
    <Box component="section" id="reviews" sx={{ bgcolor: "#EDEDED", pt: { xs: 8, md: "126px" }, pb: { xs: 8, md: "128px" } }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Box sx={{ width: 14, height: 14, borderRadius: "7px", bgcolor: "#EA321E", flexShrink: 0 }} />
          <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "14.4px", letterSpacing: "1.7px", color: "#0C0C0C" }}>TRAVELLER REVIEWS</Box>
        </Box>
        <Box component="h2" sx={{ m: 0, mt: "2px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 32, sm: 40, md: 46 }, lineHeight: "46.9px", letterSpacing: "-0.035em", color: "#0C0C0C" }}>
          Look who&apos;s travelling <Box component="span" sx={{ color: "#EA321E" }}>stress-free from their hometowns</Box>
        </Box>

        <Box sx={{ mt: { xs: 4, md: "61px" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 4, md: "48px" }, alignItems: "flex-start" }}>
          {/* Summary */}
          <Box sx={{ boxSizing: "border-box", width: { xs: "100%", md: 340 }, flexShrink: 0, p: "10px 29px 29px", bgcolor: "#fff", border: "1px solid #E1E1E1", borderRadius: "14px" }}>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: "13px" }}>
              <Box sx={{ fontFamily: BALOO, fontWeight: 500, fontSize: 64, lineHeight: "64px", letterSpacing: "-0.03em", color: "#0C0C0C" }}>{stats.avg.toFixed(1)}</Box>
              <Box sx={{ pb: "4px" }}>
                <Stars n={Math.floor(stats.avg)} size={20} />
                <Box sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 13, lineHeight: "16.3px", color: "#6B6B6B" }}>Average from {stats.n} {stats.n === 1 ? "review" : "reviews"}</Box>
              </Box>
            </Box>
            <Box sx={{ mt: "30px", display: "grid", rowGap: "9.5px" }}>
              {[5, 4, 3, 2, 1].map((s, i) => (
                <Box key={s} sx={{ display: "flex", alignItems: "center", gap: "13px", fontFamily: MANROPE, fontWeight: 500, fontSize: 12.5, lineHeight: "15.6px" }}>
                  <Box sx={{ width: 33, color: "#4A4A4A" }}>{s} ★</Box>
                  <Box sx={{ flex: 1, height: 6, borderRadius: "3px", bgcolor: "#EDEDED" }}>
                    <Box sx={{ height: "100%", borderRadius: "3px", bgcolor: "#0C0C0C", width: `${(stats.dist[i] / stats.n) * 100}%` }} />
                  </Box>
                  <Box sx={{ width: 10, textAlign: "right", color: "#8A8A8A" }}>{stats.dist[i]}</Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: "27px", pt: "20px", borderTop: "1px solid #E1E1E1", display: "grid", rowGap: "11px" }}>
              {TRUST.map((t) => (
                <Box key={t} sx={{ display: "flex", gap: "8px", fontFamily: MANROPE, fontWeight: 500, fontSize: 13.5, lineHeight: "19.6px", color: "#0C0C0C" }}>
                  <Box component="span" sx={{ color: "#EA321E", fontWeight: 700 }}>✓</Box>
                  <span>{t}</span>
                </Box>
              ))}
            </Box>
            <Box component={Link} href="/user/profile" sx={{ mt: "20px", height: 48, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#0C0C0C", color: "#fff", textDecoration: "none", fontFamily: MANROPE, fontWeight: 700, fontSize: 13, "&:hover": { bgcolor: "#262626" } }}>
              Travelled with us? Share your trip
            </Box>
          </Box>

          {/* Reviews */}
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, overflow: "hidden", bgcolor: "#fff", border: "1px solid #E1E1E1", borderRadius: "14px", minHeight: 328 }}>
              {cover && <Box component="img" src={cover} alt="" sx={{ width: { xs: "100%", md: "44.3%" }, height: { xs: 220, md: "auto" }, objectFit: "cover", display: "block", flexShrink: 0 }} />}
              <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2.5, md: "28px 35px 28px 30px" } }}>
                <Head r={featured} i={0} />
                {ft.title && <Box sx={{ mt: "25px", fontFamily: MANROPE, fontWeight: 700, fontSize: 22, lineHeight: "29.7px", color: "#0C0C0C" }}>“{ft.title}”</Box>}
                <Box sx={{ mt: ft.title ? "10px" : "25px", fontFamily: MANROPE, fontWeight: 400, fontSize: 16.5, lineHeight: "26.5px", color: "#4A4A4A", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ft.body}</Box>
                <Meta r={featured} />
              </Box>
            </Box>

            <Box sx={{ mt: "20px", display: "grid", gap: "20px", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "repeat(2, minmax(0,1fr))" } }}>
              {rest.map((r, i) => {
                const s = split(r.comment);
                return (
                  <Box key={r._id} sx={{ boxSizing: "border-box", p: "25px 25px 27px", bgcolor: "#fff", border: "1px solid #E1E1E1", borderRadius: "14px" }}>
                    <Head r={r} i={i + 1} />
                    {s.title && <Box sx={{ mt: "13px", fontFamily: MANROPE, fontWeight: 700, fontSize: 17, lineHeight: "23px", color: "#0C0C0C" }}>“{s.title}”</Box>}
                    <Box sx={{ mt: s.title ? "10px" : "13px", fontFamily: MANROPE, fontWeight: 400, fontSize: 15, lineHeight: "24px", color: "#4A4A4A" }}>{s.body}</Box>
                    <Meta r={r} />
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
