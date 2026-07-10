from pathlib import Path

root = Path(r"D:\liobiz\liobiz\public\images")
root.mkdir(parents=True, exist_ok=True)

for i in range(1, 9):
    c = "#3B82F6" if i % 2 else "#60A5FA"
    (root / f"project{i}.svg").write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 720" fill="none">
  <rect width="540" height="720" rx="48" fill="#0C1017"/>
  <rect x="40" y="40" width="460" height="640" rx="36" fill="#121821"/>
  <circle cx="270" cy="240" r="110" fill="{c}" opacity="0.35"/>
  <circle cx="320" cy="200" r="48" fill="#F59E0B" opacity="0.18"/>
  <rect x="100" y="420" width="340" height="180" rx="24" fill="#1A2230"/>
  <path d="M140 480h220" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity="0.8"/>
  <path d="M140 530h160" stroke="{c}" stroke-width="10" stroke-linecap="round"/>
</svg>""",
        encoding="utf-8",
    )

hues = ["#3B82F6", "#60A5FA", "#1D4ED8", "#F59E0B", "#93C5FD", "#2563EB", "#FBBF24", "#38BDF8"]
for i, hue in enumerate(hues, 1):
    (root / f"backstage{i}.svg").write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 560" fill="none">
  <defs>
    <linearGradient id="g{i}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#121821"/>
      <stop offset="100%" stop-color="#0C1017"/>
    </linearGradient>
    <radialGradient id="r{i}" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="{hue}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="{hue}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="420" height="560" rx="40" fill="url(#g{i})"/>
  <rect width="420" height="560" rx="40" fill="url(#r{i})"/>
  <rect x="48" y="72" width="324" height="220" rx="28" fill="#1A2230" opacity="0.9"/>
  <circle cx="160" cy="160" r="36" fill="{hue}" opacity="0.7"/>
  <circle cx="230" cy="150" r="28" fill="#fff" opacity="0.25"/>
  <circle cx="290" cy="170" r="32" fill="{hue}" opacity="0.45"/>
  <rect x="48" y="320" width="324" height="160" rx="24" fill="#121821"/>
  <path d="M80 370h180" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.75"/>
  <path d="M80 410h120" stroke="{hue}" stroke-width="8" stroke-linecap="round"/>
</svg>""",
        encoding="utf-8",
    )

for i, name in enumerate(["team1", "team2", "team3", "team4"], 1):
    c = ["#3B82F6", "#60A5FA", "#F59E0B", "#2563EB"][i - 1]
    (root / f"{name}.svg").write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" fill="none">
  <rect width="320" height="320" rx="48" fill="#111827"/>
  <circle cx="160" cy="124" r="52" fill="{c}" opacity="0.85"/>
  <path d="M160 188c-48 0-86 22-86 50v20h172v-20c0-28-38-50-86-50Z" fill="#1f2937"/>
  <path d="M116 118c0-24 18-44 44-44s44 20 44 44" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
</svg>""",
        encoding="utf-8",
    )

print("assets ok")
