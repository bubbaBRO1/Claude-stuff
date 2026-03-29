'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface XPPopupProps {
  amount: number;
  trigger: number; // increment to trigger a new popup
}

export function XPPopup({ amount, trigger }: XPPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={trigger}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -50, scale: 1.15 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-50"
        >
          <span
            className="text-sm font-bold px-2 py-1 rounded-full whitespace-nowrap"
            style={{ background: 'var(--gradient-gold)', color: 'white' }}
          >
            +{amount} XP ⚡
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
