"use client";

import { motion, useScroll } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="fixed right-4 top-1/2 z-50 -translate-y-1/2">
      <div className="h-56 w-[6px] rounded-full bg-slate-200/70 overflow-hidden shadow-sm">
        <motion.div
          className="w-full origin-top"
          style={{
            scaleY: scrollYProgress,
            background: "linear-gradient(180deg, #fcb040 0%, #8b6b4b 100%)",
          }}
        />
      </div>
    </div>
  );
}
