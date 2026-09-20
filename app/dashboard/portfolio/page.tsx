'use client';

import PortfolioStats from '@/components/dashboard/portfolio/PortfolioStats';
import HoldingsList from '@/components/dashboard/portfolio/HoldingsList';

export default function Portfolio() {
  return (
    <div className="flex gap-4 h-[calc(100vh-6.5rem)] min-h-0">
      <PortfolioStats />
      <div className="flex-1 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col min-h-0 overflow-hidden">
        <HoldingsList />
      </div>
    </div>
  );
}
