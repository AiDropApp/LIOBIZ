"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { defaultLanding, type LandingContent } from "@/lib/cms-defaults";

export default function AboutLiobiz() {
  const [landing, setLanding] = useState<LandingContent>(defaultLanding);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.landing) setLanding({ ...defaultLanding, ...data.landing });
      })
      .catch(() => undefined);
  }, []);

  return (
    <section id="about-liobiz" className="about-liobiz pb-16 lg:pb-24">
      <div className="container mx-auto">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-2 text-center lg:order-1 lg:text-right"
          >
            <span className="section-label">{landing.aboutLabel}</span>
            <h2 className="section-title mt-2 text-[1.75rem] md:text-3xl lg:text-[2.35rem]">
              {landing.aboutTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-8 text-muted lg:mx-0">
              {landing.aboutText1}
            </p>
            <p className="mx-auto mt-4 max-w-xl leading-8 text-muted lg:mx-0">
              {landing.aboutText2}
            </p>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-foreground px-7 py-3.5 text-sm font-bold text-white transition hover:bg-black/85"
            >
              بیشتر درباره ما
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="about-liobiz-visual order-1 lg:order-2"
          >
            <div className="about-liobiz-main">
              <Image
                src="/images/about-liobiz-main.png"
                alt="رشد و موفقیت با لیوبیز"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 48vw"
                priority={false}
              />
              <div className="about-liobiz-badge">ارزش ما رشد شماست؛ افتخار ما</div>
            </div>
            <div className="about-liobiz-float">
              <Image
                src="/images/about-liobiz-float.png"
                alt="مسیر رشد برند"
                fill
                className="object-cover"
                sizes="280px"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
