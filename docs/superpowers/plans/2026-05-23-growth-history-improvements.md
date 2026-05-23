# Growth History Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve scoring prompts, add an aggregated ability snapshot visualization, and let users click historical training records to review questions, answers, evaluations, and follow-up turns.

**Architecture:** Keep the existing Next.js App Router and Supabase schema. Fetch historical details through Supabase nested selects from `training_sessions` to related question, response, evaluation, and follow-up tables. Keep interactive history review inside the existing `GrowthDashboard` client component.

**Tech Stack:** Next.js App Router, React client component state, Supabase JS nested select, Vitest + Testing Library.

---

### Task 1: Strengthen Scoring Prompts

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Test: `src/lib/ai/prompts.test.ts`

- [x] Add a failing test that expects evaluation prompts to include concrete 0-20 scoring criteria and evidence requirements.
- [x] Update `buildEvaluationPrompt` with dimension scoring principles.
- [x] Run `npm test -- src/lib/ai/prompts.test.ts`.

### Task 2: Ability Snapshot Visualization

**Files:**
- Create: `src/lib/training/analytics.ts`
- Test: `src/lib/training/analytics.test.ts`
- Modify: `src/components/history/growth-dashboard.tsx`
- Test: `src/components/history/growth-dashboard.test.tsx`

- [x] Add failing analytics tests for grouping snapshots by ability, calculating average/latest scores, and trend.
- [x] Implement the analytics helper.
- [x] Render aggregated ability bars with labels, latest score, average score, and trend.
- [x] Run analytics and dashboard tests.

### Task 3: Clickable History Detail Review

**Files:**
- Modify: `src/app/history/page.tsx`
- Modify: `src/components/history/growth-dashboard.tsx`
- Test: `src/components/history/growth-dashboard.test.tsx`

- [x] Add failing dashboard test that clicks a historical title and sees the prior answer plus interview follow-up.
- [x] Expand Supabase nested select to include `session_questions`, `user_responses`, `evaluations`, and `followup_turns`.
- [x] Add a same-page detail panel in `GrowthDashboard`.
- [x] Run `npm test -- src/components/history/growth-dashboard.test.tsx`.

### Task 4: Final Verification

- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
