'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MessageSquare, PieChart, Compass, Bell, Newspaper, List, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'New Chat', icon: MessageSquare },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/dashboard/explore', label: 'Explore', icon: Compass },
  // { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/top-news', label: 'Top News', icon: Newspaper },
];

const mockSessions = [
  { id: '12333454', title: 'TSLA xStock analysis' },
  { id: '98765432', title: 'NVDA risk assessment' },
  { id: '55512345', title: 'AAPL vs MSFT comparison' },
  { id: '22288899', title: 'Portfolio rebalancing' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [chatsOpen, setChatsOpen] = useState(false);

  return (
    <aside className="w-56 h-screen border-r border-border3/50 bg-surface flex flex-col fixed left-0 top-0">
      <Link href="/" className="px-5 h-14 flex items-center gap-2 border-b border-border3/50 hover:bg-white/[0.02] transition-colors">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zenblue to-zenpurple flex items-center justify-center">
          <span className="text-[18px] font-brand">Z</span>
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">Zivic</span>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
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

        {/* Chats accordion */}
        <div>
          <button
            onClick={() => setChatsOpen(!chatsOpen)}
            className="w-full flex items-center gap-4 px-3 py-2 rounded-lg text-sm font-display font-medium text-white/50 hover:text-white hover:bg-white/[0.03] transition-colors"
          >
            <motion.div
              animate={{ rotate: chatsOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3 h-3" />
            </motion.div>
            <span className="flex-1 text-left">Chats</span>
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
                  {mockSessions.map((session) => {
                    const isActive = pathname === `/dashboard/chats/${session.id}`;
                    return (
                      <Link
                        key={session.id}
                        href={`/dashboard/chats/${session.id}`}
                        className={`block px-3 py-1.5 rounded-md text-[12px] font-display truncate transition-colors ${
                          isActive
                            ? 'bg-accent/10 text-accent'
                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                        }`}
                      >
                        {session.title}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </aside>
  );
}
