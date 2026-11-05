"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FOOD_PLANS, DEFAULT_FOOD_PLAN } from "@/lib/food-plans";
import { Box } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AirlineSeatReclineNormalOutlinedIcon from "@mui/icons-material/AirlineSeatReclineNormalOutlined";
import DirectionsBusOutlinedIcon from "@mui/icons-material/DirectionsBusOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import AccessibleOutlinedIcon from "@mui/icons-material/AccessibleOutlined";
import { MANROPE, BALOO, INK, MUTED, RED, LINE, SectionHead, Rule } from "./ui";

const body14 = { fontFamily: MANROPE, fontWeight: 500, fontSize: 14, lineHeight: "20px" } as const;

/* ───────── Title block ───────── */
export function TitleBlock({ tour, city, rating }: { tour: any; city: string; rating: { avg: number; n: number } }) {
  const places = [tour.targetCity, tour.state].filter(Boolean).join(" · ");
  return (
    <Box sx={{ pt: "40px", pb: "24px" }}>
      <Box sx={{ ...body14, fontSize: 13, color: MUTED }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Home</Link> &nbsp;/&nbsp;{" "}
        <Link href={`/tours?state=${encodeURIComponent(tour.state || "")}`} style={{ color: "inherit", textDecoration: "none" }}>{tour.state}</Link> &nbsp;/&nbsp;{" "}
        <Box component="span" sx={{ color: INK, fontWeight: 700 }}>{tour.title}</Box>
      </Box>
      <Box component="h1" sx={{ m: 0, mt: "16px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 36, md: 52 }, lineHeight: { xs: "40px", md: "56px" }, letterSpacing: "-0.035em", color: INK }}>
        {tour.title}, starting from <Box component="span" sx={{ color: RED }}>{city}</Box>
      </Box>
      {(tour.shortDescription || tour.description) && (
        <Box sx={{ mt: "20px", maxWidth: 680, fontFamily: MANROPE, fontWeight: 500, fontSize: 18, lineHeight: "29px", color: MUTED, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {tour.shortDescription || tour.description}
        </Box>
      )}
      <Box sx={{ mt: "20px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        {rating.n > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", ...body14 }}>
            <Box component="span" sx={{ color: "#FF7700", letterSpacing: "1px" }}>{"★".repeat(Math.round(rating.avg))}{"☆".repeat(5 - Math.round(rating.avg))}</Box>
            <Box component="span" sx={{ fontWeight: 700 }}>{rating.avg.toFixed(1)}</Box>
            <Box component="span" sx={{ color: MUTED }}>· {rating.n} {rating.n === 1 ? "review" : "reviews"}</Box>
          </Box>
        )}
        {places && <Box sx={{ ...body14, color: MUTED }}>{places}</Box>}
      </Box>
    </Box>
  );
}

/* ───────── Sticky section bar ───────── */
export function SectionBar({ tabs }: { tabs: { id: string; label: string }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  useEffect(() => {
    const onScroll = () => {
      let cur = tabs[0]?.id;
      for (const t of tabs) {
        const el = document.getElementById(t.id);
        if (el && el.getBoundingClientRect().top < 120) cur = t.id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [tabs]);
  return (
    <Box component="nav" aria-label="Sections" sx={{ position: "sticky", top: 0, zIndex: 40, bgcolor: "#fff", borderBottom: `1px solid ${LINE}`, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
      <Box sx={{ display: "flex", gap: "28px", height: 54, alignItems: "stretch", minWidth: "max-content" }}>
        {tabs.map((t) => (
          <Box key={t.id} component="a" href={`#${t.id}`} sx={{ display: "flex", alignItems: "center", textDecoration: "none", fontFamily: MANROPE, fontSize: 14, lineHeight: "20px", fontWeight: active === t.id ? 700 : 500, color: active === t.id ? INK : MUTED, borderBottom: `2px solid ${active === t.id ? RED : "transparent"}`, mb: "-1px", "&:hover": { color: INK } }}>
            {t.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ───────── Overview ───────── */
export function Overview({ tour, city, partner, days, nights }: { tour: any; city: string; partner: string; days: number; nights: number }) {
  const meals = [...new Set<string>((tour.itinerary || []).map((d: any) => d.meals).filter(Boolean))];
  const pace = String(tour.physicalRating || "").replace(/^\d+\s*-\s*/, "");
  const facts = [
    { icon: <PlaceOutlinedIcon />, a: `${nights} Nights / ${days} Days`, b: [tour.targetCity, tour.state].filter(Boolean).join(" · ") },
    { icon: <DirectionsBusOutlinedIcon />, a: `Roundtrip from ${city}`, b: partner || "Your LocalStart Lounge" },
    { icon: <WorkspacePremiumOutlinedIcon />, a: pace ? `${pace} pace` : "Easy pace", b: (tour.travelStyles || []).join(" · ") || "Planned for comfort" },
    { icon: <RestaurantOutlinedIcon />, a: "Meals", b: meals.length ? meals.slice(0, 2).join(" · ") : "As per itinerary" },
  ];
  return (
    <Box id="overview" sx={{ pt: "24px" }}>
      <Box sx={{ border: `1px solid ${LINE}`, bgcolor: "#fff", display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
        {facts.map((f) => (
          <Box key={f.a} sx={{ p: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <Box sx={{ color: INK, "& svg": { fontSize: 28 }, flexShrink: 0 }}>{f.icon}</Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ ...body14, fontWeight: 700, fontSize: 13.5, lineHeight: "18px" }}>{f.a}</Box>
              <Box sx={{ ...body14, fontSize: 13.5, lineHeight: "18px", color: MUTED }}>{f.b}</Box>
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: "24px", fontFamily: MANROPE, fontWeight: 500, fontSize: 18, lineHeight: "29px", color: INK, whiteSpace: "pre-line" }}>{tour.description}</Box>
      {(tour.highlights || []).length > 0 && (
        <Box component="ul" sx={{ m: 0, mt: "24px", p: 0, listStyle: "none", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: "40px", rowGap: "14px" }}>
          {tour.highlights.map((h: string) => (
            <Box component="li" key={h} sx={{ display: "flex", gap: "14px", ...body14, fontSize: 15, lineHeight: "22px" }}>
              <Box component="span" sx={{ width: 7, height: 7, bgcolor: RED, flexShrink: 0, mt: "8px" }} />
              {h}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/* ───────── Photos & videos ───────── */
export function Photos({ tour, city }: { tour: any; city: string }) {
  const images: string[] = [...new Set<string>([tour.coverImage, ...(tour.images || [])].filter(Boolean))];
  const [i, setI] = useState(0);
  const slots = ["Hotel rooms", "The coach", "Meals", `Lounge in ${city}`];
  return (
    <Box>
      <SectionHead id="photos" eyebrow="Photos & videos" title="See it" red="before you go" />
      <Box sx={{ mt: "24px", position: "relative", height: { xs: 260, md: 420 }, borderRadius: "14px", overflow: "hidden", bgcolor: LINE }}>
        <Box component="img" src={images[i]} alt={tour.title} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </Box>
      {images.length > 1 && (
        <Box sx={{ mt: "12px", display: "flex", gap: "10px", overflowX: "auto" }}>
          {images.map((src, k) => (
            <Box key={src} component="button" type="button" aria-label={`Photo ${k + 1}`} onClick={() => setI(k)} sx={{ all: "unset", cursor: "pointer", flexShrink: 0, width: 96, height: 64, borderRadius: "8px", overflow: "hidden", outline: k === i ? `2px solid ${RED}` : "none", outlineOffset: 2 }}>
              <Box component="img" src={src} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          ))}
        </Box>
      )}
      <Box sx={{ mt: "14px", ...body14, fontSize: 13, color: MUTED }}>{tour.title}{tour.targetCity ? ` · ${tour.targetCity}` : ""}</Box>
      <Box component="h3" sx={{ m: 0, mt: "32px", fontFamily: MANROPE, fontWeight: 800, fontSize: 18, lineHeight: "26px", color: INK }}>Where you&apos;ll stay, ride and eat</Box>
      <Box sx={{ mt: "16px", display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: "12px" }}>
        {slots.map((s, k) => (
          <Box key={s} sx={{ boxSizing: "border-box", minHeight: 108, p: "14px", border: "1.5px dashed #BDBDBD", borderRadius: "12px" }}>
            <Box sx={{ color: INK, mb: "20px", "& svg": { fontSize: 22 } }}>{[<HomeOutlinedIcon key="h" />, <DirectionsBusOutlinedIcon key="b" />, <RestaurantOutlinedIcon key="r" />, <AirlineSeatReclineNormalOutlinedIcon key="l" />][k]}</Box>
            <Box sx={{ ...body14, fontWeight: 700 }}>{s}</Box>
            <Box sx={{ ...body14, fontSize: 13, lineHeight: "18px", color: MUTED }}>Photos from our partners coming soon</Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: "16px", ...body14, fontSize: 13, color: MUTED }}>Photos of the places on this tour. Traveller photos from our own groups will be added after each departure.</Box>
    </Box>
  );
}

/* ───────── Getting there ───────── */
export function GettingThere({ city, partner, place }: { city: string; partner: string; place: string }) {
  const steps = [
    { icon: <AirlineSeatReclineNormalOutlinedIcon />, t: "Pickup", h: `LocalStart Lounge, ${city}`, d: `Tea and check-in${partner ? ` at ${partner}` : ""}. Your coordinator weighs bags and hands over the trip kit.` },
    { icon: <DirectionsBusOutlinedIcon />, t: "On the road", h: "AC feeder coach", d: "Pushback seats, a washroom stop every 90 minutes and breakfast on the way. Live location shared with family." },
    { icon: <GroupsOutlinedIcon />, t: "Group meet", h: "Meet the main group", d: "Your tour captain meets you at the gate and handles check-in for the whole group." },
    { icon: <NearMeOutlinedIcon />, t: "Onward", h: `On to ${place}`, d: "The group coach takes it from here. No platform changes, no metro hotel nights." },
  ];
  return (
    <Box>
      <SectionHead id="getting-there" eyebrow="How you reach the group" title="From your street" red="to the main group" sub="The part other operators leave to you: we cover all of it." />
      <Box sx={{ mt: "28px", display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: "24px 20px" }}>
        {steps.map((s, i) => (
          <Box key={s.t}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", color: INK, "& svg": { fontSize: 32 } }}>
              {s.icon}
              {i < 3 && <Box sx={{ display: { xs: "none", md: "block" }, flex: 1, borderTop: `1.5px dashed ${RED}` }} />}
            </Box>
            <Box sx={{ mt: "16px", ...body14, fontWeight: 700, fontSize: 13, color: RED }}>{s.t}</Box>
            <Box sx={{ mt: "6px", ...body14, fontWeight: 800, fontSize: 15, lineHeight: "21px" }}>{s.h}</Box>
            <Box sx={{ mt: "6px", ...body14, fontSize: 13.5, lineHeight: "20px" }}>{s.d}</Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ───────── Day by day ───────── */
export function Itinerary({ days }: { days: any[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const stays = new Map<string, number>();
  for (const d of days) if (d.stay) stays.set(d.stay, (stays.get(d.stay) || 0) + 1);
  return (
    <Box>
      <SectionHead id="itinerary" eyebrow="Day by day" title="What each day" red="looks like" />
      <Box sx={{ mt: "24px", borderTop: `1px solid ${INK}` }}>
        {days.map((d, i) => {
          const on = open === i;
          return (
            <Box key={i} sx={{ borderBottom: `1px solid ${LINE}` }}>
              <Box component="button" type="button" aria-expanded={on} onClick={() => setOpen(on ? null : i)} sx={{ all: "unset", boxSizing: "border-box", width: "100%", minHeight: 99, display: "flex", alignItems: "center", gap: "28px", cursor: "pointer", "&:focus-visible": { outline: `2px solid ${RED}`, outlineOffset: -2 } }}>
                <Box sx={{ width: 60, flexShrink: 0, ...body14, fontWeight: 700, color: RED }}>Day {d.day ?? i + 1}</Box>
                <Box sx={{ flex: 1, minWidth: 0, fontFamily: BALOO, fontWeight: 500, fontSize: 24, lineHeight: "30px", letterSpacing: "-0.02em", color: INK }}>{d.title}</Box>
                <Box component="span" aria-hidden="true" sx={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 20 }}>{on ? "–" : "+"}</Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateRows: on ? "1fr" : "0fr", transition: "grid-template-rows .25s ease" }}>
                <Box sx={{ overflow: "hidden" }}>
                  <Box sx={{ pl: { md: "88px" }, pb: "28px" }}>
                    <Box sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 16, lineHeight: "24px", color: INK, whiteSpace: "pre-line" }}>{d.description}</Box>
                    {(d.stay || d.meals) && (
                      <Box sx={{ mt: "20px", display: "flex", flexWrap: "wrap", gap: "12px 48px" }}>
                        {d.stay && <Box><Box sx={{ ...body14, fontSize: 13, color: MUTED }}>Stay</Box><Box sx={{ ...body14, fontWeight: 700 }}>{d.stay}</Box></Box>}
                        {d.meals && <Box><Box sx={{ ...body14, fontSize: 13, color: MUTED }}>Meals</Box><Box sx={{ ...body14, fontWeight: 700 }}>{d.meals}</Box></Box>}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
      {stays.size > 0 && (
        <Box sx={{ mt: "16px", display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: "8px", alignItems: "start" }}>
          {[...stays.entries()].slice(0, 4).map(([name, n]) => (
            <Box key={name} sx={{ bgcolor: "#EDEDED", p: "12px" }}>
              <Box sx={{ ...body14, fontWeight: 700, fontSize: 13.5 }}>{name}</Box>
              <Box sx={{ ...body14, fontSize: 13.5, color: MUTED }}>{n} {n === 1 ? "night" : "nights"}</Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/* ───────── What's included ───────── */
export function Included({ price, city, inc, exc }: { price: number; city: string; inc: string[]; exc: string[] }) {
  return (
    <Box>
      <SectionHead id="included" eyebrow="Zero hidden costs" title={`₹${Math.round(price).toLocaleString("en-IN")} is`} red="the whole price" sub={`From the moment you leave home in ${city} to the moment you are back.`} />
      <Box sx={{ mt: "24px", border: `1px solid ${INK}`, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 204px" }, alignItems: "stretch" }}>
        <Box sx={{ p: "20px" }}>
          <Box sx={{ fontFamily: BALOO, fontWeight: 500, fontSize: 24, lineHeight: "30px", mb: "16px" }}>Already paid for</Box>
          {inc.length ? inc.map((t) => <Box key={t} sx={{ ...body14, fontWeight: 700, fontSize: 15, lineHeight: "22px", mb: "14px" }}>{t}</Box>) : <Box sx={{ ...body14, color: MUTED }}>Details are listed on the itinerary.</Box>}
        </Box>
        <Box sx={{ bgcolor: "#EDEDED", p: "20px" }}>
          <Box sx={{ fontFamily: BALOO, fontWeight: 500, fontSize: 24, lineHeight: "30px", mb: "16px" }}>Not included</Box>
          {exc.length ? exc.map((t) => <Box key={t} sx={{ ...body14, fontSize: 15, lineHeight: "22px", mb: "14px" }}>{t}</Box>) : <Box sx={{ ...body14, color: MUTED }}>Personal expenses and anything not listed.</Box>}
        </Box>
      </Box>
    </Box>
  );
}

/* ───────── Safety & comfort ───────── */
export function Safety({ place }: { place: string }) {
  const items = [
    { icon: <ScheduleOutlinedIcon />, t: "Senior citizen pace", d: "Washroom stop every 90 minutes on the road, late starts, and no more than one climb a day." },
    { icon: <PlaceOutlinedIcon />, t: "Live GPS for women's groups", d: "Families get a live location link for the coach and the coordinator's number before you leave home." },
    { icon: <MedicationOutlinedIcon />, t: "Medicine timings respected", d: "Tell us your schedule once. Meals and stops are planned around it, and a first-aid kit travels with the group." },
    { icon: <VerifiedUserOutlinedIcon />, t: "One coordinator, start to finish", d: `The same person from your lounge to ${place} and back, reachable on WhatsApp all day.` },
  ];
  return (
    <Box>
      <SectionHead id="safety" eyebrow="Safety & comfort" title="Planned around" red="you and your parents" />
      <Box sx={{ mt: "24px", display: "grid", gridTemplateColumns: { xs: "1fr", md: "218px 1fr" }, gap: "24px", alignItems: "start" }}>
        <Box sx={{ bgcolor: INK, color: "#fff", p: "24px 20px" }}>
          <Box sx={{ ...body14, color: "rgba(255,255,255,0.7)" }}>Your coordinator</Box>
          <Box sx={{ mt: "6px", fontFamily: BALOO, fontWeight: 500, fontSize: 24, lineHeight: "30px" }}>Someone you can call</Box>
          <Box sx={{ mt: "16px", fontFamily: MANROPE, fontWeight: 600, fontSize: 18, lineHeight: "27px" }}>“Medicine timings, food and pace: tell us once and we plan around it.”</Box>
        </Box>
        <Box>
          <Box sx={{ bgcolor: "#EDEDED", p: "16px", display: "flex", gap: "14px", ...body14, fontSize: 15, lineHeight: "22px" }}>
            <AccessibleOutlinedIcon sx={{ fontSize: 28, flexShrink: 0 }} />
            Wheelchair users: tell us when you book. Hotels on our routes have lifts or ground-floor rooms.
          </Box>
          <Box sx={{ mt: "24px", display: "grid", rowGap: "22px" }}>
            {items.map((it) => (
              <Box key={it.t} sx={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <Box sx={{ "& svg": { fontSize: 28 }, flexShrink: 0 }}>{it.icon}</Box>
                <Box>
                  <Box sx={{ ...body14, fontWeight: 800, fontSize: 15, lineHeight: "22px" }}>{it.t}</Box>
                  <Box sx={{ ...body14, fontSize: 14, lineHeight: "20px" }}>{it.d}</Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ───────── Food ───────── */
export function Food({ plan }: { plan?: string }) {
  const selected = FOOD_PLANS.some((p) => p.id === plan) ? plan : DEFAULT_FOOD_PLAN;
  const cards = FOOD_PLANS.map((p) => ({ t: p.title, d: p.description, on: p.id === selected }));
  return (
    <Box>
      <SectionHead id="food" eyebrow="Food planner" title="Food that tastes" red="like home" sub="Tell us once when you book. Every kitchen on the route gets your list before you arrive." />
      <Box sx={{ mt: "24px", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: "8px" }}>
        {cards.map((c) => (
          <Box key={c.t} sx={{ boxSizing: "border-box", p: "16px", minHeight: 108, border: c.on ? `2px solid ${INK}` : `1px solid ${LINE}`, bgcolor: "#fff" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", ...body14, fontWeight: 800, fontSize: 15 }}>
              {c.on && <Box component="span" sx={{ width: 7, height: 7, bgcolor: RED }} />}
              {c.t}
            </Box>
            <Box sx={{ mt: "8px", ...body14, fontSize: 14, lineHeight: "20px" }}>{c.d}</Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ───────── Reviews ───────── */
export function Reviews({ reviews, city }: { reviews: any[]; city: string }) {
  return (
    <Box>
      <SectionHead id="reviews" eyebrow="Reviews" title="Travellers" red={`near ${city}`} />
      <Box sx={{ mt: "24px", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: "20px", alignItems: "start" }}>
        {reviews.slice(0, 4).map((r) => {
          const m = String(r.comment).match(/^([^\n]{12,60}?[.!?])\s+([\s\S]+)$/);
          const title = m ? m[1].replace(/[.]$/, "") : "";
          const text = m ? m[2] : r.comment;
          const from = r.location && !/^india$/i.test(r.location.trim()) ? r.location : "";
          return (
            <Box key={r._id} sx={{ boxSizing: "border-box", p: "16px", border: `1px solid ${LINE}`, borderRadius: "14px", bgcolor: "#fff" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "18px", bgcolor: "#EDEDED", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MANROPE, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {String(r.customerName).split(/\s+/).slice(0, 2).map((x: string) => x[0]).join("").toUpperCase()}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ ...body14, fontWeight: 700, fontSize: 13 }}>{r.customerName}</Box>
                  {from && <Box sx={{ ...body14, fontSize: 13, color: MUTED }}>{from}</Box>}
                </Box>
                <Box sx={{ color: "#FF7700", fontSize: 13, letterSpacing: "1px", whiteSpace: "nowrap" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</Box>
              </Box>
              {title && <Box sx={{ mt: "14px", fontFamily: BALOO, fontWeight: 500, fontSize: 24, lineHeight: "32px", letterSpacing: "-0.02em" }}>“{title}”</Box>}
              <Box sx={{ mt: "8px", fontFamily: MANROPE, fontWeight: 500, fontSize: 15, lineHeight: "24px", color: INK }}>{text}</Box>
              <Box sx={{ mt: "10px", ...body14, fontSize: 13, color: MUTED }}>{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/* ───────── FAQs ───────── */
const FAQS = [
  { q: "Is the trip comfortable for seniors?", a: "Yes. Groups travel at a relaxed pace with a washroom stop every 90 minutes, late starts and no more than one climb a day. Tell us about any needs when you book." },
  { q: "What is included in the price?", a: "The price is per person and shown after any discount. The “What’s included” section above lists exactly what is covered and what is not." },
  { q: "How do I book?", a: "Pick a departure, choose how many travellers, and continue to checkout. You can reserve seats with a small deposit and pay the rest in instalments before departure." },
  { q: "What if I have to cancel?", a: "You can request a cancellation from your booking. Our team reviews it and gets back to you, and the refund follows the terms for your tour." },
];
export function Faqs({ faqs }: { faqs?: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  // Custom FAQs from the admin replace the standard ones entirely.
  const list = faqs && faqs.length ? faqs.map((x) => ({ q: x.question, a: x.answer })) : FAQS;
  return (
    <Box>
      <SectionHead id="faqs" eyebrow="Questions" title="Before" red="you book" />
      <Box sx={{ mt: "24px", borderTop: `1px solid ${INK}` }}>
        {list.map((f, i) => {
          const on = open === i;
          return (
            <Box key={`${i}-${f.q}`} sx={{ borderBottom: `1px solid ${LINE}` }}>
              <Box component="button" type="button" aria-expanded={on} onClick={() => setOpen(on ? null : i)} sx={{ all: "unset", boxSizing: "border-box", width: "100%", minHeight: 48, py: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, cursor: "pointer", fontFamily: MANROPE, fontWeight: 800, fontSize: 16, lineHeight: "24px", "&:focus-visible": { outline: `2px solid ${RED}`, outlineOffset: -2 } }}>
                <span>{f.q}</span>
                <Box component="span" aria-hidden="true" sx={{ fontWeight: 700, fontSize: 20 }}>{on ? "–" : "+"}</Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateRows: on ? "1fr" : "0fr", transition: "grid-template-rows .25s ease" }}>
                <Box sx={{ overflow: "hidden" }}><Box sx={{ pb: "16px", fontFamily: MANROPE, fontWeight: 500, fontSize: 16, lineHeight: "24px", color: INK }}>{f.a}</Box></Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export { Rule };
