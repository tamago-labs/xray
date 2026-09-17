export const dynamic = "force-dynamic";

export default function PreIpoPage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-[11px] text-white/30 uppercase tracking-wider mb-3">Coming Soon</p>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-white/80 mb-4">
          Pre-IPO Tokenized Stocks
        </h1>
        <p className="text-[13px] text-white/40 leading-relaxed">
          Get early access to tokenized shares of companies before they go public. 
          Invest in the next unicorn at pre-IPO valuations on X Layer.
        </p>
      </div>
    </div>
  );
}
