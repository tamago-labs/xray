'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'New Scan' },
  { href: '/dashboard/portfolio', label: 'Portfolio' },
  { href: '/dashboard/explore', label: 'Explore' },
  { href: '/dashboard/pre-ipo', label: 'Prep DEX' },
  { href: '#faq', label: 'FAQ' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border3/50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zenblue to-zenpurple flex">
            <span className="text-[20px] font-brand text-center mx-auto">X</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Xray</span>
        </Link>

        <nav className="hidden md:flex font-display items-center gap-7 text-[13px] text-white/50 font-medium">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white transition-colors">{item.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hidden md:inline-flex text-[13px] font-display font-medium bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors">
            Launch App
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-white/60 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden overflow-hidden border-t border-border3/50 bg-dark/95 backdrop-blur"
          >
            <div className="px-6 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block text-[14px] text-white/60 hover:text-white font-display font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block mt-3 text-[13px] font-display font-medium bg-accent text-white px-4 py-2 rounded-lg text-center hover:bg-accent/80 transition-colors"
              >
                Launch App
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
