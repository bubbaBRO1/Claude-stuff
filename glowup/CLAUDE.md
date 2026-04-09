# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

All commands run from the `glowup/` directory.

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:migrate   # Apply Prisma schema migrations (npx prisma migrate dev)
npm run db:seed      # Seed products table (tsx prisma/seed.ts)
```

There is no test suite.

## Architecture

**GlowUp** is a mobile-first PWA for personal self-improvement. Stack: Next.js 16 App Router, React 19, TypeScript, Prisma 7 + SQLite, Tailwind CSS 4, face-api.js.

### Session System

The app is anonymous — no login. Identity is a cookie-backed session ID stored in Prisma (`Session` model). Every piece of user data is scoped to a `sessionId`.

- `app/lib/session.ts` — `getSessionId()` (read-only, for Server Components) and `getOrCreateSession()` (creates session + sets cookie, used in API routes)
- All API routes call `getOrCreateSession()` before any DB access.

### API Routes (`app/api/`)

REST handlers under `app/api/`. Each folder maps to a resource (habits, routines, goals, focus, health, xp, analysis, achievements, journal, products, weekly-review). Pattern:
- `GET` fetches session-scoped data
- `POST` writes and often awards XP via a secondary call to `app/lib/xp.ts`

### Data Layer

Prisma client is a singleton at `app/lib/db.ts`. Schema at `prisma/schema.prisma`; generated client outputs to `app/generated/prisma`.

**Deduplication pattern:** daily logs (`HabitLog`, `RoutineLog`, `SleepLog`, `WaterLog`) use a `dateKey` string (`YYYY-MM-DD`) with a `@@unique([id, dateKey])` constraint to prevent duplicate entries per day.

### Gamification

- `app/lib/xp.ts` — XP calculation, level formula (`level * 200` XP per level), rank ladder (Bronze → Mythic across 8 tiers), and `addXP()` helper called by API routes.
- `app/lib/achievements.ts` — 10 achievement definitions; checked and unlocked at various trigger points.
- `app/lib/streak.ts` — consecutive-day streak calculation from `RoutineLog` records.

### Face Analysis Pipeline

1. `app/components/scan/FaceScanner.tsx` — captures webcam frame to canvas
2. `app/components/scan/AnalysisEngine.ts` — loads TinyFaceDetector + FaceLandmark68 models from `public/models/`, runs face-api.js detection
3. `app/lib/faceScoring.ts` — scores 8 features (symmetry, skin, eyes, jawline, hair, grooming, brows, lips) from landmarks
4. Results POSTed to `/api/analysis`, stored in `Analysis` model with `featuresJson` (JSON string)
5. 30 XP awarded for scan; 75 XP for score improvement

### Styling & Theming

Tailwind CSS 4 with custom CSS variables defined in `app/globals.css` (`--bg-primary`, `--text-primary`, etc.). Dark/light theme toggled via `ThemeProvider` (`app/components/layout/ThemeProvider.tsx`) using `localStorage`. Layout is `max-w-lg` centered, mobile-first.
