"use client";

import { motion } from "framer-motion";

export default function BigTitle({
  lead,
  accent,
  accentClassName = "text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-[#fcb040] to-slate-900",
}: {
  lead: string;
  accent: string;
  accentClassName?: string;
}) {
  return (
    <div className="pt-10 sm:pt-14">
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.6 }}
        transition={{ duration: 0.55 }}
        className="tracking-tight leading-[0.92] font-extrabold text-[clamp(2.8rem,7vw,5.6rem)]"
      >
        <span className="text-slate-900">{lead} </span>
        <span className={accentClassName}>{accent}</span>
        <span className="text-slate-900">.</span>
      </motion.h1>
    </div>
  );
}
