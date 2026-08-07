"use client";

import { useEffect, useState } from "react";

type Props = {
  onToken: (token: string) => void;
};

type Puzzle = { a: number; b: number; answer: number };

/** Simple math captcha when Cloudflare Turnstile is not configured. */
export default function SimpleCaptcha({ onToken }: Props) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 1;
    setPuzzle({ a, b, answer: a + b });
  }, []);

  const verify = () => {
    if (!puzzle) return;
    const n = Number(value.trim());
    if (n === puzzle.answer) {
      setError("");
      onToken(`math:${puzzle.a}+${puzzle.b}=${puzzle.answer}`);
      return;
    }
    setError("پاسخ نادرست است.");
    onToken("");
  };

  if (!puzzle) {
    return (
      <div className="simple-captcha" aria-hidden="true">
        <span className="text-sm text-muted">در حال بارگذاری تأیید امنیتی…</span>
      </div>
    );
  }

  return (
    <div className="simple-captcha">
      <label className="contact-field">
        <span>تأیید امنیتی: {puzzle.a} + {puzzle.b} = ؟</span>
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={verify}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                verify();
              }
            }}
            placeholder="جواب"
            dir="ltr"
            className="max-w-[8rem]"
          />
          <button type="button" className="cms-edit-btn" onClick={verify}>
            تأیید
          </button>
        </div>
        {error ? <small className="text-red-600">{error}</small> : null}
      </label>
    </div>
  );
}
