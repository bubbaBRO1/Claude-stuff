# Useful GitHub Repos

> **Stack context:** GlowUp app — Next.js · TypeScript · Tailwind · Prisma · Framer Motion · face-api.js · PWA
> **Date curated:** 2026-05-22
> **Total repos:** 22

---

## UI Components & Design Systems

### 1. [shadcn-ui/ui](https://github.com/shadcn-ui/ui) ⭐ 114,875
A set of beautifully designed, accessible React components built on Radix UI and Tailwind CSS. Copy-paste components directly into your project — no npm install needed. Works perfectly with Next.js.
**Why useful:** Drop-in UI for GlowUp's dashboard, modals, buttons, sliders, and all interactive elements.
**Tags:** #ui #components #radix #tailwind #nextjs

---

### 2. [birobirobiro/awesome-shadcn-ui](https://github.com/birobirobiro/awesome-shadcn-ui) ⭐ 19,593
A massive curated list of shadcn/ui extensions, themes, plugins, templates, and community components you can't find in the official library.
**Why useful:** Find pre-built GlowUp-style cards, charts, and animated components that extend shadcn.
**Tags:** #ui #shadcn #resources #awesome-list

---

### 3. [lucide-icons/lucide](https://github.com/lucide-icons/lucide) ⭐ 22,709
A beautiful, consistent SVG icon set with 1,000+ icons. Has first-class React support via `lucide-react`. MIT licensed.
**Why useful:** All the icons for GlowUp — health, focus, flame, trophy, settings — all in one library.
**Tags:** #icons #svg #react #design

---

## CSS & Styling

### 4. [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) ⭐ 95,091
The utility-first CSS framework GlowUp already uses. Official repo — great for reading source, release notes, and v4 internals.
**Why useful:** Stay up to date on v4 changes (you're already on v4).
**Tags:** #css #tailwind #framework

---

### 5. [tailwindlabs/prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) ⭐ 7,083
A Prettier plugin that automatically sorts Tailwind CSS classes in the recommended order, keeping JSX clean.
**Why useful:** Eliminates class-order debates; auto-formats on save.
**Tags:** #tailwind #prettier #dx #tooling

---

### 6. [tailwindlabs/tailwindcss-typography](https://github.com/tailwindlabs/tailwindcss-typography) ⭐ 6,376
Official Tailwind Typography plugin — adds a `prose` class for beautiful typographic defaults on HTML you don't control.
**Why useful:** Perfect for GlowUp's coach/tips sections and any markdown-rendered content.
**Tags:** #tailwind #typography #plugin

---

## Drag & Drop

### 7. [clauderic/dnd-kit](https://github.com/clauderic/dnd-kit) ⭐ 17,148
The modern, lightweight drag-and-drop toolkit for React. Supports sorting, grids, trees, and multi-container drag. Already used in GlowUp (`@dnd-kit/*`).
**Why useful:** Deep reference for sortable lists in your routine and task features.
**Tags:** #drag-drop #react #sortable #accessibility

---

### 8. [atlassian/react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd) ⭐ 33,998 *(archived)*
Atlassian's original drag-and-drop library. Archived but still widely referenced for beautiful physics-based animations.
**Why useful:** Great source for drag animation patterns and accessibility patterns.
**Tags:** #drag-drop #react #animation #archived

---

## State Management & Data Fetching

### 9. [pmndrs/zustand](https://github.com/pmndrs/zustand) ⭐ 58,095
A tiny, fast, scalable React state management library using hooks. No providers, no boilerplate. Only 1kb.
**Why useful:** Perfect for client-side state like active timers, UI mode, and user session in GlowUp.
**Tags:** #state-management #react #hooks #lightweight

---

### 10. [TanStack/query](https://github.com/TanStack/query) ⭐ 49,489
Powerful async state management — handles caching, background sync, pagination, and server state for React.
**Why useful:** Replaces manual fetch/useEffect patterns when calling Next.js API routes for GlowUp's health and focus data.
**Tags:** #data-fetching #cache #react #async #server-state

---

## Forms & Validation

### 11. [react-hook-form/react-hook-form](https://github.com/react-hook-form/react-hook-form) ⭐ 44,725
The lightest, fastest React form library. Uses uncontrolled components and hooks — zero re-renders on input change.
**Why useful:** GlowUp's profile setup, routine creation, and goal forms.
**Tags:** #forms #react #hooks #validation

---

### 12. [colinhacks/zod](https://github.com/colinhacks/zod) ⭐ 42,751
TypeScript-first schema validation with static type inference. Define a schema once — get both runtime validation and TS types.
**Why useful:** Validate API inputs in Next.js route handlers; pairs with react-hook-form via `@hookform/resolvers`.
**Tags:** #validation #typescript #schema #zod

---

## Charts & Visualization

### 13. [recharts/recharts](https://github.com/recharts/recharts) ⭐ 27,157
A chart library rebuilt with React and D3. Composable, declarative API. Line, bar, area, pie, radar charts. Already in GlowUp.
**Why useful:** Reference for advanced customization of GlowUp's health and focus charts.
**Tags:** #charts #d3 #react #data-visualization

---

## Animations & Visual Effects

### 14. [framer/motion](https://github.com/framer/motion) ⭐ ~24,000
Framer Motion — a production-ready motion library for React. Declarative animations, gestures, drag, scroll, and layout animations. Already in GlowUp.
**Why useful:** Power achievement unlocks, level-up screens, and page transitions.
**Tags:** #animation #react #framer #motion #gestures

---

### 15. [catdad/canvas-confetti](https://github.com/catdad/canvas-confetti) ⭐ 12,582
High-performance confetti animation library on HTML canvas — fireworks, snow, confetti bursts. Already in GlowUp.
**Why useful:** Reference for advanced burst patterns when users hit streaks or achievements.
**Tags:** #animation #confetti #canvas #celebration

---

### 16. [tsparticles/tsparticles](https://github.com/tsparticles/tsparticles) ⭐ 8,836
Highly customizable particle/confetti/fireworks animation engine with first-class React components.
**Why useful:** Level-up screens, rank reveal animations, dynamic backgrounds in GlowUp.
**Tags:** #particles #animation #react #fireworks #confetti

---

## Authentication

### 17. [nextauthjs/next-auth](https://github.com/nextauthjs/next-auth) ⭐ 28,243
Full-featured authentication for Next.js. Supports OAuth (Google, GitHub, Discord), magic links, and credentials. Works with Prisma adapter.
**Why useful:** Add user accounts to GlowUp so users can sync progress across devices.
**Tags:** #auth #nextjs #oauth #prisma #sessions

---

## Full-Stack Boilerplates & Starters

### 18. [t3-oss/create-t3-app](https://github.com/t3-oss/create-t3-app) ⭐ 28,935
CLI that scaffolds a full-stack Next.js app with TypeScript, Tailwind, Prisma, NextAuth, and tRPC — all wired together.
**Why useful:** GlowUp's stack is nearly identical. Best reference architecture for project structure.
**Tags:** #starter #nextjs #typescript #prisma #trpc #tailwind #boilerplate

---

### 19. [ixartz/SaaS-Boilerplate](https://github.com/ixartz/SaaS-Boilerplate) ⭐ 7,105
Production-ready SaaS starter with Next.js, Tailwind, shadcn UI, TypeScript, Auth, multi-tenancy, roles, i18n, and logging.
**Why useful:** If GlowUp goes multi-user or commercial, this is the template to build from.
**Tags:** #saas #starter #nextjs #multi-tenancy #boilerplate

---

### 20. [shadcn-ui/taxonomy](https://github.com/shadcn-ui/taxonomy) ⭐ 19,231
Reference open-source app built with Next.js 13 App Router, server components, Prisma, Tailwind, shadcn, and NextAuth.
**Why useful:** Real-world reference for wiring up the exact same stack as GlowUp.
**Tags:** #reference #nextjs #prisma #shadcn #app-router

---

## Face Detection & AI Vision

### 21. [justadudewhohacks/face-api.js](https://github.com/justadudewhohacks/face-api.js) ⭐ 17,850
JavaScript API for face detection and recognition in the browser and Node.js — built on TensorFlow.js. Detects faces, landmarks, age, emotion, and gender.
**Why useful:** This IS the library in GlowUp. Deep dive models and config options here.
**Tags:** #face-detection #tensorflow #ai #computer-vision #browser

---

## AI Agents & Claude SDK

### 22. [ghostwright/phantom](https://github.com/ghostwright/phantom) ⭐ 1,422
An AI co-worker with its own computer — self-evolving, persistent memory, MCP server, secure credential collection. Built on the Claude Agent SDK.
**Why useful:** Inspiration for adding an AI coach to GlowUp that remembers goals and gives personalized advice.
**Tags:** #ai #claude #agents #mcp #anthropic

---

## Quick Reference Table

| # | Repo | Stars | Category |
|---|------|-------|----------|
| 1 | shadcn-ui/ui | 114,875 | UI Components |
| 2 | tailwindlabs/tailwindcss | 95,091 | CSS Framework |
| 3 | pmndrs/zustand | 58,095 | State Management |
| 4 | TanStack/query | 49,489 | Data Fetching |
| 5 | prisma/prisma | 46,007 | ORM / Database |
| 6 | react-hook-form/react-hook-form | 44,725 | Forms |
| 7 | colinhacks/zod | 42,751 | Validation |
| 8 | atlassian/react-beautiful-dnd | 33,998 | Drag & Drop |
| 9 | nextauthjs/next-auth | 28,243 | Authentication |
| 10 | t3-oss/create-t3-app | 28,935 | Boilerplate |
| 11 | recharts/recharts | 27,157 | Charts |
| 12 | lucide-icons/lucide | 22,709 | Icons |
| 13 | birobirobiro/awesome-shadcn-ui | 19,593 | Resources |
| 14 | shadcn-ui/taxonomy | 19,231 | Reference App |
| 15 | justadudewhohacks/face-api.js | 17,850 | Face Recognition |
| 16 | clauderic/dnd-kit | 17,148 | Drag & Drop |
| 17 | tsparticles/tsparticles | 8,836 | Animations |
| 18 | ixartz/SaaS-Boilerplate | 7,105 | Boilerplate |
| 19 | prettier-plugin-tailwindcss | 7,083 | Dev Tools |
| 20 | tailwindcss-typography | 6,376 | CSS Plugin |
| 21 | catdad/canvas-confetti | 12,582 | Animations |
| 22 | ghostwright/phantom | 1,422 | AI / Claude |

---

*To add to Obsidian: copy this file into your vault's notes folder.*
