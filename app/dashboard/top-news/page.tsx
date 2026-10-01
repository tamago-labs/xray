'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { TrendingUp, Clock, Newspaper } from 'lucide-react';
import MarketOverview from '@/components/cmc/MarketOverview';
import FearGreedGauge from '@/components/cmc/FearGreedGauge';
import AltcoinSeasonChart from '@/components/cmc/AltcoinSeasonChart';

const dataClient = generateClient<Schema>();

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

const themeColors: Record<string, string> = {
  'Market': 'text-zenblue bg-zenblue/10',
  'AI / Tech': 'text-accent bg-accent/10',
  'X Layer': 'text-accent2 bg-accent2/10',
  'Regulation': 'text-warn2 bg-warn2/10',
  'Technology': 'text-zenpurple bg-zenpurple/10',
  'Personalized': 'text-accent2 bg-accent2/10',
};

export default function TopNews() {
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    dataClient.models.NewsArticle.list({ limit: 20 }).then((res) => {
      const sorted = [...(res.data || [])].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      setArticles(sorted);
    }).catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left column — Metrics */}
      <div className="lg:col-span-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Newspaper className="w-4 h-4 text-accent" />
          <h2 className="text-[14px] font-semibold text-white/85">Market Intelligence</h2>
        </div>

        <MarketOverview />
        <FearGreedGauge />
        <AltcoinSeasonChart />
      </div>

      {/* Right column — News */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent2" />
            <h2 className="text-[14px] font-semibold text-white/85">Top News</h2>
          </div>
          <span className="text-[11px] text-white/30">Personalized to your themes</span>
        </div>

        <div className="space-y-3">
          {articles.length === 0 && (
            <div className="bg-surface border border-border3/50 rounded-xl p-8 text-center">
              <Clock className="w-5 h-5 text-white/20 mx-auto mb-2" />
              <span className="text-sm text-white/30">Loading articles...</span>
            </div>
          )}
          {articles.map((item) => (
            <article key={item.id} className="bg-surface border border-border3/50 rounded-xl p-5 hover:border-border3 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${themeColors[item.theme] || 'text-white/40 bg-white/5'}`}>
                  {item.theme}
                </span>
                <span className="text-[11px] text-white/25">{item.source}</span>
                <span className="text-[10px] text-white/15 ml-auto">{timeAgo(item.publishedAt)}</span>
              </div>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-white/85 mb-1 block group-hover:text-accent transition-colors">
                  {item.title}
                </a>
              ) : (
                <h3 className="text-[13px] font-semibold text-white/85 mb-1">{item.title}</h3>
              )}
              <p className="text-[12px] text-white/40 leading-relaxed">{item.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
