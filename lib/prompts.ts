export interface PromptItem {
  text: string;
  badge: string;
  color: string;
}

export const examplePrompts: PromptItem[] = [
  { text: 'What tokenized stocks are available for TSLA?', badge: '🔥 Trending', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  { text: 'Show me lower-risk alternatives to NVDAx', badge: '📈 Rising', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { text: 'Compare prices between AMZNX and AMZNon', badge: '📅 Top Today', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  { text: 'Why is NVDAx ranked above MSFTx?', badge: '🏆 All Time', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { text: 'What are people buying right now?', badge: '⚡ Trending', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  { text: 'Which AI stocks are gaining traction?', badge: '🤖 AI Watch', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  { text: 'How do dividends work on tokenized stocks?', badge: '💰 Dividends', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { text: 'What are the best performing stocks this week?', badge: '📊 Top Weekly', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
];

export function getRandomPrompt(currentIndex: number): number {
  let next = Math.floor(Math.random() * examplePrompts.length);
  while (next === currentIndex && examplePrompts.length > 1) {
    next = Math.floor(Math.random() * examplePrompts.length);
  }
  return next;
}
