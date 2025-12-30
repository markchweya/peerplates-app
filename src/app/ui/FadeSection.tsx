"use client";

import { ReactNode, useRef } from "react";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";

export default function FadeSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  // This makes the section "breathe":
  // - fades in as it enters
  // - fades out as it leaves
  // - when you scroll back up, it reverses naturally
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.2"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 1], [18, 0, -18]);
  const blur = useTransform(scrollYProgress, [0, 0.2, 1], [10, 0, 10]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  return (
    <motion.section
      ref={ref}
      className={className}
      style={{
        opacity,
        y,
        filter,
        willChange: "transform, opacity, filter",
      }}
    >
      {children}
    </motion.section>
  );
}
