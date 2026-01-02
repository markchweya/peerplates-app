"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

type ShowcaseItem = {
  image: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  desc: string;
};

type Direction = "rtl" | "ltr";

type NavItem = {
  label: string;
  index: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ScrollShowcase({
  heading = "Showcase",
  subheading = "Swipe left ↔ right (or use the arrows) to explore.",
  items,
  direction = "ltr",
  snap = true,
  tilt = false,
  nav,
}: {
  heading?: string;
  subheading?: string;
  items: ShowcaseItem[];
  direction?: Direction;
  snap?: boolean;
  tilt?: boolean;
  nav?: NavItem[];
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [vw, setVw] = useState(0);
  const [activeIndex, setActiveIndex] = useState(() =>
    direction === "rtl" ? Math.max(0, items.length - 1) : 0
  );

  // Track X is the single source of truth (no native overflow scrolling)
  const x = useMotionValue(0);

  // Visual sizing to match your design: width = min(980px, 92vw), gap = 8 (32px)
  const gapPx = 32;

  const cardW = useMemo(() => Math.min(980, vw * 0.92), [vw]);
  const step = useMemo(() => cardW + gapPx, [cardW]);

  // Center a card inside the viewport
  const centerOffset = useMemo(() => Math.round((vw - cardW) / 2), [vw, cardW]);

  const maxIdx = useMemo(() => Math.max(0, items.length - 1), [items.length]);

  const targetXForIndex = useCallback(
    (idx: number) => {
      // idx 0 centered => x = centerOffset
      // idx i => x = centerOffset - i * step
      return Math.round(centerOffset - idx * step);
    },
    [centerOffset, step]
  );

  // Drag bounds so you can't over-drag into empty space
  const bounds = useMemo(() => {
    const right = targetXForIndex(0);
    const left = targetXForIndex(maxIdx);
    return { left, right };
  }, [maxIdx, targetXForIndex]);

  // Measure viewport width
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => setVw(el.clientWidth || 0);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const t1 = window.setTimeout(measure, 0);
    const t2 = window.setTimeout(measure, 250);

    return () => {
      ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Keep activeIndex valid if items change
  useEffect(() => {
    setActiveIndex((i) => clamp(i, 0, maxIdx));
  }, [maxIdx]);

  // Animate track to active slide
  useEffect(() => {
    const to = targetXForIndex(activeIndex);
    const controls = animate(x, to, {
      type: "spring",
      stiffness: 360,
      damping: 36,
      mass: 0.65,
    });
    return () => controls.stop();
  }, [activeIndex, targetXForIndex, x]);

  const goPrev = useCallback(() => setActiveIndex((i) => clamp(i - 1, 0, maxIdx)), [maxIdx]);
  const goNext = useCallback(() => setActiveIndex((i) => clamp(i + 1, 0, maxIdx)), [maxIdx]);

  // If you still want RTL semantics, invert arrows
  const prevHandler = direction === "rtl" ? goNext : goPrev;
  const nextHandler = direction === "rtl" ? goPrev : goNext;

  const jumpToIndex = useCallback((idx: number) => {
    setActiveIndex(clamp(idx, 0, maxIdx));
  }, [maxIdx]);

  const onDragEnd = useCallback(
    (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (!snap) return;

      const offsetX = info.offset.x;
      const velX = info.velocity.x;

      // thresholds
      const distThresh = Math.min(140, cardW * 0.18);
      const velThresh = 520;

      let nextIndex = activeIndex;

      // Dragging the track right means showing "previous" card
      if (offsetX > distThresh || velX > velThresh) nextIndex = activeIndex - 1;
      else if (offsetX < -distThresh || velX < -velThresh) nextIndex = activeIndex + 1;
      else {
        // Snap to nearest based on current X
        const currentX = x.get();
        const approx = (centerOffset - currentX) / Math.max(1, step);
        nextIndex = Math.round(approx);
      }

      nextIndex = clamp(nextIndex, 0, maxIdx);
      setActiveIndex(nextIndex);
    },
    [activeIndex, cardW, centerOffset, maxIdx, snap, step, x]
  );

  const cardStyleFor = useCallback(
    (idx: number): React.CSSProperties | undefined => {
      if (!tilt) return undefined;

      const delta = idx - activeIndex;
      const abs = Math.abs(delta);

      const rot = clamp(-delta * 6, -12, 12);
      const scale = clamp(1 - abs * 0.06, 0.92, 1);
      const z = clamp((1 - abs) * 24, 0, 24);
      const opacity = clamp(1 - abs * 0.18, 0.6, 1);
      const blur = clamp(abs * 1.1, 0, 2.2);

      return {
        transform: `perspective(1200px) rotateY(${rot}deg) translateZ(${z}px) scale(${scale})`,
        opacity,
        filter: `blur(${blur}px)`,
        transition: "transform 220ms ease, filter 220ms ease, opacity 220ms ease",
        transformStyle: "preserve-3d" as any,
        willChange: "transform, filter, opacity",
      };
    },
    [activeIndex, tilt]
  );

  return (
    <section className="relative">
      {/* background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/60 to-white" />
        <div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-30"
          style={{ background: "rgba(252,176,64,0.35)" }}
        />
        <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-slate-200/50 blur-3xl opacity-40" />
      </div>

      {/* header */}
      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16">
        <div className="flex flex-col gap-5">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{heading}</div>
              <div className="mt-2 text-slate-600 font-semibold max-w-2xl">{subheading}</div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-white/80 backdrop-blur px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm">
                {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </div>

              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevHandler}
                  className="rounded-full border border-slate-200 bg-white/80 backdrop-blur h-10 w-10 grid place-items-center shadow-sm hover:-translate-y-[1px] transition"
                  aria-label="Previous"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={nextHandler}
                  className="rounded-full border border-slate-200 bg-white/80 backdrop-blur h-10 w-10 grid place-items-center shadow-sm hover:-translate-y-[1px] transition"
                  aria-label="Next"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {nav?.length ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="rounded-full border border-slate-200 bg-white/80 backdrop-blur px-2 py-2 shadow-sm flex items-center gap-2">
                {nav.map((n, ix) => {
                  const next = nav[ix + 1]?.index ?? 10_000;
                  const isActive = activeIndex >= n.index && activeIndex < next;
                  return (
                    <button
                      key={n.label}
                      onClick={() => jumpToIndex(n.index)}
                      className={[
                        "px-3 py-1.5 rounded-full text-sm font-extrabold transition",
                        isActive ? "bg-[#fcb040] text-slate-900" : "text-slate-700 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* viewport */}
      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12 pb-14">
        <div className="relative" ref={viewportRef}>
          {/* fade edges */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-14 z-10"
            style={{ background: "linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))" }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-14 z-10"
            style={{ background: "linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0))" }}
          />

          {/* No native scroll: motion track moves instead, so arrows ALWAYS work */}
          <div
            className="overflow-hidden rounded-[34px]"
            style={{
              // allow normal vertical page scroll while enabling horizontal drag inside
              touchAction: "pan-y",
            }}
          >
            <motion.div
              className="flex gap-8 pr-[18vw] py-2"
              style={{ x }}
              drag="x"
              dragConstraints={bounds}
              dragElastic={0.08}
              onDragEnd={onDragEnd}
            >
              {items.map((it, idx) => (
                <div key={`${it.title}-${idx}`} className="shrink-0" style={{ width: "min(980px, 92vw)" }}>
                  <div
                    style={cardStyleFor(idx)}
                    className="rounded-[34px] border border-slate-200/70 bg-white/80 backdrop-blur shadow-[0_18px_60px_rgba(15,23,42,0.10)] overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {/* image */}
                      <div className="p-5 sm:p-6">
                        <div className="relative h-[360px] sm:h-[440px] rounded-[28px] overflow-hidden border border-slate-200 bg-slate-100 shadow-[0_14px_40px_rgba(2,6,23,0.18)]">
                          <Image
                            src={it.image}
                            alt={it.title}
                            fill
                            priority={idx === 0}
                            sizes="(max-width: 768px) 92vw, 980px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0" />
                        </div>
                      </div>

                      {/* copy */}
                      <div className="p-6 sm:p-8 md:pl-3 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 w-fit">
                          <span className="h-2 w-2 rounded-full bg-[#fcb040]" />
                          {it.kicker ?? "Feature preview"}
                        </div>

                        <div className="mt-6 text-[clamp(1.6rem,2.3vw,2.35rem)] leading-tight font-extrabold tracking-tight text-slate-900">
                          {it.title}
                        </div>

                        {it.subtitle ? (
                          <div className="mt-3 text-slate-900 font-extrabold text-lg">{it.subtitle}</div>
                        ) : null}

                        <div className="mt-4 text-slate-600 font-semibold leading-relaxed">{it.desc}</div>

                        <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <span className="inline-block h-2 w-2 rounded-full bg-[#fcb040]" />
                          Drag / swipe left ↔ right
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="w-10 shrink-0" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
