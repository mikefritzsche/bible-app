# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts Next.js App Router entry points and client components responsible for bible reading flows.
- `components/` keeps reusable UI pieces; complex panels live under `components/panels/`.
- `lib/` contains domain logic managers (BibleParser, StrongsManager) plus contexts under `lib/contexts/`; shared TypeScript types live in `types/`.
- `electron/` wraps the desktop shell; `public/` holds icons and static assets.
- Feature tests live in `components/__tests__/` and `lib/__tests__/`; docs and scripts reside in `docs/` and `scripts/`.

## Build, Test & Development Commands
- `npm install` installs dependencies; rerun after pulling package updates.
- `npm run dev` launches the Next.js dev server on `localhost:3000`; pair with `npm run electron-dev` for desktop preview.
- `npm run build` generates the production bundle into `.next/` and `out/`.
- `npm run start` serves the built app; `npm run dist` builds Electron binaries into `dist/`.
- `npm run lint` runs ESLint; `npm test`, `npm run test:watch`, and `npm run test:coverage` execute Jest suites.

## Coding Style & Naming Conventions
- TypeScript is required; favor functional React components in `.tsx`.
- Use two-space indentation, const-first declarations, and early returns to match existing code.
- Name components and hooks with PascalCase (e.g., `ParallelScrollView`), helper utilities with camelCase, and domain models with descriptive TypeScript interfaces.
- Run `npm run lint` before pushing; ESLint inherits Next.js defaults and Tailwind plugin rules.

## Testing Guidelines
- Jest with the jsdom environment and Testing Library drive UI tests.
- Keep tests alongside source under `__tests__` directories; follow the `*.test.ts` and `*.test.tsx` naming pattern.
- Validate new features with `npm test`; add coverage-sensitive assertions when touching parser or manager logic and check thresholds via `npm run test:coverage`.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as in recent history to drive changelog automation.
- Each PR should include a concise summary, linked issue or task reference, verification notes (commands run), and UI screenshots or clips when altering visible behavior.
- Request review once CI is green and conflicts resolved; mention any follow-up work or data migrations in the PR body.
