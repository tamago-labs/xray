'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useWallet } from '@/components/app/WalletContext';

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    const message = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
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
    <div className="flex-1 flex flex-col h-screen">
      <div className="border-b border-border3/50 px-6 py-4">
        <h1 className="font-display text-lg font-semibold">Chat Session</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent text-white'
                : 'bg-white/[0.03] border border-border3/50 text-white/80'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-2xl px-4 py-3 text-[14px] bg-white/[0.03] border border-border3/50 text-white/40">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
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
            disabled={loading}
            className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
