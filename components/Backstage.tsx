"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ContentImage from "@/components/ContentImage";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import type { BackstageItem } from "@/lib/content-store";

function MarqueeRow({
  items,
  direction,
  duration,
  reduced,
}: {
  items: BackstageItem[];
  direction: "left" | "right";
  duration: number;
  reduced: boolean;
}) {
  const loop = [...items, ...items];

  return (
    <div className="backstage-marquee-track">
      <motion.div
        className="backstage-marquee-row"
        animate={
          reduced
            ? undefined
            : { x: direction === "right" ? ["0%", "50%"] : ["0%", "-50%"] }
        }
        transition={
          reduced ? undefined : { duration, ease: "linear", repeat: Infinity }
        }
      >
        {loop.map((item, index) => (
          <article key={`${item.id}-${index}`} className="backstage-card">
            <div className="backstage-card-frame">
              <ContentImage
                src={item.image}
                alt={item.caption}
                fill
                sizes="(max-width: 768px) 140px, 200px"
                className="object-cover"
              />
              <div className="backstage-card-overlay" />
              <div className="backstage-card-meta">
                <span>{item.caption}</span>
              </div>
            </div>
          </article>
        ))}
      </motion.div>
    </div>
  );
}

export default function Backstage() {
  const reduced = usePrefersReducedMotion();
  const [gallery, setGallery] = useState<BackstageItem[]>([]);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data.backstage) ? data.backstage : [];
        const valid = items.filter(
          (item: BackstageItem) =>
            item?.image &&
            !String(item.image).startsWith("/api/media/") &&
            !String(item.image).endsWith(".svg")
        );
        setGallery(valid.length ? valid : items);
      })
      .catch(() => setGallery([]));
  }, []);

  const topRow = gallery.filter((_, i) => i % 2 === 0);
  const bottomRow = gallery.filter((_, i) => i % 2 === 1);

  return (
    <section id="backstage" className="backstage-section relative py-20 lg:py-28">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="section-label">بک استیج لیوبیز</span>
          <h2 className="section-title">پشت صحنهٔ ساخت برندهای ماندگار</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            لحظه‌های واقعی تیم، جلسات استراتژی، تولید محتوا و اجرای کمپین — دو ردیف زنده از فضای کار لیوبیز.
          </p>
        </motion.div>

        {gallery.length > 0 && (
          <div className="backstage-marquee space-y-4 lg:space-y-5">
            <MarqueeRow
              items={topRow.length ? topRow : gallery}
              direction="right"
              duration={42}
              reduced={reduced}
            />
            <MarqueeRow
              items={bottomRow.length ? bottomRow : gallery}
              direction="left"
              duration={48}
              reduced={reduced}
            />
          </div>
        )}
      </div>
    </section>
  );
}
