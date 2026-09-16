import type { Token } from "@/lib/types/token";
import { Globe, AtSign, MessageSquare } from "lucide-react";

export default function TokenDetailLinks({ token }: { token: Token }) {
  if (!token.website && !token.twitter && !token.discord) return null;

  return (
    <div className="flex gap-2">
      {token.website && (
        <a href={token.website} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white/60 hover:text-white/90 hover:bg-white/[0.08] transition-all">
          <Globe className="w-4 h-4" /> Website
        </a>
      )}
      {token.twitter && (
        <a href={token.twitter} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white/60 hover:text-white/90 hover:bg-white/[0.08] transition-all">
          <AtSign className="w-4 h-4" /> Twitter
        </a>
      )}
      {token.discord && (
        <a href={token.discord} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white/60 hover:text-white/90 hover:bg-white/[0.08] transition-all">
          <MessageSquare className="w-4 h-4" /> Telegram
        </a>
      )}
    </div>
  );
}
