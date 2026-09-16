export interface PromptItem {
  text: string;
  badge: string;
  color: string;
}

export const examplePrompts: PromptItem[] = [
  { text: 'What wrapped tokenized stocks are available for TSLA?', badge: '🔥 Trending', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  { text: 'Compare WNVDAX and WMSFTX — which has better recent performance?', badge: '📊 Compare', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { text: 'Why is WCRCLx price up today?', badge: '⚡ Price', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  { text: 'Which AI tokenized stocks are gaining traction on X Layer?', badge: '🤖 AI', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  { text: 'What are people buying right now?', badge: '💰 Popular', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  { text: 'How do wrapped dividends work on xStocks?', badge: '📖 Learn', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { text: 'Show me lower-risk alternatives to WTSLAX', badge: '🛡️ Safe', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { text: "What's the best performing wrapped stock this week?", badge: '🏆 Top', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
];

export function getRandomPrompt(currentIndex: number): number {
  let next = Math.floor(Math.random() * examplePrompts.length);
  while (next === currentIndex && examplePrompts.length > 1) {
    next = Math.floor(Math.random() * examplePrompts.length);
  }
  return next;
}
