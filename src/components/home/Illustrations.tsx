"use client";

import React from "react";
import { motion } from "framer-motion";

/** Layered mountain landscape with sun, drifting clouds and birds. */
export function MountainScene({ height = 220 }: { height?: number }) {
  return (
    <svg viewBox="0 0 800 220" preserveAspectRatio="xMidYMax slice" width="100%" height={height} aria-hidden>
      <defs>
        <linearGradient id="ms-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fff7d6" />
        </linearGradient>
      </defs>
      <rect width="800" height="220" fill="url(#ms-sky)" />
      <motion.circle
        cx="620"
        cy="70"
        r="34"
        fill="#facc15"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "620px 70px" }}
      />
      <motion.g animate={{ x: [0, 40, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="150" cy="60" rx="46" ry="12" fill="#fff" opacity=".9" />
        <ellipse cx="180" cy="50" rx="30" ry="12" fill="#fff" opacity=".9" />
      </motion.g>
      <motion.g animate={{ x: [0, -50, 0] }} transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="420" cy="90" rx="40" ry="10" fill="#fff" opacity=".8" />
        <ellipse cx="445" cy="82" rx="26" ry="10" fill="#fff" opacity=".8" />
      </motion.g>
      <path d="M0 170 L110 80 L190 140 L290 50 L400 150 L500 90 L610 160 L720 70 L800 130 V220 H0Z" fill="#94a3b8" opacity=".55" />
      <path d="M0 190 L90 120 L170 170 L270 100 L380 180 L480 120 L590 185 L700 110 L800 170 V220 H0Z" fill="#475569" />
      <path d="M290 50 L270 78 L284 72 L296 86 L306 70 L318 76Z" fill="#fff" opacity=".9" transform="translate(-20 22)" />
      <path d="M0 205 Q200 180 400 200 T800 195 V220 H0Z" fill="#0f172a" />
      {[40, 90, 140, 640, 700, 760].map((x, i) => (
        <path key={x} d={`M${x} 205 l10 -${26 + (i % 3) * 6} l10 ${26 + (i % 3) * 6}z`} fill="#14532d" />
      ))}
      <motion.path
        d="M0 0 q8 -7 16 0 q8 -7 16 0"
        fill="none"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ x: 60, y: 120 }}
        animate={{ x: [60, 360, 60], y: [120, 90, 120] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M0 0 q6 -5 12 0 q6 -5 12 0"
        fill="none"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ x: 90, y: 140 }}
        animate={{ x: [90, 400, 90], y: [140, 110, 140] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </svg>
  );
}

/** Spinning compass rose used as a decorative badge. */
export function CompassRose({ size = 120 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden>
      <circle cx="60" cy="60" r="56" fill="#fff" stroke="#facc15" strokeWidth="4" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="2 5" />
      {["N", "E", "S", "W"].map((l, i) => {
        const a = (i * Math.PI) / 2 - Math.PI / 2;
        return (
          <text key={l} x={60 + Math.cos(a) * 40} y={60 + Math.sin(a) * 40 + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">
            {l}
          </text>
        );
      })}
      <motion.g
        animate={{ rotate: [0, 25, -15, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "60px 60px" }}
      >
        <path d="M60 24 L70 60 L60 66 L50 60Z" fill="#ef4444" />
        <path d="M60 96 L70 60 L60 54 L50 60Z" fill="#0f172a" />
      </motion.g>
      <circle cx="60" cy="60" r="4" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" />
    </svg>
  );
}

/** Step illustrations for "How it works". */
export function StepIllustration({ kind }: { kind: "search" | "pick" | "pack" | "go" }) {
  const common = { viewBox: "0 0 120 90", width: "100%", height: 90, "aria-hidden": true } as const;
  if (kind === "search")
    return (
      <svg {...common}>
        <rect x="10" y="62" width="100" height="6" rx="3" fill="#e2e8f0" />
        <path d="M20 62 L45 28 L62 50 L78 34 L100 62Z" fill="#cbd5e1" />
        <circle cx="52" cy="40" r="20" fill="#fef9c3" stroke="#facc15" strokeWidth="5" />
        <motion.path d="M67 55 L88 76" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" animate={{ x: [0, 3, 0], y: [0, 3, 0] }} transition={{ duration: 2, repeat: Infinity }} />
        <circle cx="52" cy="40" r="7" fill="#facc15" />
      </svg>
    );
  if (kind === "pick")
    return (
      <svg {...common}>
        <rect x="20" y="12" width="80" height="66" rx="8" fill="#fff" stroke="#e2e8f0" strokeWidth="3" />
        <rect x="20" y="12" width="80" height="18" rx="8" fill="#facc15" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect key={`${r}${c}`} x={28 + c * 18} y={38 + r * 12} width="12" height="8" rx="2" fill={r === 1 && c === 2 ? "#0f172a" : "#e2e8f0"} />
          ))
        )}
        <motion.path d="M70 54 l5 5 l9 -11" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1, 0] }} transition={{ duration: 3, repeat: Infinity }} />
      </svg>
    );
  if (kind === "pack")
    return (
      <svg {...common}>
        <rect x="30" y="26" width="60" height="52" rx="12" fill="#0f172a" />
        <rect x="42" y="14" width="36" height="16" rx="8" fill="none" stroke="#0f172a" strokeWidth="5" />
        <rect x="38" y="44" width="44" height="22" rx="6" fill="#1e293b" />
        <rect x="52" y="52" width="16" height="6" rx="3" fill="#facc15" />
        <motion.circle cx="92" cy="22" r="7" fill="#ef4444" animate={{ y: [0, -4, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
        <path d="M30 40 h-6 v26 h6M90 40 h6 v26 h-6" stroke="#facc15" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M0 74 Q60 56 120 74 V90 H0Z" fill="#cbd5e1" />
      <path d="M10 74 L40 36 L60 62 L80 44 L110 74Z" fill="#94a3b8" />
      <motion.g animate={{ x: [-10, 20, -10], y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M34 30 L78 22 L88 28 L78 34Z" fill="#facc15" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M52 28 L46 14 L58 26Z M52 32 L46 44 L58 34Z" fill="#0f172a" />
      </motion.g>
    </svg>
  );
}

export interface HeroPalette {
  bg: string;
  sun: string;
  far: string;
  mid: string;
  near: string;
  accent: string;
  ink: string;
}

/** Light, colourful hero illustration (no photos). */
export function HeroScene({ variant, p }: { variant: "mountain" | "fort" | "forest"; p: HeroPalette }) {
  return (
    <svg viewBox="0 0 600 400" preserveAspectRatio="xMaxYMax slice" width="100%" height="100%" aria-hidden>
      <motion.circle
        cx="440"
        cy="110"
        r="52"
        fill={p.sun}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "440px 110px" }}
      />
      <circle cx="440" cy="110" r="76" fill={p.sun} opacity=".25" />
      <motion.g animate={{ x: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="300" cy="80" rx="48" ry="13" fill="#fff" />
        <ellipse cx="330" cy="68" rx="30" ry="13" fill="#fff" />
      </motion.g>
      <motion.g animate={{ x: [0, -26, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="540" cy="190" rx="36" ry="10" fill="#fff" opacity=".9" />
        <ellipse cx="560" cy="182" rx="22" ry="10" fill="#fff" opacity=".9" />
      </motion.g>

      {variant === "mountain" && (
        <>
          <path d="M120 330 L250 150 L330 250 L400 170 L520 330Z" fill={p.far} />
          <path d="M250 150 L222 190 L242 184 L256 200 L270 182 L288 192Z" fill="#fff" />
          <path d="M400 170 L378 202 L394 198 L404 210 L418 196 L430 204Z" fill="#fff" />
          <path d="M60 340 L190 220 L300 340Z" fill={p.mid} />
        </>
      )}
      {variant === "fort" && (
        <>
          <g fill={p.far}>
            <rect x="250" y="190" width="240" height="140" />
            {[250, 276, 302, 328, 354, 380, 406, 432, 458].map((x) => (
              <rect key={x} x={x} y="176" width="16" height="16" />
            ))}
            <rect x="300" y="130" width="60" height="200" />
            <path d="M300 130 q30 -50 60 0Z" />
            <rect x="420" y="150" width="44" height="180" />
            <path d="M420 150 q22 -40 44 0Z" />
          </g>
          <g fill={p.ink} opacity=".35">
            <path d="M318 330 v-40 q12 -22 24 0 v40Z" />
            <rect x="430" y="200" width="8" height="22" rx="4" />
            <rect x="446" y="200" width="8" height="22" rx="4" />
          </g>
          <path d="M60 340 Q150 250 250 340Z" fill={p.mid} />
        </>
      )}
      {variant === "forest" && (
        <>
          <path d="M40 330 Q160 200 300 330Z" fill={p.far} />
          <path d="M260 330 Q400 180 560 330Z" fill={p.mid} />
          {[330, 380, 430, 480, 530].map((x, i) => (
            <g key={x}>
              <rect x={x - 3} y={300 - (i % 2) * 6} width="6" height="30" fill={p.ink} opacity=".5" />
              <path d={`M${x - 20} 305 L${x} ${236 - (i % 2) * 14} L${x + 20} 305Z`} fill={p.accent} />
              <path d={`M${x - 16} 280 L${x} ${224 - (i % 2) * 14} L${x + 16} 280Z`} fill={p.accent} opacity=".8" />
            </g>
          ))}
        </>
      )}

      <path d="M0 345 Q150 310 320 340 T600 330 V400 H0Z" fill={p.near} />
      <path d="M0 375 Q200 350 420 372 T600 366 V400 H0Z" fill={p.accent} opacity=".55" />

      {[
        [90, 60],
        [180, 120],
        [520, 70],
        [580, 250],
      ].map(([x, y], i) => (
        <motion.path
          key={i}
          d="M0 -6 L2 -2 L6 0 L2 2 L0 6 L-2 2 L-6 0 L-2 -2Z"
          fill={p.accent}
          animate={{ scale: [1, 1.5, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 3 + i, repeat: Infinity }}
          style={{ transform: `translate(${x}px, ${y}px)` }}
        />
      ))}
      <motion.path
        d="M0 0 q8 -7 16 0 q8 -7 16 0"
        fill="none"
        stroke={p.ink}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ x: [200, 380, 200], y: [150, 120, 150] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
