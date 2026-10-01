'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MessageSquare, PieChart, Compass, Rocket, Bell, Newspaper, List, ChevronDown, Plus, BookCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useWallet } from '@/components/app/WalletContext';

const navItems = [
  { href: '/dashboard', label: 'New Scan', icon: Plus },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/dashboard/explore', label: 'Explore', icon: Compass },
  { href: '/dashboard/pre-ipo', label: 'Pre-IPO', icon: Rocket },
  // { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/top-news', label: 'Top News', icon: Newspaper },
];

const dataClient = generateClient<Schema>();

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isConnected, address } = useWallet();
  const [chatsOpen, setChatsOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Array<{ id: string; portfolioName: string; overallScore: number; overallLabel: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) { setProfileId(null); setReviews([]); return; }
    void (async () => {
      try {
        const { data: profiles } = await dataClient.models.UserProfile.list({
          filter: { walletAddress: { eq: address } },
        });
        setProfileId(profiles?.[0]?.id ?? null);
      } catch { setProfileId(null); }
    })();
  }, [address]);

  useEffect(() => {
    if (!profileId) { setReviews([]); return; }
    setLoading(true);
    dataClient.models.SavedReview.list({
      filter: { userProfileId: { eq: profileId } },
    }).then((res) => {
      setReviews((res.data ?? [])
        .map((r) => ({ id: r.id, portfolioName: r.portfolioName, overallScore: r.overallScore, overallLabel: r.overallLabel, createdAt: r.createdAt }))
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
        .slice(0, 20));
    }).catch(() => {
      setReviews([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [profileId, pathname, chatsOpen]);

  const toggleChats = () => {
    setChatsOpen(!chatsOpen);
  };

  return (
    <aside className="w-56 h-screen border-r border-border3/50 bg-surface flex flex-col fixed left-0 top-0">
      <Link href="/" className="px-5 h-14 flex items-center gap-2 border-b border-border3/50 hover:bg-white/[0.02] transition-colors">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zenblue to-zenpurple flex items-center justify-center">
          <span className="text-[18px] font-brand">X</span>
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">Xray</span>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            (item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)) ||
            (item.href === '/dashboard/explore' && pathname.startsWith('/dashboard/token'));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-display font-medium transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-zenblue/25 via-accent/15 to-accent2/20'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
              <span className={isActive ? 'text-white' : ''}>{item.label}</span>
            </Link>
          );
        })}

        {/* Saved Reviews accordion */}
        <div>
          <button
            onClick={toggleChats}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-display font-medium text-white/50 hover:text-white hover:bg-white/[0.03] transition-colors"
          >
            <BookCheck className="w-4 h-4" />
            <span className="flex-1 text-left">Saved Reviews</span>
            <motion.div
              animate={{ rotate: chatsOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          </button>

          <AnimatePresence>
            {chatsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pl-10 pr-3 py-1 space-y-0.5">
                  {!isConnected ? (
                    <p className="px-3 py-1.5 text-[11px] text-white/30">Connect wallet to see reviews</p>
                  ) : loading ? (
                    <p className="px-3 py-1.5 text-[11px] text-white/30">Loading...</p>
                  ) : reviews.length === 0 ? (
                    <p className="px-3 py-1.5 text-[11px] text-white/30">No reviews yet</p>
                  ) : (
                    reviews.map((review) => {
                      const isActive = pathname === `/dashboard/chats/${review.id}`;
                      return (
                        <Link
                          key={review.id}
                          href={`/dashboard/chats/${review.id}`}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] transition-colors ${
                            isActive
                              ? 'bg-accent/10 text-accent'
                              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${review.overallScore <= 30 ? 'bg-emerald-400' : review.overallScore <= 60 ? 'bg-yellow-400' : review.overallScore <= 80 ? 'bg-orange-400' : 'bg-red-400'}`} />
                          <span className="truncate flex-1">{review.portfolioName}</span>
                          <span className="text-white/25 shrink-0 text-[10px]">{relativeTime(review.createdAt)}</span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </aside>
  );
}
