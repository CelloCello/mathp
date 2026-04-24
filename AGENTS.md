# AGENTS.md

## Commands

- Use `pnpm` only; `package.json` pins `pnpm@10.15.1` and the lockfile is `pnpm-lock.yaml`.
- CI installs with `pnpm install --frozen-lockfile` and runs only `pnpm build` before GitHub Pages deploy.
- Local dev server: `pnpm dev`.
- Full tests: `pnpm test` (`vitest run`, Node test environment, `src/**/*.test.{js,jsx,ts,tsx}`).
- Focused test: `pnpm exec vitest run src/game/session.test.js` or another specific test file.
- There are no lint, formatter, or typecheck scripts in this repo; do not invent one as required verification.
- Use Node compatible with Vite 7/Vitest 4; CI uses Node 20, and the lockfile dependencies require modern Node 20+.

## App Shape

- This is a single-package React 18 + Vite app, not a monorepo.
- `src/main.jsx` imports `katex/dist/katex.min.css`, `src/index.css`, and renders `src/App.jsx`.
- `App.jsx` owns the fixed flow: `MENU -> UNIT -> SETTINGS -> PLAYING -> SUMMARY`.
- GitHub Pages deploy expects Vite `base: '/mathp/'`; do not remove it unless the deploy target changes.

## Question System

- The executable source of truth for categories/units is `src/game/categories.js`; the README may lag behind the actual unit list.
- Add or change units by returning objects with `id`, `name`, `description`, and `generateQuestion()` from `categories.js`.
- `createQuestionSet(categoryId, unitId, totalQuestions)` in `src/game/session.js` calls the selected unit generator for each question.
- Questions must expose `text`, `inputMode`, optional display metadata, and `evaluate(rawInput)`; `PlayScreen` advances only when `validationError` is null.
- Reuse `createNumberQuestion`, `createChoiceQuestion`, and `createFractionQuestion` from `src/game/questionFactories.js` before adding a new input mode.
- If adding a new `inputMode`, update `src/components/PlayScreen.jsx`, result display in `src/components/SummaryScreen.jsx`, factories/utilities, and tests together.

## Fractions And Math Rendering

- Fraction direct input accepts only integer `n`, fraction `a/b`, or mixed number `w a/b`; structured fraction UI serializes to those same strings.
- Fraction equivalence can still be wrong when `requiredKind` demands a specific answer format; tests assert this behavior via `note` messages.
- `createFractionQuestion` attaches `fractionSpec`; `FractionAnswerForm` uses it to choose integer/fraction/mixed structured entry modes.
- Use `MathContent` for question, answer, and feedback text that may contain fractions or arithmetic symbols; it converts detected math to KaTeX markup.
- Integer order-of-operations questions use expression AST helpers in `src/game/expressionUtils.js` and render through `meta.renderKind: 'expression'` plus `meta.mathModel`.

## Testing Notes

- Tests use Vitest with `node:assert/strict`, not React Testing Library.
- Generator tests sample hundreds of random questions to prove reachable patterns; update those loops when changing random generation constraints.
- For question contract changes, run at least the affected focused test and then `pnpm test`; run `pnpm build` before considering deploy-related work complete.
