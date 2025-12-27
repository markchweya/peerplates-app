"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lobster } from "next/font/google";

const BRAND_HEX = "#fcb040";
// Use a stable RGB string so SSR/client match style serialization more consistently
const BRAND_RGB = "rgb(252, 176, 64)";

// Script font to match the logo wordmark style
const logoWordmarkFont = Lobster({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/**
 * Desired behavior:
 * - Default: ONLY the logo image shows (no word, no dots on letters).
 * - Hover (desktop): logo dissolves -> dots fly -> word appears -> dots disappear.
 * - Leave hover: word disappears -> dots return -> logo returns.
 * - Mobile (no hover): tapping should NOT “stick” the word.
 *   We do a short “preview” animation then return to logo.
 */

type Particle = {
  id: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  r: number;
  d: number;
};

function makeWordTargets(): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];

  const line = (x1: number, y1: number, x2: number, y2: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
  };

  // === Hand-tuned “PeerPlates” dot targets (stage 560x110) ===
  // Peer
  line(18, 30, 18, 88, 6);
  line(18, 30, 72, 30, 5);
  line(18, 56, 62, 56, 4);
  line(72, 30, 72, 56, 3);

  line(92, 56, 132, 56, 4);
  line(92, 56, 92, 86, 3);
  line(92, 86, 132, 86, 4);
  line(132, 56, 132, 70, 2);

  line(148, 56, 188, 56, 4);
  line(148, 56, 148, 86, 3);
  line(148, 86, 188, 86, 4);
  line(188, 56, 188, 70, 2);

  line(204, 56, 204, 88, 4);
  line(204, 56, 236, 56, 3);
  line(236, 56, 236, 70, 2);

  // Plates
  line(256, 30, 256, 88, 6);
  line(256, 30, 310, 30, 5);
  line(256, 56, 300, 56, 4);
  line(310, 30, 310, 56, 3);

  line(328, 30, 328, 88, 6);

  line(344, 70, 370, 56, 3);
  line(370, 56, 396, 70, 3);
  line(354, 86, 386, 86, 4);
  line(396, 70, 396, 88, 2);
  line(344, 70, 344, 88, 2);

  line(414, 30, 414, 88, 6);
  line(396, 46, 432, 46, 4);

  line(446, 56, 486, 56, 4);
  line(446, 56, 446, 86, 3);
  line(446, 86, 486, 86, 4);
  line(486, 56, 486, 70, 2);

  line(506, 56, 546, 56, 4);
  line(506, 56, 506, 70, 2);
  line(506, 70, 546, 70, 4);
  line(546, 70, 546, 86, 2);
  line(506, 86, 546, 86, 4);

  return pts;
}

// Hydration-safe px helper (round + stringify)
function px(n: number, decimals = 4) {
  const m = Math.pow(10, decimals);
  const rounded = Math.round(n * m) / m;
  return `${rounded}px`;
}

export default function LogoCinematic({
  size = 56,
  wordScale = 1,
  className = "",
}: {
  size?: number;
  wordScale?: number;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  const [canHover, setCanHover] = useState(true);
  const previewTimer = useRef<number | null>(null);

  useEffect(() => {
    // If device can’t hover (mobile), don’t allow “sticky” state.
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    return () => {
      if (previewTimer.current) window.clearTimeout(previewTimer.current);
    };
  }, []);

  const targets = useMemo(() => makeWordTargets(), []);

  const particles = useMemo<Particle[]>(() => {
    const logoStageW = size; // anchor strictly to logo size
    const logoStageH = size;

    const wordStageW = 560;
    const wordStageH = 110;

    const used = targets.slice(0, 72);

    return used.map((p, i) => {
      const angle = (i / used.length) * Math.PI * 2;
      const radius = 14 + (i % 7) * 3;

      const sx = logoStageW / 2 + Math.cos(angle) * radius;
      const sy = logoStageH / 2 + Math.sin(angle) * radius;

      const tx = (p.x / wordStageW) * (wordStageW * 0.72) * wordScale;
      const ty = (p.y / wordStageH) * (wordStageH * 0.9) * wordScale;

      return {
        id: i,
        sx,
        sy,
        tx,
        ty,
        r: 4 + (i % 3),
        d: 0.018 * (i % 14),
      };
    });
  }, [targets, size, wordScale]);

  const onEnter = () => {
    if (!canHover) return;
    setActive(true);
  };

  const onLeave = () => {
    if (!canHover) return;
    setActive(false);
  };

  // Mobile: do a short preview and automatically return (no “stuck” word).
  const onTapPreview = () => {
    if (canHover) return;
    setActive(true);
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => setActive(false), 1200);
  };

  return (
    <div
      className={["relative inline-flex items-center select-none", className].join(" ")}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onTapPreview}
      role="button"
      aria-label="PeerPlates logo"
    >
      {/* Anchor = the logo itself (no big white stage). */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* cinematic glow */}
        <motion.div
          className="absolute -inset-3 rounded-[22px] pointer-events-none"
          animate={{
            opacity: active ? 0.9 : 0.55,
            filter: active ? "blur(10px)" : "blur(14px)",
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, rgba(252,176,64,0.40) 0%, rgba(252,176,64,0.10) 50%, rgba(252,176,64,0.00) 75%)",
          }}
        />

        {/* Logo image */}
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: active ? 0 : 1,
            scale: active ? 0.98 : 1,
            filter: active ? "blur(1.8px)" : "blur(0px)",
          }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <Image
            src="/images/brand/logo.png"
            alt="PeerPlates logo"
            width={size}
            height={size}
            priority
            className="block h-full w-full rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.10)]"
          />
        </motion.div>

        {/* Particles originate from logo and fly into word formation */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((pt) => (
            <motion.span
              key={pt.id}
              className="absolute rounded-full"
              // ✅ hydration-safe: always use px-strings + rounding
              style={{
                width: px(pt.r, 0),
                height: px(pt.r, 0),
                backgroundColor: BRAND_RGB,
                left: px(pt.sx, 4),
                top: px(pt.sy, 4),
              }}
              animate={{
                x: active ? 200 + pt.tx : 0,
                y: active ? -10 + pt.ty : 0,
                opacity: active ? 1 : 0,
                scale: active ? 1 : 0.75,
              }}
              transition={{
                duration: 0.72,
                delay: active ? pt.d : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          ))}
        </div>
      </div>

      {/* Word area */}
      <div className="relative ml-3" style={{ width: 420 * wordScale, height: 64 * wordScale }}>
        <AnimatePresence>
          {active ? (
            <motion.div
              key="word"
              initial={{ opacity: 0, y: 6, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 4, filter: "blur(10px)" }}
              transition={{ duration: 0.34, delay: 0.62, ease: "easeOut" }}
              className="flex flex-col"
            >
              <div
                className={[logoWordmarkFont.className, "tracking-tight leading-none"].join(" ")}
                style={{
                  fontSize: `${Math.round(28 * wordScale)}px`,
                  letterSpacing: "-0.02em",
                  fontWeight: 400,
                }}
              >
                <span style={{ color: "#0f172a" }}>Peer</span>
                <span style={{ color: BRAND_HEX }}>Plates</span>
              </div>

              <div
                className="mt-1 font-semibold"
                style={{
                  color: "rgba(15,23,42,0.70)",
                  fontSize: `${Math.round(14 * wordScale)}px`,
                }}
              >
                authentic • affordable • local
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
