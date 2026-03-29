'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { levelTitle } from '../../lib/xp';

interface LevelUpModalProps {
  level: number | null;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  useEffect(() => {
    if (!level) return;
    // fire confetti
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    });
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [level, onClose]);

  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="card-gradient-border p-8 text-center mx-4"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-6xl mb-4"
            >
              🏆
            </motion.div>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Level Up!
            </div>
            <div className="text-4xl font-black mb-2 gradient-text">
              Level {level}
            </div>
            <div className="text-lg font-semibold mb-4" style={{ color: 'var(--accent-gold)' }}>
              {levelTitle(level)}
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              You're leveling up your glow. Keep going! 💪
            </p>
            <button
              onClick={onClose}
              className="btn-primary w-full"
            >
              Keep Grinding ⚡
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
