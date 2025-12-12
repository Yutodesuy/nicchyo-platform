# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router entry. Public routes live under `app/(public)/` (e.g., `map`, `posts`, `recipes`, `search`, `user`). Shared UI sits in `app/components/`. Global styles in `app/globals.css`.
- `public/`: Static assets (images, maps).
- `docs/`: Product and feature specs (map, kotodute, event, recipe).
- `prisma/`, `lib/`, `styles/`: Backend schema, shared libs, Tailwind setup.
- Build output `.next/` and dependencies `node_modules/` should stay untracked.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server (auto selects free port if 3000 busy).
- `npm run build`: Production build; runs type checks.
- `npm run lint`: Next.js ESLint runner (interactive setup if `.eslintrc` absent). Prefer to add an eslint config before use.

## Coding Style & Naming Conventions
- TypeScript + React (Next.js). Keep components under `app/.../components`.
- Tailwind CSS for styling; custom palette in `tailwind.config.js`.
- Prefer functional components, hooks, and Next.js conventions (client components with `"use client"` when needed).
- File/route names: use kebab-case for routes, PascalCase for components, camelCase for variables/functions.

## Testing Guidelines
- No automated tests configured. If adding tests, align with Next.js/React best practices (e.g., Vitest/React Testing Library). Name test files `*.test.ts[x]`.
- Manual: run `npm run build` before PR to catch type/route issues.

## Commit & Pull Request Guidelines
- Commit messages: short imperative summary (e.g., `Add user popup`, `Fix map banner swipe`).
- Before committing: ensure `npm run build` passes; remove `.next/` from staging.
- PRs: describe scope, list key changes, note any UI impacts (screenshots optional but helpful), and link issues if applicable. Mention breaking changes or new env/config steps.

## Security & Configuration Tips
- Secrets/env: keep `.env*` out of git; follow `.gitignore`.
- Image/assets: store in `public/` to allow static serving; avoid committing large binaries unless necessary.
- Route conflicts: avoid duplicate routes (e.g., `app/map` vs `app/(public)/map`); keep a single source of truth under `app/(public)/map`.

## Seasonal & Campaign Management (Recipes)
- Seasonal headings/descriptions are derived from current month (`spring/summer/autumn/winter`) in `app/(public)/recipes/RecipesClient.tsx`. Update `seasonHeading`/`seasonDesc` for copy changes.
- Seasonal select list is static (`seasonalSelect`). To run a campaign (e.g., “冬のあったか”を春に差し替え), edit that array or inject data from an admin/source of truth.
- If you need strict control (e.g., “トップに出す投稿者/レシピ”), plan an admin feed or JSON config consumed by RecipesClient; current UI shows a placeholder note only.
- Suggested table/config for seasonal collections:
  - `id`, `title` (例: 冬のあったか土佐ごはん), `description`, `recipeIds[]`, `startDate`, `endDate`.
  - Display logic: choose the collection whose date range contains “today”; if none, fall back to a default (例: 通年の人気レシピ).
