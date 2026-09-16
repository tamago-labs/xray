import type { Token, Asset } from "@/lib/types/token";


export default function TokenDetailHeader({ token, asset }: { token: Token; asset: Asset }) {
  return (
    <div className="flex items-start gap-4">
      {token.logo ? (
        <img src={token.logo} alt="" className="w-14 h-14 rounded-2xl" />
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-lg font-bold text-white/40">
          {token.symbol.slice(0, 2)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-display font-bold text-white/95">{asset.name} ({asset.symbol})</h1>

        </div>
        <p className="text-sm text-white/40 mt-1">
          {asset.website ? (
            <a href={asset.website} target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
              {asset.website}
            </a>
          ) : (
            asset.name
          )}
          {asset.industry && <span className="text-white/30"> · {asset.industry}</span>}
          {asset.employees && <span className="text-white/30"> · {asset.employees.toLocaleString()} employees</span>}
          {asset.exchange && <span className="text-white/30"> · {asset.exchange}</span>}
        </p>
      </div>
    </div>
  );
}
