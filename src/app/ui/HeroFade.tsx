"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";

type Props = {
  children: ReactNode;
  className?: string;

  /** Ignore tiny jitter deltas */
  directionDelta?: number;

  /** Show a debug pill */
  debug?: boolean;
};

export default function HeroFade({ children, className = "", directionDelta = 6, debug = false }: Props) {
  const reduceMotion = useReducedMotion();
  const controls = useAnimationControls();

  const [hiddenState, setHiddenState] = useState(false);

  // refs (avoid stale closures)
  const hiddenRef = useRef(false);
  const lastDirRef = useRef<"UP" | "DOWN" | "—">("—");
  const lastEventRef = useRef<string>("—");

  const transition = useMemo(() => {
    if (reduceMotion) return { duration: 0 };
    return { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as any };
  }, [reduceMotion]);

  const show = (instant = false) => {
    hiddenRef.current = false;
    setHiddenState(false);
    controls.start({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: instant ? { duration: 0 } : transition,
    });
  };

  const hide = (instant = false) => {
    hiddenRef.current = true;
    setHiddenState(true);
    controls.start({
      opacity: 0,
      y: -14,
      filter: "blur(8px)",
      transition: instant ? { duration: 0 } : transition,
    });
  };

  useEffect(() => {
    show(true);

    // WHEEL / TRACKPAD
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < directionDelta) return;

      lastEventRef.current = "wheel";
      if (e.deltaY > 0) {
        lastDirRef.current = "DOWN";
        if (!hiddenRef.current) hide();
      } else {
        lastDirRef.current = "UP";
        if (hiddenRef.current) show();
      }
    };

    // KEYBOARD scroll (space, pgdn, arrows)
    const onKeyDown = (e: KeyboardEvent) => {
      const downKeys = ["ArrowDown", "PageDown", " ", "Spacebar", "End"];
      const upKeys = ["ArrowUp", "PageUp", "Home"];

      if (downKeys.includes(e.key)) {
        lastEventRef.current = "key";
        lastDirRef.current = "DOWN";
        if (!hiddenRef.current) hide();
      } else if (upKeys.includes(e.key)) {
        lastEventRef.current = "key";
        lastDirRef.current = "UP";
        if (hiddenRef.current) show();
      }
    };

    // TOUCH (mobile)
    let touchStartY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches?.[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const cur = e.touches?.[0]?.clientY ?? null;
      if (touchStartY == null || cur == null) return;

      const diff = cur - touchStartY; // >0 finger moved down => user scroll up
      if (Math.abs(diff) < directionDelta) return;

      lastEventRef.current = "touch";
      if (diff < 0) {
        // finger up => user scroll down
        lastDirRef.current = "DOWN";
        if (!hiddenRef.current) hide();
      } else {
        // finger down => user scroll up
        lastDirRef.current = "UP";
        if (hiddenRef.current) show();
      }

      touchStartY = cur;
    };

    // Capture at document level so it works even inside unknown scroll containers
    document.addEventListener("wheel", onWheel, { passive: true, capture: true });
    document.addEventListener("keydown", onKeyDown, { passive: true, capture: true });
    document.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true, capture: true });

    return () => {
      document.removeEventListener("wheel", onWheel, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("touchstart", onTouchStart, true);
      document.removeEventListener("touchmove", onTouchMove, true);
    };
  }, [controls, directionDelta, transition]);

  return (
    <motion.div
      className={className}
      animate={controls}
      initial={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      style={{
        willChange: "transform, opacity, filter",
        pointerEvents: hiddenState ? "none" : "auto",
      }}
    >
      {debug ? (
        <div className="pointer-events-none fixed top-2 right-2 z-[9999] rounded-full border border-slate-200 bg-white/80 backdrop-blur px-3 py-1 text-xs font-extrabold text-slate-800 shadow-sm">
          HeroFade: {lastDirRef.current} | hidden={String(hiddenState)} | via {lastEventRef.current}
        </div>
      ) : null}

      {children}
    </motion.div>
  );
}
