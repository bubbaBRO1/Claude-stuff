'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRank } from '../../lib/xp';

interface LevelUpModalProps {
  level: number | null;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  useEffect(() => {
    if (!level) return;
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#10b981', '#06b6d4', '#eab308'] });
    });
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [level, onClose]);

  if (level === null) return null;
  const rank = getRank(level);

  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-center mx-4 p-8 rounded-2xl"
            style={{
              background: 'var(--bg-secondary)',
              border: `2px solid ${rank.color}40`,
              boxShadow: `0 0 60px ${rank.color}20`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="animate-shield-pulse"
            >
              <div
                className="w-24 h-28 mx-auto rounded-2xl flex flex-col items-center justify-center mb-4"
                style={{
                  background: `radial-gradient(ellipse at center, ${rank.color}20 0%, transparent 70%)`,
                  border: `2px solid ${rank.color}40`,
                  boxShadow: `0 0 30px ${rank.color}25`,
                }}
              >
                <span className="text-4xl">{rank.icon}</span>
              </div>
            </motion.div>
            <div className="text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
              LEVEL UP
            </div>
            <div className="text-4xl font-black mb-2 gradient-text text-glow">
              Level {level}
            </div>
            <div className="text-lg font-bold mb-4" style={{ color: rank.color }}>
              {rank.name}
            </div>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              You&apos;re climbing the ranks. Keep pushing.
            </p>
            <button
              onClick={onClose}
              className="btn-primary w-full py-3 text-sm font-bold"
            >
              Keep Grinding ⚡
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
