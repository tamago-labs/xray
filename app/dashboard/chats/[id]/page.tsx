'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Trash2 } from 'lucide-react';
import { useWallet } from '@/components/app/WalletContext';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

const dataClient = generateClient<Schema>();
const MIN_CREDITS = 1;

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function ChatSession() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { address } = useWallet();
  const id = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const router = useRouter();
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!address) { setCredits(null); return; }
    dataClient.models.UserProfile.list({
      filter: { walletAddress: { eq: address } },
    }).then((res) => {
      setCredits(res.data?.[0]?.credits ?? null);
    }).catch(() => setCredits(null));
  }, [address]);

  useEffect(() => {
    if (searchParams.get('prompt')) return;
    dataClient.models.AgentSession.get({ id }).then((res) => {
      if (res.data?.items) {
        const items = JSON.parse(res.data.items as string);
        const history: Message[] = items.map((item: any) => ({
          role: item.role === 'assistant' ? 'ai' : 'user',
          content: item.content?.[0]?.text ?? '',
        }));
        setMessages(history);
      }
    }).catch(() => {});
  }, [id, searchParams]);

  const handleDelete = async () => {
    if (!confirm('Delete this chat session?')) return;
    try {
      await dataClient.models.AgentSession.delete({ id });
      router.push('/dashboard');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt && !autoSentRef.current && address) {
      autoSentRef.current = true;
      setMessages([{ role: 'user', content: prompt }]);
      setLoading(true);
      fetch(process.env.NEXT_PUBLIC_CHAT_API_URL || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, sessionId: id, message: prompt }),
      }).then(async (res) => {
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let aiContent = '';
        setMessages((prev) => [...prev, { role: 'ai', content: '' }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split('\n').filter((l) => l.startsWith('data: '));
          for (const line of lines) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.chunk) {
                aiContent += json.chunk;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: 'ai', content: aiContent };
                  return next;
                });
              }
            } catch {}
          }
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [searchParams, address, id]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (credits !== null && credits < MIN_CREDITS) {
      setError(`Insufficient credits. You have ${credits.toFixed(2)} credits.`);
      return;
    }
    const message = input.trim();
    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: message }, { role: 'ai', content: '' }]);
    setLoading(true);

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_CHAT_API_URL || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          sessionId: id,
          message,
        }),
      });

      if (!res.ok) throw new Error('Request failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let aiContent = '';

      setMessages((prev) => [...prev, { role: 'ai', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.chunk) {
              aiContent += json.chunk;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'ai', content: aiContent };
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col  grid-bg overflow-hidden h-[calc(100vh-3.5rem)] relative ">
      <div className="absolute w-[500px] h-[500px] top-1/2 -translate-y-1/2 -left-48 rounded-full blur-[120px] opacity-25 bg-accent pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -right-40 rounded-full blur-[120px] opacity-25 bg-zenpurple pointer-events-none" />
      <div className="border-b border-border3/50 px-6 py-4 relative z-10 flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold">Chat Session</h1>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border3/50 bg-surface shadow-xl z-20 overflow-hidden">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete chat</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-0">
        {messages.map((msg, i) => {
          if (msg.role === 'ai' && !msg.content) {
            return loading ? (
              <div key={i} className="flex justify-start">
                <div className="max-w-[70%] rounded-2xl px-4 py-3 text-[14px] bg-white/[0.03] border border-border3/50 text-white/40">
                  Thinking…
                </div>
              </div>
            ) : null;
          }
          return (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-white/[0.03] border border-border3/50 text-white/80 prose prose-invert prose-sm prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-pre:bg-black/30 prose-pre:border prose-pre:border-border3/50 prose-code:text-accent prose-code:bg-white/[0.06] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none'
              }`}>
                {msg.role === 'ai' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : msg.content}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border3/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message…"
            className="flex-1 bg-white/[0.03] border border-border3/50 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-accent/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={loading || (credits !== null && credits < MIN_CREDITS)}
            className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        {error && (
          <p className="text-[11px] text-red-400 mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
