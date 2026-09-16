"use client";

export default function MockChart({ positive }: { positive: boolean }) {
  const points = Array.from({ length: 40 }, (_, i) => {
    const base = positive ? 40 : 60;
    const trend = positive ? i * 0.8 : -i * 0.8;
    const noise = Math.sin(i * 0.8) * 12 + Math.cos(i * 1.3) * 6;
    return Math.max(10, Math.min(90, base + trend + noise));
  });
  const w = 600;
  const h = 200;
  const step = w / (points.length - 1);
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - p * (h / 100)}`).join(" ");
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;
  const gid = positive ? "grad-up" : "grad-down";

  return (
    <div className="w-full h-48 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${gid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={positive ? "#34d399" : "#f87171"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={positive ? "#34d399" : "#f87171"} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${gid}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={positive ? "#34d399" : "#f87171"} stopOpacity="0.6" />
            <stop offset="100%" stopColor={positive ? "#34d399" : "#f87171"} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gid}-area)`} />
        <path d={pathD} fill="none" stroke={`url(#${gid}-line)`} strokeWidth="2" />
      </svg>
    </div>
  );
}
