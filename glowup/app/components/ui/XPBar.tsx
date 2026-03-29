'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getRank, getNextRank } from '../../lib/xp';

interface XPBarProps {
  level: number;
  currentXP: number;
  xpNeeded: number;
  progress: number;
}

export function XPBar({ level, currentXP, xpNeeded, progress }: XPBarProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setAnimated(true); }, []);

  const rank = getRank(level);
  const next = getNextRank(level);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rank-badge ${rank.cssClass}`}
            style={{ fontSize: '10px' }}
          >
            {rank.icon} Lv.{level}
          </span>
          <span className="text-xs font-semibold" style={{ color: rank.color }}>
            {rank.name}
          </span>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {currentXP}/{xpNeeded} XP
        </span>
      </div>
      <div className="progress-bar" style={{ height: 5 }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${rank.color}, ${next?.color ?? rank.color})` }}
          initial={{ width: 0 }}
          animate={{ width: animated ? `${progress * 100}%` : 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
}
