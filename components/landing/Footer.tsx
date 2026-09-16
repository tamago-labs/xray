import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border3/50 py-10">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <p className="text-[12px] text-white/30">© 2026 Zivic</p>
        <div className="flex items-center gap-6 text-[12px] text-white/30">
          <Link href="#" className="hover:text-white/60 transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white/60 transition-colors">Terms</Link>
          <Link href="#" className="hover:text-white/60 transition-colors">Docs</Link>
          <Link href="#" className="hover:text-white/60 transition-colors">Twitter</Link>
        </div>
      </div>
    </footer>
  );
}
