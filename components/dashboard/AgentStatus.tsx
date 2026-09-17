'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

type Status = 'ready' | 'busy' | 'down';

const statusConfig: Record<Status, { emoji: string; label: string }> = {
  ready: { emoji: '🤖', label: 'Here for you' },
  busy: { emoji: '🤖', label: 'I\'m a bit busy' },
  down: { emoji: '😴', label: 'Taking a nap' },
};

const dataClient = generateClient<Schema>();

export default function AgentStatus() {
  const [data, setData] = useState<{ status: Status; users: number; ms: number } | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    dataClient.models.SystemStatus.get({ id: 'current' }).then((res) => {
      if (res.data) {
        setData({
          status: res.data.status as Status,
          users: res.data.activeUsers,
          ms: res.data.avgResponseMs,
        });
      }
    }).catch(() => {});
  }, []);

  if (!data) return null;

  const config = statusConfig[data.status];

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 bg-white/[0.03] font-display border border-border3/50 rounded-lg px-3 py-1.5 cursor-default"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className="text-[14px]">{config.emoji}</span>
        <span className="text-[12px] text-white/60 font-medium">{config.label}</span>
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-44 bg-surface border border-border3 rounded-lg p-3 shadow-xl z-[100]"
          >
            {data.status === 'down' ? (
              <p className="text-[12px] text-white/70">We&apos;ll be back shortly</p>
            ) : (
              <>
                <p className="text-[12px] text-white/70">Serving {data.users} users</p>
                <p className="text-[10px] text-white/30 mt-1">{data.ms}ms avg response</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
