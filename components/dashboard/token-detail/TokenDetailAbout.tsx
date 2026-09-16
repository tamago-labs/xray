import type { Asset } from "@/lib/types/token";

function stripMarkdown(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#*]/g, "").trim();
}

export default function TokenDetailAbout({ asset, description }: { asset: Asset; description: string | null }) {
  if (!description) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-white/70 mb-3">About {asset.name}</h2>
      <div className="text-sm text-white/50 leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto pr-2">
        {stripMarkdown(description)}
      </div>
    </div>
  );
}
