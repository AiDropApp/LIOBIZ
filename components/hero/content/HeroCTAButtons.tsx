"use client";

import Link from "next/link";

export default function HeroCTAButtons() {
  return (
    <div className="mb-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-end">
      <Link className="btn-primary px-7 py-3.5 text-[0.95rem]" href="/contact">
        مشاوره
      </Link>
      <Link className="btn-outline btn-outline--quiet px-6 py-3 text-sm" href="/portfolio">
        مشاهده نمونه کارها
      </Link>
    </div>
  );
}
