import React from "react";
import Image from "next/image";
import { Box } from "@mui/material";

const MANROPE = "var(--font-manrope), Manrope, sans-serif";
const BALOO = "var(--font-baloo), 'Baloo 2', sans-serif";

// Voice-note waveform: bar heights, the first nine are "played".
const WAVE = [6, 24, 11, 23, 15, 20, 19, 17, 21, 13, 23, 9, 24, 8, 23, 12, 22, 17, 19, 20, 16, 22, 11, 24, 7, 24, 10, 23];

const card = { boxSizing: "border-box", bgcolor: "#fff", border: "1px solid #E1E1E1", borderRadius: "14px" } as const;
const quote = { fontFamily: MANROPE, fontWeight: 500, fontSize: 16, lineHeight: "24.8px", color: "#0C0C0C" } as const;

function Who({ name, rest, light }: { name: string; rest: string; light?: boolean }) {
  return (
    <Box sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 13, lineHeight: "16.3px", color: light ? "#fff" : "#6B6B6B" }}>
      <Box component="span" sx={{ fontWeight: 700, color: light ? "#fff" : "#0C0C0C" }}>{name}</Box> · {rest}
    </Box>
  );
}

function Bubble({ mine, who, text, time }: { mine?: boolean; who?: string; text: string; time: string }) {
  return (
    <Box sx={{ position: "relative", boxSizing: "border-box", width: 322, maxWidth: "calc(100% - 28px)", ml: mine ? "auto" : 0, p: "8px 12px", borderRadius: "12px", bgcolor: mine ? "#FDEAE7" : "#fff", minHeight: mine ? 67 : 64 }}>
      {who && <Box sx={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 11.5, lineHeight: "14.4px", color: "#C4260F", mb: "4px" }}>{who}</Box>}
      <Box sx={{ fontFamily: MANROPE, fontWeight: 500, fontSize: 14.5, lineHeight: "20.3px", color: "#0C0C0C", pb: "14px" }}>{text}</Box>
      <Box sx={{ position: "absolute", right: mine ? 11 : 9, bottom: 4.5, fontFamily: MANROPE, fontWeight: 500, fontSize: 10, lineHeight: "12.5px", color: "#8A8A8A" }}>{time}</Box>
    </Box>
  );
}

/** "Heard at home": sample traveller stories. The design marks them as samples until real posts are added. */
export default function WhySection() {
  return (
    <Box component="section" id="why" sx={{ bgcolor: "#fff", pt: "64px", pb: "65px" }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: "60px" }, textAlign: "center" }}>
        <Box component="img" src="/images/home/why-bus.svg" alt="" width={84} height={34} sx={{ display: "block", mx: "auto", opacity: 0.55 }} />
        <Box sx={{ mt: "10px", display: "inline-flex", alignItems: "center", gap: "11px" }}>
          <Box sx={{ width: 14, height: 14, borderRadius: "7px", bgcolor: "#EA321E" }} />
          <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "14.4px", letterSpacing: "1.7px", color: "#0C0C0C" }}>HEARD AT HOME</Box>
        </Box>
        <Box component="h2" sx={{ m: 0, mt: "3.6px", fontFamily: BALOO, fontWeight: 500, fontSize: { xs: 30, sm: 40, md: 51.8 }, lineHeight: 1.021, letterSpacing: "-0.0347em" }}>
          <Box component="span" sx={{ display: "block", color: "#8A8A8A" }}>“Delhi tak jaana padega?”</Box>
          <Box component="span" sx={{ display: "block", color: "#0C0C0C" }}>
            “Nahi, Maa. Bus <Box component="span" sx={{ color: "#EA321E" }}>Bareilly</Box> se hi niklegi.”
          </Box>
        </Box>
        <Box sx={{ mt: "36px", mx: "auto", maxWidth: 560, fontFamily: MANROPE, fontWeight: 500, fontSize: 17, lineHeight: "27.2px", color: "#4A4A4A" }}>
          Every tour starts at a LocalStart Lounge in your own town. In Bareilly, that’s Ram Ganga Holidays, so the holiday begins with chai, not a 4 am bus.
        </Box>

        <Box sx={{ mt: "50px", textAlign: "left", display: "grid", gap: "17px", gridTemplateColumns: { xs: "1fr", md: "427fr 432fr 427fr" }, alignItems: "start" }}>
          {/* Left: family chat + price review */}
          <Box sx={{ mt: { md: "31px" }, display: "flex", flexDirection: "column", gap: "18px" }}>
            <Box sx={{ ...card, bgcolor: "#F5F5F5", overflow: "hidden", minHeight: 369, pb: "16px" }}>
              <Box sx={{ height: 50, bgcolor: "#0C0C0C", color: "#fff", px: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: MANROPE }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <Box component="span" sx={{ opacity: 0.7, fontSize: 16 }}>←</Box>
                  <Box component="span" sx={{ fontWeight: 700, fontSize: 14 }}>Ghar 🏠</Box>
                </Box>
                <Box component="span" sx={{ opacity: 0.6, fontWeight: 500, fontSize: 11 }}>Maa, Papa, Didi, You</Box>
              </Box>
              <Box sx={{ mt: "16px", px: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <Bubble who="Maa" text="Bus kitne baje hai?" time="9:41" />
                <Bubble mine text="8 baje, yahin Bareilly wale lounge se. Ghar se 10 min." time="9:42 ✓✓" />
                <Bubble who="Maa" text="Papa ki dawai wala bag kaun uthayega?" time="9:42" />
                <Bubble mine text="Coordinator hai Maa, saara saman woh bus mein rakhwa denge 😄" time="9:43 ✓✓" />
              </Box>
            </Box>
            <Box sx={{ ...card, p: "21px 8px 24px 20px" }}>
              <Box sx={{ fontFamily: MANROPE, fontSize: 15, lineHeight: "24px", letterSpacing: "2px", color: "#EA321E" }}>★★★★★</Box>
              <Box sx={{ ...quote, mt: "8px", maxWidth: 390 }}>“₹11,700 bola tha, ₹11,700 hi laga. Na pickup ka extra, na hotel ka.”</Box>
              <Box sx={{ mt: "10.4px" }}><Who name="Rakesh" rest="Dehradun" /></Box>
              <Box sx={{ mt: "3.7px", fontFamily: MANROPE, fontWeight: 500, fontSize: 12, lineHeight: "15px", color: "#8A8A8A" }}>Udaipur · 3D / 2N</Box>
            </Box>
          </Box>

          {/* Centre: photo story */}
          <Box sx={{ position: "relative", overflow: "hidden", borderRadius: "14px", bgcolor: "#0C0C0C", height: { xs: 480, md: 576 }, display: "flex", flexDirection: "column", justifyContent: "flex-end", p: "0 18px 23px 21px", color: "#fff" }}>
            <Image src="/images/home/cat-haridwar.jpg" alt="" fill quality={80} sizes="(min-width: 900px) 33vw, 100vw" style={{ objectFit: "cover" }} />
            <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,12,12,0) 50%, rgba(12,12,12,0.8) 100%)" }} />
            <Box sx={{ position: "relative" }}>
              <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 16, lineHeight: "22.4px", maxWidth: 369 }}>Mummy-Papa ki pehli group trip. Ghar ke paas se boarding, aur shaam ko Ganga pe naav 🙏</Box>
              <Box sx={{ mt: "10px" }}><Who name="Ritika" rest="Moradabad" light /></Box>
              <Box sx={{ mt: "3.7px", display: "flex", justifyContent: "space-between", fontFamily: MANROPE, fontWeight: 500, fontSize: 12, lineHeight: "15px" }}>
                <Box component="span" sx={{ color: "rgba(255,255,255,0.75)" }}>Haridwar &amp; the Ganges · 8D / 8N</Box>
                <Box component="span" sx={{ fontWeight: 700 }}>❤️ 2,184</Box>
              </Box>
            </Box>
          </Box>

          {/* Right: voice note + women's group review */}
          <Box sx={{ mt: { md: "59px" }, display: "flex", flexDirection: "column", gap: "18px" }}>
            <Box sx={{ ...card, p: "19px 19px 20px" }}>
              <Box sx={{ height: 54, borderRadius: "27px", bgcolor: "#F5F5F5", display: "flex", alignItems: "center", px: "14px", gap: "12px" }}>
                <Box sx={{ width: 34, height: 34, borderRadius: "17px", bgcolor: "#EA321E", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>▶</Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: "3px", flex: 1, minWidth: 0, overflow: "hidden" }} aria-hidden="true">
                  {WAVE.map((h, i) => (
                    <Box key={i} sx={{ width: 3, height: h, borderRadius: "1.5px", flexShrink: 0, bgcolor: i < 9 ? "#EA321E" : "#0C0C0C", opacity: i < 9 ? 1 : 0.55 }} />
                  ))}
                </Box>
                <Box sx={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, lineHeight: "15px", color: "#6B6B6B" }}>0:24</Box>
              </Box>
              <Box sx={{ ...quote, mt: "15px" }}>“Bus mein AC tha, seat aage wali mili. Is baar ghutno ka dard bhi nahi hua.”</Box>
              <Box sx={{ mt: "10.4px" }}><Who name="Papa’s voice note" rest="Jhansi" /></Box>
            </Box>
            <Box sx={{ ...card, p: "19px 20px 25px" }}>
              <Box sx={quote}>Akeli jaane ka darr tha. Group mein 9 aur ladkiyan thi, coordinator ne sabko naam se bulaya. Next trip already booked.</Box>
              <Box sx={{ mt: "10.4px" }}><Who name="Neha" rest="Lucknow" /></Box>
              <Box sx={{ mt: "3.7px", fontFamily: MANROPE, fontWeight: 500, fontSize: 12, lineHeight: "15px", color: "#8A8A8A" }}>Women&apos;s group · Manali</Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: "4px", textAlign: "center", fontFamily: MANROPE, fontWeight: 500, fontSize: 12, lineHeight: "15px", color: "#8A8A8A" }}>
          Sample stories, shown until real traveller posts are added with their permission.
        </Box>
      </Box>
    </Box>
  );
}
