"use client";

import { ReactNode, useId, useMemo, useRef } from "react";
import {
  motion,
  MotionValue,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";

const BRAND_ORANGE = "#fcb040";
const BRAND_BROWN = "#8b6a3d";

export default function CinematicSection({
  eyebrowItems,
  title,
  highlight,
  body,
  children,
  className = "",
  accentA = BRAND_ORANGE,
  accentB = BRAND_BROWN,
}: {
  eyebrowItems?: string[];
  title: string;
  highlight: string;
  body?: string;
  children?: ReactNode;
  className?: string;
  accentA?: string;
  accentB?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Section cinematic behavior
  const opacity = useTransform(scrollYProgress, [0, 0.58, 0.9, 1], [1, 1, 0.18, 0]);
  const y = useTransform(scrollYProgress, [0, 0.85, 1], [0, -18, -42]);
  const blur = useTransform(scrollYProgress, [0, 0.8, 1], [0, 0, 12]);
  const scale = useTransform(scrollYProgress, [0, 0.78, 1], [1, 1, 0.985]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  // “Active glow” envelope (ramps in, holds, then fades)
  const glow = useTransform(scrollYProgress, [0, 0.12, 0.82, 1], [0.15, 1, 1, 0]);
  const steamOpacity = useTransform(scrollYProgress, [0, 0.25, 0.9, 1], [0, 0.85, 0.65, 0]);

  // Card shadow strength derived once (avoid creating transforms inline in JSX)
  const cardShadowAlpha = useTransform(glow, [0, 1], [0, 0.1]);
  const cardShadow = useMotionTemplate`0 18px 55px rgba(2,6,23, ${cardShadowAlpha})`;

  const highlightStyle = useMemo(
    () => ({
      backgroundImage: `linear-gradient(90deg, ${accentA}, ${accentB})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    }),
    [accentA, accentB]
  );

  return (
    <section ref={ref} className={`relative min-h-screen overflow-hidden ${className}`}>
      <CinematicFoodBG glow={glow} steamOpacity={steamOpacity} accentA={accentA} accentB={accentB} />

      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            style={{
              opacity,
              y,
              scale,
              filter,
              willChange: "transform, opacity, filter",
            }}
            className="w-full"
          >
            {/* Eyebrow pill */}
            {eyebrowItems?.length ? (
              <div className="mb-7 flex justify-center">
                <motion.div
                  style={{ boxShadow: cardShadow }}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/80 backdrop-blur px-5 py-2.5 shadow-sm"
                >
                  {eyebrowItems.map((txt, i) => (
                    <EyebrowItem
                      key={`${txt}-${i}`}
                      text={txt}
                      glow={glow}
                      accentA={accentA}
                      accentB={accentB}
                      showSeparator={i !== eyebrowItems.length - 1}
                    />
                  ))}
                </motion.div>
              </div>
            ) : null}

            {/* Title */}
            <h1 className="text-center font-extrabold tracking-tight leading-[0.93] text-[clamp(3.2rem,6.6vw,6.4rem)] text-slate-900">
              {title} <span style={highlightStyle}>{highlight}</span>
            </h1>

            {body ? (
              <p className="mx-auto mt-7 max-w-3xl text-center text-base sm:text-lg leading-relaxed text-slate-600 font-semibold">
                {body}
              </p>
            ) : null}

            {children ? <div className="mt-10">{children}</div> : null}
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

function EyebrowItem({
  text,
  glow,
  accentA,
  accentB,
  showSeparator,
}: {
  text: string;
  glow: MotionValue<number>;
  accentA: string;
  accentB: string;
  showSeparator: boolean;
}) {
  const dotScale = useTransform(glow, [0, 1], [0.85, 1.22]);
  const dotOpacity = useTransform(glow, [0, 1], [0.25, 1]);

  const ringAlpha = useTransform(glow, [0, 1], [0.2, 0.55]);
  const orangeGlow = useTransform(glow, [0, 1], [0, 0.7]);
  const brownGlow = useTransform(glow, [0, 1], [0, 0.35]);

  const dotShadow = useMotionTemplate`
    0 0 0 1px rgba(255,255,255, ${ringAlpha}),
    0 0 18px rgba(252,176,64, ${orangeGlow}),
    0 0 44px rgba(139,106,61, ${brownGlow})
  `;

  const dotBg = useMotionTemplate`linear-gradient(180deg, ${accentA}, ${accentB})`;

  return (
    <div className="flex items-center gap-2">
      <motion.span
        aria-hidden
        className="h-2.5 w-2.5 rounded-full"
        style={{
          opacity: dotOpacity,
          scale: dotScale,
          backgroundImage: dotBg,
          boxShadow: dotShadow,
          willChange: "transform, opacity, box-shadow",
        }}
      />
      <div className="text-sm font-extrabold text-slate-800 tracking-tight">{text}</div>
      {showSeparator ? <div className="mx-1 text-slate-300">•</div> : null}
    </div>
  );
}

function CinematicFoodBG({
  glow,
  steamOpacity,
  accentA,
  accentB,
}: {
  glow: MotionValue<number>;
  steamOpacity: MotionValue<number>;
  accentA: string;
  accentB: string;
}) {
  const gradId = useId();

  const blobAOpacity = useTransform(glow, [0, 1], [0, 0.35]);
  const blobBOpacity = useTransform(glow, [0, 1], [0, 0.28]);

  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/60 to-white" />

      <motion.div
        className="absolute -top-28 -left-28 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          opacity: blobAOpacity,
          background: `radial-gradient(circle at 30% 30%, ${accentA}, transparent 65%)`,
        }}
      />
      <motion.div
        className="absolute -bottom-40 right-[-140px] h-[620px] w-[620px] rounded-full blur-3xl"
        style={{
          opacity: blobBOpacity,
          background: `radial-gradient(circle at 40% 40%, ${accentB}, transparent 62%)`,
        }}
      />

      {/* steam */}
      <motion.div className="absolute inset-0" style={{ opacity: steamOpacity }}>
        <motion.svg
          className="absolute left-1/2 top-[18%] -translate-x-1/2"
          width="900"
          height="520"
          viewBox="0 0 900 520"
          fill="none"
          style={{ filter: "blur(0.2px)" }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={accentA} stopOpacity="0.9" />
              <stop offset="1" stopColor={accentB} stopOpacity="0.9" />
            </linearGradient>
          </defs>

          <SteamPath d="M330 470 C 280 395, 360 330, 310 250 C 270 185, 300 140, 350 90" stroke={`url(#${gradId})`} />
          <SteamPath d="M450 475 C 420 390, 520 340, 470 250 C 420 165, 450 125, 510 80" stroke={`url(#${gradId})`} />
          <SteamPath d="M575 470 C 530 395, 610 330, 565 255 C 530 190, 560 140, 610 100" stroke={`url(#${gradId})`} />
        </motion.svg>

        <FloatingParticle x="22%" y="30%" delay={0.0} />
        <FloatingParticle x="68%" y="26%" delay={0.2} />
        <FloatingParticle x="52%" y="42%" delay={0.4} />
        <FloatingParticle x="40%" y="24%" delay={0.6} />
      </motion.div>
    </div>
  );
}

function SteamPath({ d, stroke }: { d: string; stroke: string }) {
  return (
    <motion.path
      d={d}
      stroke={stroke}
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.9 }}
      transition={{ duration: 1.25, ease: "easeOut" }}
    />
  );
}

function FloatingParticle({ x, y, delay }: { x: string; y: string; delay: number }) {
  return (
    <motion.div
      className="absolute h-2.5 w-2.5 rounded-full"
      style={{
        left: x,
        top: y,
        background:
          "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(252,176,64,0.9))",
        boxShadow: "0 0 24px rgba(252,176,64,0.35)",
      }}
      animate={{ y: [-6, 6, -6], opacity: [0.2, 0.65, 0.2], scale: [0.95, 1.15, 0.95] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}
