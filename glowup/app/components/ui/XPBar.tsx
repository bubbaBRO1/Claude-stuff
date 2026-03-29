'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { levelTitle } from '../../lib/xp';

interface XPBarProps {
  level: number;
  currentXP: number;
  xpNeeded: number;
  progress: number;
}

export function XPBar({ level, currentXP, xpNeeded, progress }: XPBarProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setAnimated(true); }, []);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--gradient)', color: 'white' }}
          >
            Lv.{level}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {levelTitle(level)}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {currentXP}/{xpNeeded} XP
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.15)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--gradient)' }}
          initial={{ width: 0 }}
          animate={{ width: animated ? `${progress * 100}%` : 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
}
