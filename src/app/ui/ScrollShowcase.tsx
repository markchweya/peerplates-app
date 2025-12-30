"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

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

function parsePx(v: string) {
  const n = parseFloat(v || "0");
  return Number.isFinite(n) ? n : 0;
}

function parseGap(g: string) {
  const parts = (g || "").split(" ").filter(Boolean);
  return parsePx(parts[0] || "0");
}

function isScrollable(el: HTMLElement) {
  const cs = window.getComputedStyle(el);
  const oy = cs.overflowY;
  const scrollable = oy === "auto" || oy === "scroll";
  return scrollable && el.scrollHeight > el.clientHeight + 2;
}

function findScrollContainer(start: HTMLElement | null): HTMLElement | null {
  let el: HTMLElement | null = start;
  while (el) {
    if (isScrollable(el)) return el;
    el = el.parentElement;
  }
  return null;
}

export default function ScrollShowcase({
  heading = "Showcase",
  subheading = "Scroll down — the gallery slides right → left.",
  items,
  direction = "rtl",
  snap = false,
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
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [travel, setTravel] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sectionPxHeight, setSectionPxHeight] = useState<number | null>(null);

  const scrollerRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const progress = useMotionValue(0);
  const p = useSpring(progress, { stiffness: 160, damping: 28, mass: 0.55 });

  const xTo = direction === "rtl" ? -travel : travel;
  const xRaw = useTransform(p, [0, 1], [0, xTo]);
  const x = useSpring(xRaw, { stiffness: 160, damping: 28, mass: 0.55 });

  const startScrollPosRef = useRef(0);

  const getScrollTop = useCallback(() => {
    const scroller = scrollerRef.current;
    return scroller ? scroller.scrollTop : window.scrollY;
  }, []);

  const getViewportH = useCallback(() => {
    const scroller = scrollerRef.current;
    return scroller ? scroller.clientHeight : window.innerHeight;
  }, []);

  const scrollToTop = useCallback((top: number) => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollTo({ top, behavior: "smooth" });
    else window.scrollTo({ top, behavior: "smooth" });
  }, []);

  const applyTilt = useCallback(() => {
    if (!tilt || items.length < 2) return;

    const center = progress.get() * (items.length - 1);
    for (let i = 0; i < items.length; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;

      const delta = i - center;
      const abs = Math.abs(delta);

      const rot = clamp(-delta * 7, -12, 12);
      const scale = clamp(1 - abs * 0.07, 0.92, 1);
      const z = clamp((1 - abs) * 26, 0, 26);
      const opacity = clamp(1 - abs * 0.22, 0.55, 1);
      const blur = clamp(abs * 1.25, 0, 2.25);

      el.style.transform = `perspective(1200px) rotateY(${rot}deg) translateZ(${z}px) scale(${scale})`;
      el.style.opacity = `${opacity}`;
      el.style.filter = `blur(${blur}px)`;
    }
  }, [items.length, tilt, progress]);

  /**
   * ✅ CRITICAL FIX:
   * Your travel was sometimes too small because dist1 could under-report.
   * So 10/10 was reached early (around gallery8).
   *
   * Fix: take the MAX of the strategies, not "prefer dist1".
   */
  const measureTravel = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const viewportW = viewport.clientWidth;

    const cs = window.getComputedStyle(track);
    const gap = parseGap(cs.gap) || parsePx(cs.columnGap);
    const padRight = parsePx(cs.paddingRight);

    const dist1 = Math.max(0, Math.round(track.scrollWidth - viewportW));

    const firstSlide = track.firstElementChild as HTMLElement | null;
    const slideW = firstSlide
      ? firstSlide.getBoundingClientRect().width
      : Math.min(980, viewportW * 0.92);

    const total2 = slideW * items.length + gap * Math.max(0, items.length - 1) + padRight;
    const dist2 = Math.max(0, Math.round(total2 - viewportW));

    // fallback estimate
    const dist3 = Math.max(0, Math.round((items.length - 1) * (viewportW * 0.85)));

    const final = Math.max(dist1, dist2, dist3);
    setTravel(final);

    const vh = getViewportH();
    setSectionPxHeight(vh + final);
  }, [items.length, getViewportH]);

  const measureStart = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const scroller = scrollerRef.current;
    const currentScrollTop = getScrollTop();

    if (!scroller) {
      const rect = section.getBoundingClientRect();
      startScrollPosRef.current = rect.top + window.scrollY;
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    startScrollPosRef.current = sectionRect.top - scrollerRect.top + currentScrollTop;
  }, [getScrollTop]);

  const updateProgress = useCallback(() => {
    const dist = Math.max(1, travel);
    const now = getScrollTop();
    const start = startScrollPosRef.current;

    const raw = (now - start) / dist;
    const p01 = clamp(raw, 0, 1);
    progress.set(p01);

    if (items.length) {
      const idx = Math.round(p01 * (items.length - 1));
      setActiveIndex(clamp(idx, 0, items.length - 1));
    }

    applyTilt();
  }, [applyTilt, getScrollTop, items.length, progress, travel]);

  // --------------------
  // SNAP (optional)
  // --------------------
  const snapTimerRef = useRef<number | null>(null);
  const isSnappingRef = useRef(false);

  const shouldAllowSnap = useCallback(() => {
    if (!snap) return false;
    if (items.length < 2) return false;
    if (travel <= 0) return false;

    const now = getScrollTop();
    const start = startScrollPosRef.current;

    const edgePadding = 28;
    const inRange = now >= start + edgePadding && now <= start + travel - edgePadding;

    return inRange;
  }, [getScrollTop, items.length, snap, travel]);

  const snapToNearest = useCallback(() => {
    if (!shouldAllowSnap()) return;

    const current = progress.get();
    const idx = clamp(Math.round(current * (items.length - 1)), 0, items.length - 1);

    const start = startScrollPosRef.current;
    const step = travel / Math.max(1, items.length - 1);
    const targetTop = start + idx * step;

    isSnappingRef.current = true;
    scrollToTop(targetTop);

    window.setTimeout(() => {
      isSnappingRef.current = false;
    }, 260);
  }, [items.length, progress, scrollToTop, shouldAllowSnap, travel]);

  const scheduleSnap = useCallback(() => {
    if (!snap) return;
    if (isSnappingRef.current) return;

    if (!shouldAllowSnap()) {
      if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
      return;
    }

    if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current);
    snapTimerRef.current = window.setTimeout(() => {
      snapToNearest();
    }, 160);
  }, [snap, snapToNearest, shouldAllowSnap]);

  const jumpToIndex = useCallback(
    (idx: number) => {
      if (items.length < 2) return;

      const i = clamp(idx, 0, items.length - 1);
      const start = startScrollPosRef.current;
      const step = travel / Math.max(1, items.length - 1);
      const targetTop = start + i * step;

      isSnappingRef.current = true;
      scrollToTop(targetTop);
      window.setTimeout(() => {
        isSnappingRef.current = false;
      }, 260);
    },
    [items.length, scrollToTop, travel]
  );

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    scrollerRef.current = findScrollContainer(section.parentElement);

    measureTravel();
    measureStart();
    updateProgress();

    const scroller = scrollerRef.current;

    const onScroll = () => {
      updateProgress();
      scheduleSnap();
    };

    if (scroller) scroller.addEventListener("scroll", onScroll, { passive: true });
    else window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      measureTravel();
      measureStart();
      updateProgress();
    };
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(() => {
      measureTravel();
      measureStart();
      updateProgress();
    });

    if (viewportRef.current) ro.observe(viewportRef.current);
    if (trackRef.current) ro.observe(trackRef.current);
    ro.observe(section);

    const t1 = window.setTimeout(() => {
      measureTravel();
      measureStart();
      updateProgress();
    }, 250);
    const t2 = window.setTimeout(() => {
      measureTravel();
      measureStart();
      updateProgress();
    }, 900);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t1);
      window.clearTimeout(t2);

      if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current);

      if (scroller) scroller.removeEventListener("scroll", onScroll);
      else window.removeEventListener("scroll", onScroll);
    };
  }, [measureStart, measureTravel, scheduleSnap, updateProgress]);

  useEffect(() => {
    if (!tilt) return;
    for (let i = 0; i < items.length; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      el.style.willChange = "transform, filter, opacity";
      el.style.transition = "transform 220ms ease, filter 220ms ease, opacity 220ms ease";
      el.style.transformStyle = "preserve-3d";
    }
    applyTilt();
  }, [applyTilt, items.length, tilt]);

  const sectionHeightStyle = useMemo(() => {
    if (sectionPxHeight != null) return { height: `${sectionPxHeight}px` };
    return { height: `calc(100vh + ${Math.max(0, travel)}px)` };
  }, [sectionPxHeight, travel]);

  return (
    <section ref={sectionRef} className="relative" style={sectionHeightStyle}>
      <div className="sticky top-0 h-screen overflow-hidden">
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
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {heading}
                </div>
                <div className="mt-2 text-slate-600 font-semibold max-w-2xl">{subheading}</div>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                <div className="rounded-full border border-slate-200 bg-white/80 backdrop-blur px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm">
                  {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#fcb040]" />
                  Scroll to explore
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
        <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12">
          <div
            ref={viewportRef}
            className="relative w-full overflow-hidden"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
            }}
          >
            <motion.div ref={trackRef} style={{ x, translateZ: 0 }} className="flex w-max gap-8 pr-[18vw]">
              {items.map((it, idx) => (
                <div key={`${it.title}-${idx}`} className="shrink-0" style={{ width: "min(980px, 92vw)" }}>
                  <div
                    ref={(el) => {
                      cardRefs.current[idx] = el;
                    }}
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
                            onLoad={() => {
                              measureTravel();
                              measureStart();
                              updateProgress();
                            }}
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
                          PeerPlates experience
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

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </div>
    </section>
  );
}
