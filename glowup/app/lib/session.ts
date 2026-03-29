import { cookies } from 'next/headers';
import { prisma } from './db';

const SESSION_COOKIE = 'glowup_session';

export async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;

  if (existing) {
    const session = await prisma.session.findUnique({ where: { id: existing } });
    if (session) return existing;
  }

  const session = await prisma.session.create({ data: {} });
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return session.id;
}
