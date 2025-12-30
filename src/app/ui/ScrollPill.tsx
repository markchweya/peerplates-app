"use client";

import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useMemo, useState } from "react";

type Props = {
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ScrollPill({ className = "" }: Props) {
  const { scrollYProgress } = useScroll(); // window scroll
  const y = useSpring(scrollYProgress, { stiffness: 520, damping: 70, mass: 0.55 });

  const [active, setActive] = useState(false);
  const [idleTimer, setIdleTimer] = useState<number | null>(null);

  useMotionValueEvent(scrollYProgress, "change", () => {
    setActive(true);
    if (idleTimer) window.clearTimeout(idleTimer);
    const t = window.setTimeout(() => setActive(false), 800);
    setIdleTimer(t);
  });

  const styles = useMemo(
    () => ({
      track:
        "fixed right-[10px] top-1/2 -translate-y-1/2 z-[120] w-[10px] h-[54vh] rounded-full bg-black/[0.06] backdrop-blur-sm",
      thumb:
        "absolute left-1/2 -translate-x-1/2 w-[6px] rounded-full bg-[#fcb040] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_10px_30px_rgba(252,176,64,0.22)]",
    }),
    []
  );

  return (
    <motion.div
      className={`${styles.track} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0.55 }}
      transition={{ duration: 0.18 }}
    >
      {/* subtle glow line */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none" />

      <motion.div
        className={styles.thumb}
        style={{
          top: y.get() * 100 + "%",
          translateY: "-50%",
          height: active ? 34 : 28,
        }}
      />
    </motion.div>
  );
}
