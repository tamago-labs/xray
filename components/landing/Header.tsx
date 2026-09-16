import Link from 'next/link';
import AgentStatus from '../dashboard/AgentStatus';

export default function Header() {
  return (
    <header className="border-b border-border3/50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zenblue to-zenpurple flex">
            <span className="text-[20px] font-brand text-center mx-auto">Z</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Zivic</span>
        </Link>

        <nav className="hidden md:flex font-display items-center gap-7 text-[13px] text-white/50 font-medium">
          <Link href="/dashboard" className="hover:text-white transition-colors">Chat</Link>
          <Link href="/dashboard/explore" className="hover:text-white transition-colors">Explore</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>

        </nav>

        <div className="flex items-center gap-4">
          <AgentStatus />
          <Link href="/dashboard" className="text-[13px] font-display font-medium bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
