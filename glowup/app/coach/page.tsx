'use client';

import Link from 'next/link';
import { PageTransition } from '../components/layout/PageTransition';

const COACH_FEATURES = [
  {
    icon: '📷',
    title: 'Physique Scan',
    description: 'Get personalized feedback on your physique and improvement suggestions.',
    href: '/scan',
    color: '#10b981',
  },
  {
    icon: '📊',
    title: 'Posture Analysis',
    description: 'Evaluate your posture and receive corrective guidance.',
    href: '/scan',
    color: '#06b6d4',
  },
  {
    icon: '👔',
    title: 'Rate My Outfit',
    description: 'Get style feedback with outfit improvement recommendations.',
    href: '/shop',
    color: '#8b5cf6',
  },
  {
    icon: '🗣️',
    title: 'Voice Coach',
    description: 'Get tips on speech, tone, and communication confidence.',
    href: '/confidence',
    color: '#ec4899',
  },
  {
    icon: '🧠',
    title: 'Mindset Coach',
    description: 'Daily affirmations and mental frameworks for confidence.',
    href: '/confidence',
    color: '#f59e0b',
  },
  {
    icon: '💪',
    title: 'Fitness Guide',
    description: 'Workout suggestions and exercise tracking.',
    href: '/health',
    color: '#ef4444',
  },
  {
    icon: '🥗',
    title: 'Nutrition Tips',
    description: 'Dietary guidance for skin, hair, and overall health.',
    href: '/health',
    color: '#22c55e',
  },
  {
    icon: '😴',
    title: 'Sleep Optimizer',
    description: 'Track and optimize your sleep for maximum recovery.',
    href: '/health',
    color: '#6366f1',
  },
];

const DAILY_CHALLENGES = [
  { icon: '🗣️', title: 'Social: Start a Conversation', desc: 'Talk to someone new today', xp: 50 },
  { icon: '📸', title: 'Journal: Take a Progress Photo', desc: 'Document your journey', xp: 20 },
  { icon: '💧', title: 'Health: Drink 8 Glasses', desc: 'Stay hydrated all day', xp: 15 },
  { icon: '🧘', title: 'Mindset: 5-Min Meditation', desc: 'Practice mindfulness', xp: 35 },
  { icon: '🏃', title: 'Fitness: 30-Min Exercise', desc: 'Get your body moving', xp: 40 },
  { icon: '📖', title: 'Growth: Read for 15 Min', desc: 'Feed your mind', xp: 25 },
];

export default function CoachPage() {
  // Rotate challenges based on day
  const dayIndex = Math.floor(Date.now() / 86400000);
  const todayChallenges = [
    DAILY_CHALLENGES[dayIndex % DAILY_CHALLENGES.length],
    DAILY_CHALLENGES[(dayIndex + 1) % DAILY_CHALLENGES.length],
    DAILY_CHALLENGES[(dayIndex + 2) % DAILY_CHALLENGES.length],
  ];

  return (
    <PageTransition>
      <div className="space-y-6 py-2">
        <div>
          <h1 className="text-2xl font-black gradient-text">Life Coach</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Select a feature to get personalized coaching
          </p>
        </div>

        {/* Coach Features Grid */}
        <div className="space-y-2 stagger">
          {COACH_FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="card p-4 flex items-center gap-4 block transition-all"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  background: `${feature.color}12`,
                  border: `1px solid ${feature.color}20`,
                }}
              >
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {feature.title}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {feature.description}
                </div>
              </div>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Daily Challenges */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              ⚔️ Today's Challenges
            </h3>
            <span className="chip chip-gold text-[10px]">Daily Reset</span>
          </div>
          {todayChallenges.map((c) => (
            <div key={c.title} className="card-gold p-4 flex items-center gap-3">
              <span className="text-2xl">{c.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {c.title}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.desc}</div>
              </div>
              <span className="chip chip-gold text-[10px]">+{c.xp} XP</span>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/routine" className="card p-3 text-center block">
            <div className="text-2xl mb-1">☀️</div>
            <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Morning Routine</div>
          </Link>
          <Link href="/confidence" className="card p-3 text-center block">
            <div className="text-2xl mb-1">💪</div>
            <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Habits & Growth</div>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
