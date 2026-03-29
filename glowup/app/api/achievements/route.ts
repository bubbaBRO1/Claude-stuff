import { NextResponse } from 'next/server';
import { prisma } from '../../lib/db';
import { getOrCreateSession } from '../../lib/session';
import { ACHIEVEMENTS } from '../../lib/achievements';
import { toDateKey } from '../../lib/streak';

export async function GET() {
  try {
    const sessionId = await getOrCreateSession();

    // Gather data to compute each achievement
    const [analyses, habitLogs, habits, routineLogs, focusSessions, sleepLogs, waterLogs, journalEntries, xpLogs] =
      await Promise.all([
        prisma.analysis.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } }),
        prisma.habitLog.findMany({ include: { habit: true }, where: { habit: { sessionId } } }),
        prisma.habit.findMany({ where: { sessionId, isActive: true } }),
        prisma.routineLog.findMany({ include: { routine: true }, where: { routine: { sessionId } } }),
        prisma.focusSession.findMany({ where: { sessionId, completedAt: { not: null } } }),
        prisma.sleepLog.findMany({ where: { sessionId } }),
        prisma.waterLog.findMany({ where: { sessionId } }),
        prisma.journalEntry.findMany({ where: { sessionId } }),
        prisma.xPLog.findMany({ where: { sessionId, reason: 'achievement' } }),
      ]);

    // Compute streak from routine logs
    const routineDateKeys = [...new Set(routineLogs.map(l => l.dateKey))].sort();
    let streak = 0;
    const today = toDateKey();
    let checkDate = new Date(today);
    while (true) {
      const dk = checkDate.toISOString().split('T')[0];
      if (routineDateKeys.includes(dk)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Check if all habits were completed on any 7 days in a row
    function checkPerfectWeek(): boolean {
      if (habits.length === 0) return false;
      const dateMap: Record<string, Set<string>> = {};
      for (const log of habitLogs) {
        if (!dateMap[log.dateKey]) dateMap[log.dateKey] = new Set();
        dateMap[log.dateKey].add(log.habitId);
      }
      const completeDays = Object.entries(dateMap)
        .filter(([, ids]) => habits.every(h => ids.has(h.id)))
        .map(([d]) => d)
        .sort();
      if (completeDays.length < 7) return false;
      for (let i = 6; i < completeDays.length; i++) {
        let consecutive = 1;
        for (let j = i - 1; j >= 0; j--) {
          const prev = new Date(completeDays[j + 1]);
          const curr = new Date(completeDays[j]);
          const diff = (prev.getTime() - curr.getTime()) / 86400000;
          if (diff === 1) consecutive++;
          else break;
        }
        if (consecutive >= 7) return true;
      }
      return false;
    }

    // Water target: 8 glasses on 7 different days
    const waterTargetDays = waterLogs.filter(l => l.glasses >= 8).length;

    const earnedIds = new Set(xpLogs.map(l => {
      // We store which achievement was unlocked in a separate mechanism
      // For now, derive from XP log count vs achievement list
      return '';
    }));

    // Simpler: check each achievement condition directly
    const results = ACHIEVEMENTS.map(a => {
      let earned = false;
      switch (a.id) {
        case 'first-scan':
          earned = analyses.length >= 1;
          break;
        case 'streak-7':
          earned = streak >= 7;
          break;
        case 'habit-hero':
          earned = streak >= 30;
          break;
        case 'glow-up':
          if (analyses.length >= 2) {
            const sorted = [...analyses].sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime());
            earned = sorted.some((a, i) => i > 0 && a.overallScore >= sorted[i - 1].overallScore + 1);
          }
          break;
        case 'perfect-week':
          earned = checkPerfectWeek();
          break;
        case 'dedicated':
          earned = routineLogs.length >= 30;
          break;
        case 'focus-5':
          earned = focusSessions.length >= 5;
          break;
        case 'hydrated':
          earned = waterTargetDays >= 7;
          break;
        case 'well-rested':
          earned = sleepLogs.length >= 7;
          break;
        case 'journaler':
          earned = journalEntries.length >= 5;
          break;
      }
      return { ...a, earned };
    });

    return NextResponse.json(results);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
