import { useState, useEffect } from "react";

const PALETTE = ["#C6F135", "#8B7FFF", "#5AC8FA", "#FF69B4", "#FFB347", "#7C8BFF", "#50FA7B", "#FF79C6"];

function getDexColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function RouteVisualization({ quote }: { quote: any }) {
  const [dexLogos, setDexLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/dex-logos")
      .then((r) => r.json())
      .then((data) => {
        if (data.logos) setDexLogos(data.logos);
      })
      .catch(() => {});
  }, []);

  const { dexRouterList } = quote;

  const hops: { fromToken: string; toToken: string; dexes: { name: string; percent: string }[] }[] = [];
  for (const r of dexRouterList) {
    const fromSymbol = r.fromToken.tokenSymbol;
    const toSymbol = r.toToken.tokenSymbol;
    let hop = hops.find((h) => h.fromToken === fromSymbol && h.toToken === toSymbol);
    if (!hop) {
      hop = { fromToken: fromSymbol, toToken: toSymbol, dexes: [] };
      hops.push(hop);
    }
    hop.dexes.push({ name: r.dexProtocol.dexName, percent: r.dexProtocol.percent });
  }

  return (
    <div className="space-y-2">
      {hops.map((hop, i) => (
        <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-white/60">
              {hop.fromToken} → {hop.toToken}
            </span>
            <span className="text-[10px] text-white/25">{hop.dexes.length} route{hop.dexes.length > 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-1.5">
            {hop.dexes.map((dex, j) => {
              const color = getDexColor(dex.name);
              const icon = dexLogos[dex.name] ?? "";
              return (
                <div key={j} className="flex items-center gap-2">
                  {icon ? (
                    <img
                      src={icon}
                      alt={dex.name}
                      className="w-4 h-4 rounded-full shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-white/[0.06] shrink-0 flex items-center justify-center">
                      <span className="text-[6px] font-bold text-white/30">{dex.name.slice(0, 1)}</span>
                    </div>
                  )}
                  <span className="text-[10px] w-16 shrink-0 text-white/40 truncate">{dex.name}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(Number(dex.percent), 100)}%`,
                        backgroundColor: color,
                        opacity: j > 0 ? 0.6 : 1,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono w-9 text-right" style={{ color }}>
                    {Number(dex.percent).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
