import { cookies } from 'next/headers';
import { prisma } from './db';

const SESSION_COOKIE = 'glowup_session';

/**
 * Read-only session getter for Server Components.
 * Returns the session ID if it exists, or null.
 */
export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;
  if (!existing) return null;
  const session = await prisma.session.findUnique({ where: { id: existing } });
  return session ? existing : null;
}

/**
 * Get or create session — only safe in Route Handlers / Server Actions
 * (anywhere cookies can be written).
 */
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
