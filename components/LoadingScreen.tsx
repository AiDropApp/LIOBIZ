"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#030304]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,43,43,0.2),transparent_42%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03),transparent_25%,rgba(255,43,43,0.08),transparent_72%)]" />
          <motion.div
            initial={{ scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative h-56 w-56 rounded-full border border-white/10"
          >
            <div className="absolute inset-6 rounded-full border border-primary/30" />
            <div className="absolute inset-10 rounded-full border border-white/15" />
            <div className="absolute inset-0 animate-spin [animation-duration:6s] rounded-full border-t border-primary/70" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(255,43,43,0.9),transparent_70%)] blur-[2px]" />
            </div>
          </motion.div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.8 }}
            className="absolute bottom-16 text-center text-sm uppercase tracking-[0.35em] text-white/60"
          >
            Liobiz • Brand Engine
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
