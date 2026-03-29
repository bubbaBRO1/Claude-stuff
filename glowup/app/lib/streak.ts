export function toDateKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function calcStreak(dateKeys: string[]): number {
  if (!dateKeys.length) return 0;
  const sorted = [...new Set(dateKeys)].sort().reverse();
  const today = toDateKey();
  const yesterday = toDateKey(new Date(Date.now() - 86400000));

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let cursor = new Date(sorted[0] + 'T12:00:00Z');

  for (const key of sorted) {
    const expected = toDateKey(cursor);
    if (key === expected) {
      streak++;
      cursor = new Date(cursor.getTime() - 86400000);
    } else {
      break;
    }
  }
  return streak;
}
