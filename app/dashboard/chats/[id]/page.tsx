'use client';

import { useParams } from 'next/navigation';

const mockSessions: Record<string, { title: string; messages: { role: 'user' | 'ai'; text: string }[] }> = {
  '12333454': {
    title: 'TSLA xStock analysis',
    messages: [
      { role: 'user', text: 'Analyze TSLA xStock for me' },
      { role: 'ai', text: 'TSLA xStock is currently ranked #3 in the tech sector. It has a Zivic Score of 87/100 based on your growth偏好. Key metrics: +12% this month, volatility medium, strong momentum.' },
      { role: 'user', text: 'Should I add it to my portfolio?' },
      { role: 'ai', text: 'Based on your moderate risk appetite, TSLA xStock fits well as a 15-20% allocation. It balances your current AAPL-heavy positions.' },
    ],
  },
  '98765432': {
    title: 'NVDA risk assessment',
    messages: [
      { role: 'user', text: 'What\'s the risk level of NVDA xStock?' },
      { role: 'ai', text: 'NVDA xStock has a high risk score of 72/100. Volatility is elevated due to AI sector rotation. Recommended allocation: 5-10% for aggressive profiles.' },
    ],
  },
  '55512345': {
    title: 'AAPL vs MSFT comparison',
    messages: [
      { role: 'user', text: 'Compare AAPL and MSFT xStocks' },
      { role: 'ai', text: 'AAPL: Zivic Score 91, low risk, steady growth. MSFT: Zivic Score 88, medium risk, higher upside. For your profile, AAPL is the safer pick.' },
    ],
  },
  '22288899': {
    title: 'Portfolio rebalancing',
    messages: [
      { role: 'user', text: 'Help me rebalance my portfolio' },
      { role: 'ai', text: 'Your current portfolio is 60% tech. I recommend reducing TSLA to 10%, adding AMZN at 8%, and keeping AAPL at 15% for better diversification.' },
    ],
  },
};

export default function ChatSession() {
  const params = useParams();
  const id = params.id as string;
  const session = mockSessions[id];

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/40 text-sm">Chat session not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="border-b border-border3/50 px-6 py-4">
        <h1 className="font-display text-lg font-semibold">{session.title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {session.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent text-white'
                : 'bg-white/[0.03] border border-border3/50 text-white/80'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
