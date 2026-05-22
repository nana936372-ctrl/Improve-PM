# AI PM Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive Next.js MVP for AI 产品经理思维训练 with Supabase Auth/Postgres, OpenAI-compatible AI generation/evaluation, choice questions, case deep training, and growth tracking.

**Architecture:** Use Next.js App Router as the full-stack application. Supabase handles authentication and user-scoped persistence with RLS. Server-only route handlers construct prompts, call OpenAI-compatible chat completions, validate JSON responses, and persist training records.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Supabase Auth/Postgres, `@supabase/ssr`, `@supabase/supabase-js`, Zod, Vitest, Testing Library, Playwright.

---

## File Structure

Create or modify these files:

- `package.json`: scripts, dependencies, test tooling.
- `next.config.ts`: Next.js config.
- `tsconfig.json`: TypeScript config.
- `postcss.config.mjs`: Tailwind PostCSS integration.
- `tailwind.config.ts`: Tailwind content and theme.
- `vitest.config.ts`: unit/component test config.
- `playwright.config.ts`: browser test config.
- `.env.example`: required Supabase and AI provider env vars.
- `README.md`: setup, Supabase, AI config, Vercel deployment.
- `supabase/migrations/0001_initial_schema.sql`: tables, indexes, triggers, RLS policies.
- `src/middleware.ts`: Supabase SSR session refresh/protection.
- `src/app/layout.tsx`: root layout and global shell.
- `src/app/globals.css`: global styling and responsive polish.
- `src/app/page.tsx`: redirect to dashboard or auth.
- `src/app/auth/page.tsx`: login/register UI.
- `src/app/dashboard/page.tsx`: training workbench.
- `src/app/history/page.tsx`: growth records and trends.
- `src/app/settings/page.tsx`: AI model configuration.
- `src/app/api/ai/generate-question/route.ts`: question generation endpoint.
- `src/app/api/ai/evaluate/route.ts`: answer evaluation endpoint.
- `src/app/api/ai/followup/route.ts`: follow-up question endpoint.
- `src/app/api/ai/reference-answer/route.ts`: final reference answer endpoint.
- `src/app/api/sessions/route.ts`: session persistence endpoint.
- `src/app/api/sessions/[id]/route.ts`: session detail/update endpoint.
- `src/components/auth/auth-form.tsx`: auth form client component.
- `src/components/layout/app-nav.tsx`: top navigation.
- `src/components/training/training-workbench.tsx`: main training interaction.
- `src/components/training/question-card.tsx`: question rendering.
- `src/components/training/answer-composer.tsx`: choice/text answer input.
- `src/components/training/evaluation-panel.tsx`: score and feedback panel.
- `src/components/training/followup-panel.tsx`: follow-up rounds.
- `src/components/history/growth-dashboard.tsx`: trend and history display.
- `src/components/settings/ai-settings-form.tsx`: AI config form.
- `src/lib/ai/client.ts`: OpenAI-compatible request wrapper.
- `src/lib/ai/prompts.ts`: prompt templates.
- `src/lib/ai/schemas.ts`: Zod schemas for AI JSON.
- `src/lib/ai/json.ts`: JSON extraction/repair helpers.
- `src/lib/auth/guards.ts`: server-side auth helpers.
- `src/lib/constants/abilities.ts`: ability dimensions and labels.
- `src/lib/scoring/choice.ts`: choice scoring logic.
- `src/lib/supabase/browser.ts`: browser Supabase client.
- `src/lib/supabase/server.ts`: server Supabase client.
- `src/lib/types/training.ts`: shared training domain types.
- `src/lib/utils.ts`: small class/style helpers.
- `src/test/setup.ts`: test setup.
- `src/**/*.test.ts` and `src/**/*.test.tsx`: focused tests beside implementation files.
- `tests/e2e/training.spec.ts`: Playwright smoke flow.

---

### Task 1: Scaffold Next.js Project And Tooling

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/lib/utils.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "ai-pm-trainer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.49.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create core config files**

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```js
// postcss.config.mjs
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
```

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        muted: "#666f7a",
        panel: "#f7f8fa",
        line: "#dce1e7",
        brand: "#2563eb",
        success: "#16803c",
        warning: "#a35d00",
        danger: "#b42318"
      }
    }
  },
  plugins: []
};

export default config;
```

- [ ] **Step 3: Create test config**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
```

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ]
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Create utility helper**

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
```

- [ ] **Step 5: Update `.gitignore`**

```gitignore
.superpowers/
.next/
node_modules/
.env.local
.env*.local
dist/
coverage/
playwright-report/
test-results/
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 7: Run baseline checks**

Run: `npm run typecheck`

Expected: TypeScript fails only if `next-env.d.ts` is not generated yet. If so, run `npm run dev` once, stop it, then rerun `npm run typecheck`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts vitest.config.ts playwright.config.ts src/test/setup.ts src/lib/utils.ts .gitignore
git commit -m "chore: scaffold Next.js tooling"
```

---

### Task 2: Define Supabase Schema And RLS

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `src/lib/constants/abilities.ts`
- Create: `src/lib/types/training.ts`

- [ ] **Step 1: Create ability constants**

```ts
// src/lib/constants/abilities.ts
export const ABILITY_DIMENSIONS = [
  {
    key: "user_insight",
    label: "用户与业务洞察",
    description: "理解用户、场景、业务目标和真实约束"
  },
  {
    key: "problem_framing",
    label: "问题定义与目标拆解",
    description: "把模糊需求拆成清晰问题、目标和优先级"
  },
  {
    key: "ai_boundary",
    label: "AI 能力边界判断",
    description: "判断模型能力、幻觉、数据依赖和技术适用边界"
  },
  {
    key: "solution_tradeoff",
    label: "方案设计与取舍",
    description: "提出可落地方案，并说明关键取舍"
  },
  {
    key: "metrics_experiment",
    label: "指标与实验设计",
    description: "定义指标、评估方法和实验路径"
  },
  {
    key: "risk_governance",
    label: "风险、伦理与治理",
    description: "识别安全、合规、隐私、偏见和体验风险"
  }
] as const;

export type AbilityKey = (typeof ABILITY_DIMENSIONS)[number]["key"];

export const ABILITY_KEYS = ABILITY_DIMENSIONS.map((item) => item.key);
```

- [ ] **Step 2: Create shared domain types**

```ts
// src/lib/types/training.ts
import type { AbilityKey } from "@/lib/constants/abilities";

export type QuestionType = "single_choice" | "multiple_choice" | "case_analysis";
export type TrainingStatus = "draft" | "generated" | "answered" | "evaluated" | "completed";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export type ChoiceOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
};

export type DimensionScore = {
  key: AbilityKey;
  score: number;
  maxScore: number;
  evidence: string;
  advice: string;
};

export type TrainingQuestion = {
  type: QuestionType;
  title: string;
  prompt: string;
  scenario?: string;
  options?: ChoiceOption[];
  correctOptions?: string[];
  abilityKeys: AbilityKey[];
  difficulty: Difficulty;
  rubric?: string;
};

export type EvaluationResult = {
  overallScore: number;
  dimensionScores: DimensionScore[];
  strengths: string[];
  gaps: string[];
  advice: string;
  optionAnalysis?: Record<string, string>;
  followupQuestion?: string;
};
```

- [ ] **Step 3: Write Supabase migration**

```sql
-- supabase/migrations/0001_initial_schema.sql
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  target_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  base_url text,
  model text,
  default_followup_rounds integer not null default 2 check (default_followup_rounds between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_type text not null check (question_type in ('single_choice', 'multiple_choice', 'case_analysis')),
  status text not null default 'draft' check (status in ('draft', 'generated', 'answered', 'evaluated', 'completed')),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  ability_keys text[] not null default '{}',
  title text not null,
  overall_score integer check (overall_score between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_type text not null,
  title text not null,
  prompt text not null,
  scenario text,
  options jsonb,
  correct_options text[],
  rubric jsonb,
  reference_answer jsonb,
  ai_metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.user_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  selected_options text[],
  text_answer text,
  is_draft boolean not null default true,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  overall_score integer not null check (overall_score between 0 and 100),
  dimension_scores jsonb not null,
  strengths jsonb not null default '[]',
  gaps jsonb not null default '[]',
  advice text not null,
  option_analysis jsonb,
  raw_ai_response jsonb,
  created_at timestamptz not null default now()
);

create table public.followup_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_index integer not null check (turn_index between 1 and 3),
  question text not null,
  intent text,
  user_answer text,
  supplemental_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, turn_index)
);

create table public.ability_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ability_key text not null,
  score integer not null check (score between 0 and 20),
  max_score integer not null default 20,
  created_at timestamptz not null default now()
);

create index training_sessions_user_created_idx on public.training_sessions(user_id, created_at desc);
create index ability_snapshots_user_created_idx on public.ability_snapshots(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.ai_settings enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.user_responses enable row level security;
alter table public.evaluations enable row level security;
alter table public.followup_turns enable row level security;
alter table public.ability_snapshots enable row level security;

create policy "profiles are owned by user" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "ai settings are owned by user" on public.ai_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "training sessions are owned by user" on public.training_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "session questions are owned by user" on public.session_questions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "responses are owned by user" on public.user_responses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "evaluations are owned by user" on public.evaluations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "followups are owned by user" on public.followup_turns
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "ability snapshots are owned by user" on public.ability_snapshots
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

- [ ] **Step 4: Apply migration in Supabase**

Run: `supabase db push`

Expected: migration applies without SQL errors. If using Supabase Dashboard instead of CLI, run the SQL in the SQL editor and verify all tables have RLS enabled.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_initial_schema.sql src/lib/constants/abilities.ts src/lib/types/training.ts
git commit -m "feat: add Supabase training schema"
```

---

### Task 3: Configure Supabase Clients And Auth Guards

**Files:**
- Create: `.env.example`
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/auth/guards.ts`
- Create: `src/middleware.ts`
- Create: `src/lib/auth/guards.test.ts`

- [ ] **Step 1: Create `.env.example`**

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=
AI_MODEL=gpt-4.1-mini
```

- [ ] **Step 2: Create browser Supabase client**

```ts
// src/lib/supabase/browser.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase browser environment variables");
  }

  return createBrowserClient(url, anonKey);
}
```

- [ ] **Step 3: Create server Supabase client**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; middleware refreshes sessions.
        }
      }
    }
  });
}
```

- [ ] **Step 4: Create auth guard**

```ts
// src/lib/auth/guards.ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user;
}
```

- [ ] **Step 5: Create middleware**

```ts
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/history", "/settings"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
```

- [ ] **Step 6: Write guard test**

```ts
// src/lib/auth/guards.test.ts
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  })
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: null })
    }
  }))
}));

describe("requireUser", () => {
  it("redirects anonymous users to auth", async () => {
    const { requireUser } = await import("./guards");
    await expect(requireUser()).rejects.toThrow("redirect:/auth");
  });
});
```

- [ ] **Step 7: Run test**

Run: `npm run test -- src/lib/auth/guards.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add .env.example src/lib/supabase/browser.ts src/lib/supabase/server.ts src/lib/auth/guards.ts src/middleware.ts src/lib/auth/guards.test.ts
git commit -m "feat: add Supabase auth plumbing"
```

---

### Task 4: Build Auth Pages And App Shell

**Files:**
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/auth/page.tsx`
- Create: `src/app/auth/signout/route.ts`
- Create: `src/components/auth/auth-form.tsx`
- Create: `src/components/layout/app-nav.tsx`
- Create: `src/components/auth/auth-form.test.tsx`

- [ ] **Step 1: Create global styles**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  background: #f5f7fb;
  color: #171717;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f5f7fb;
  font-family: Arial, "Microsoft YaHei", sans-serif;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

- [ ] **Step 2: Create root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 产品经理思维训练器",
  description: "训练 AI 产品经理的业务理解、方案设计、指标和风险治理能力"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create app navigation**

```tsx
// src/components/layout/app-nav.tsx
import Link from "next/link";
import { LogOut, Settings, TrendingUp, Dumbbell } from "lucide-react";

export function AppNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="font-semibold text-ink">
          AI PM Trainer
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="flex items-center gap-1 rounded px-3 py-2 hover:bg-panel" href="/dashboard">
            <Dumbbell size={16} /> 训练
          </Link>
          <Link className="flex items-center gap-1 rounded px-3 py-2 hover:bg-panel" href="/history">
            <TrendingUp size={16} /> 成长
          </Link>
          <Link className="flex items-center gap-1 rounded px-3 py-2 hover:bg-panel" href="/settings">
            <Settings size={16} /> 设置
          </Link>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-1 rounded px-3 py-2 hover:bg-panel" type="submit">
              <LogOut size={16} /> 退出
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create auth form**

```tsx
// src/components/auth/auth-form.tsx
"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function AuthForm() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">AI 产品经理思维训练器</h1>
      <p className="mt-2 text-sm text-muted">登录后开始训练你的 AI 产品判断力。</p>
      <form className="mt-6 grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 text-sm">
          邮箱
          <input className="rounded border border-line px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label className="grid gap-2 text-sm">
          密码
          <input className="rounded border border-line px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={6} required />
        </label>
        {message ? <p className="rounded bg-red-50 px-3 py-2 text-sm text-danger">{message}</p> : null}
        <button className="rounded bg-brand px-4 py-2 text-white disabled:opacity-60" disabled={isLoading} type="submit">
          {isLoading ? "处理中..." : mode === "login" ? "登录" : "注册"}
        </button>
      </form>
      <button className="mt-4 text-sm text-brand" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Create pages**

```tsx
// src/app/auth/page.tsx
import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthForm />
    </main>
  );
}
```

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/auth");
}
```

```ts
// src/app/auth/signout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/auth", request.url));
}
```

- [ ] **Step 6: Write auth form test**

```tsx
// src/components/auth/auth-form.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthForm } from "./auth-form";

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn()
    }
  })
}));

describe("AuthForm", () => {
  it("renders login controls", () => {
    render(<AuthForm />);
    expect(screen.getByRole("heading", { name: "AI 产品经理思维训练器" })).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run tests**

Run: `npm run test -- src/components/auth/auth-form.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/app/page.tsx src/app/auth/page.tsx src/app/auth/signout/route.ts src/components/auth/auth-form.tsx src/components/layout/app-nav.tsx src/components/auth/auth-form.test.tsx
git commit -m "feat: add authentication UI"
```

---

### Task 5: Implement AI Schemas, JSON Helpers, And Choice Scoring

**Files:**
- Create: `src/lib/ai/schemas.ts`
- Create: `src/lib/ai/json.ts`
- Create: `src/lib/scoring/choice.ts`
- Create: `src/lib/ai/schemas.test.ts`
- Create: `src/lib/ai/json.test.ts`
- Create: `src/lib/scoring/choice.test.ts`

- [ ] **Step 1: Create AI output schemas**

```ts
// src/lib/ai/schemas.ts
import { z } from "zod";
import { ABILITY_KEYS } from "@/lib/constants/abilities";

const abilityKeySchema = z.enum(ABILITY_KEYS as [string, ...string[]]);

export const choiceOptionSchema = z.object({
  id: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1)
});

export const generatedQuestionSchema = z.object({
  type: z.enum(["single_choice", "multiple_choice", "case_analysis"]),
  title: z.string().min(1),
  prompt: z.string().min(1),
  scenario: z.string().optional(),
  options: z.array(choiceOptionSchema).optional(),
  correctOptions: z.array(z.enum(["A", "B", "C", "D"])).optional(),
  abilityKeys: z.array(abilityKeySchema).min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  rubric: z.string().optional()
});

export const evaluationSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  dimensionScores: z.array(
    z.object({
      key: abilityKeySchema,
      score: z.number().int().min(0).max(20),
      maxScore: z.number().int().min(1).max(20),
      evidence: z.string().min(1),
      advice: z.string().min(1)
    })
  ),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  advice: z.string().min(1),
  optionAnalysis: z.record(z.string()).optional(),
  followupQuestion: z.string().optional()
});

export const followupSchema = z.object({
  question: z.string().min(1),
  intent: z.string().min(1),
  expectedSupplement: z.string().min(1)
});

export const referenceAnswerSchema = z.object({
  outline: z.array(z.string()).min(1),
  sampleAnswer: z.string().min(1),
  commonMistakes: z.array(z.string()),
  nextTrainingAdvice: z.string().min(1)
});
```

- [ ] **Step 2: Create JSON extraction helper**

```ts
// src/lib/ai/json.ts
export function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);

  throw new Error("AI response did not contain a JSON object");
}

export function parseAiJson<T>(text: string, schema: { parse: (value: unknown) => T }) {
  const json = extractJsonObject(text);
  const parsed = JSON.parse(json);
  return schema.parse(parsed);
}
```

- [ ] **Step 3: Create choice scoring**

```ts
// src/lib/scoring/choice.ts
export type ChoiceScoreInput = {
  selectedOptions: string[];
  correctOptions: string[];
  maxScore?: number;
};

export function scoreChoiceAnswer({ selectedOptions, correctOptions, maxScore = 100 }: ChoiceScoreInput) {
  const selected = new Set(selectedOptions);
  const correct = new Set(correctOptions);

  if (correct.size === 0) return 0;

  let right = 0;
  let wrong = 0;
  for (const option of selected) {
    if (correct.has(option)) right += 1;
    else wrong += 1;
  }

  const raw = (right - wrong) / correct.size;
  return Math.max(0, Math.round(raw * maxScore));
}
```

- [ ] **Step 4: Write tests**

```ts
// src/lib/scoring/choice.test.ts
import { describe, expect, it } from "vitest";
import { scoreChoiceAnswer } from "./choice";

describe("scoreChoiceAnswer", () => {
  it("scores exact single choice", () => {
    expect(scoreChoiceAnswer({ selectedOptions: ["A"], correctOptions: ["A"] })).toBe(100);
  });

  it("penalizes wrong options in multiple choice", () => {
    expect(scoreChoiceAnswer({ selectedOptions: ["A", "C"], correctOptions: ["A", "B"] })).toBe(0);
  });

  it("gives partial credit for missing correct options", () => {
    expect(scoreChoiceAnswer({ selectedOptions: ["A"], correctOptions: ["A", "B"] })).toBe(50);
  });
});
```

```ts
// src/lib/ai/json.test.ts
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { extractJsonObject, parseAiJson } from "./json";

describe("AI JSON helpers", () => {
  it("extracts fenced JSON", () => {
    expect(extractJsonObject("```json\n{\"ok\":true}\n```")).toBe("{\"ok\":true}");
  });

  it("parses with schema", () => {
    const result = parseAiJson("{\"ok\":true}", z.object({ ok: z.boolean() }));
    expect(result.ok).toBe(true);
  });
});
```

```ts
// src/lib/ai/schemas.test.ts
import { describe, expect, it } from "vitest";
import { generatedQuestionSchema } from "./schemas";

describe("generatedQuestionSchema", () => {
  it("accepts a valid choice question", () => {
    const result = generatedQuestionSchema.parse({
      type: "single_choice",
      title: "指标选择",
      prompt: "哪个指标最适合作为知识库问答的首要质量指标？",
      options: [
        { id: "A", text: "回答准确率" },
        { id: "B", text: "按钮点击率" }
      ],
      correctOptions: ["A"],
      abilityKeys: ["metrics_experiment"],
      difficulty: "beginner"
    });
    expect(result.correctOptions).toEqual(["A"]);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm run test -- src/lib/ai src/lib/scoring`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/schemas.ts src/lib/ai/json.ts src/lib/scoring/choice.ts src/lib/ai/schemas.test.ts src/lib/ai/json.test.ts src/lib/scoring/choice.test.ts
git commit -m "feat: add AI response schemas and scoring"
```

---

### Task 6: Implement AI Client And Prompt Templates

**Files:**
- Create: `src/lib/ai/client.ts`
- Create: `src/lib/ai/prompts.ts`
- Create: `src/lib/ai/prompts.test.ts`

- [ ] **Step 1: Create OpenAI-compatible client**

```ts
// src/lib/ai/client.ts
export type AiConfig = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function resolveAiConfig(config: AiConfig) {
  const baseUrl = config.baseUrl || process.env.AI_BASE_URL;
  const apiKey = config.apiKey || process.env.AI_API_KEY;
  const model = config.model || process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error("AI provider is not configured");
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey, model };
}

export async function createChatCompletion(messages: ChatMessage[], config: AiConfig = {}) {
  const resolved = resolveAiConfig(config);
  const response = await fetch(`${resolved.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolved.apiKey}`
    },
    body: JSON.stringify({
      model: resolved.model,
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("AI response did not include message content");
  }

  return content;
}
```

- [ ] **Step 2: Create prompt templates**

```ts
// src/lib/ai/prompts.ts
import { ABILITY_DIMENSIONS, type AbilityKey } from "@/lib/constants/abilities";
import type { Difficulty, QuestionType } from "@/lib/types/training";

const rubricText = ABILITY_DIMENSIONS.map((item) => `${item.key}: ${item.label} - ${item.description}`).join("\n");

export function buildQuestionPrompt(input: {
  questionType: QuestionType;
  abilityKeys: AbilityKey[];
  difficulty: Difficulty;
  scenePreference?: string;
}) {
  return [
    {
      role: "system" as const,
      content: "你是严格的 AI 产品经理训练教练。只输出合法 JSON，不要输出 Markdown。"
    },
    {
      role: "user" as const,
      content: `生成一道 AI 产品经理训练题。
题型：${input.questionType}
能力维度：${input.abilityKeys.join(", ")}
难度：${input.difficulty}
场景偏好：${input.scenePreference || "AI 产品经理通用业务场景"}

能力维度定义：
${rubricText}

JSON 字段必须包含：type,title,prompt,abilityKeys,difficulty。
选择题必须包含 options 和 correctOptions。
案例题必须包含 scenario 和 rubric。`
    }
  ];
}

export function buildEvaluationPrompt(input: { question: unknown; answer: unknown }) {
  return [
    {
      role: "system" as const,
      content: "你是严格的 AI 产品经理面试官。根据 Rubric 评分，只输出合法 JSON。"
    },
    {
      role: "user" as const,
      content: `请评估用户答案。
题目：${JSON.stringify(input.question)}
用户答案：${JSON.stringify(input.answer)}

输出 JSON 字段：overallScore,dimensionScores,strengths,gaps,advice,optionAnalysis,followupQuestion。`
    }
  ];
}

export function buildFollowupPrompt(input: { question: unknown; evaluation: unknown; previousAnswers: unknown[] }) {
  return [
    { role: "system" as const, content: "你是 AI 产品经理面试官。只输出一个高质量追问的 JSON。" },
    {
      role: "user" as const,
      content: `基于以下上下文生成追问。
题目：${JSON.stringify(input.question)}
评分：${JSON.stringify(input.evaluation)}
历史追问回答：${JSON.stringify(input.previousAnswers)}

输出 JSON 字段：question,intent,expectedSupplement。`
    }
  ];
}

export function buildReferenceAnswerPrompt(input: { question: unknown; answer: unknown; evaluation: unknown; followups: unknown[] }) {
  return [
    { role: "system" as const, content: "你是 AI 产品经理训练导师。只输出合法 JSON。" },
    {
      role: "user" as const,
      content: `生成参考答案和复盘建议。
题目：${JSON.stringify(input.question)}
用户答案：${JSON.stringify(input.answer)}
评分：${JSON.stringify(input.evaluation)}
追问：${JSON.stringify(input.followups)}

输出 JSON 字段：outline,sampleAnswer,commonMistakes,nextTrainingAdvice。`
    }
  ];
}
```

- [ ] **Step 3: Write prompt test**

```ts
// src/lib/ai/prompts.test.ts
import { describe, expect, it } from "vitest";
import { buildQuestionPrompt } from "./prompts";

describe("buildQuestionPrompt", () => {
  it("includes question type and ability keys", () => {
    const messages = buildQuestionPrompt({
      questionType: "case_analysis",
      abilityKeys: ["ai_boundary"],
      difficulty: "intermediate"
    });
    expect(messages[1].content).toContain("case_analysis");
    expect(messages[1].content).toContain("ai_boundary");
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/lib/ai/prompts.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/client.ts src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts
git commit -m "feat: add AI client and prompts"
```

---

### Task 7: Build Training API Routes

**Files:**
- Create: `src/app/api/ai/generate-question/route.ts`
- Create: `src/app/api/ai/evaluate/route.ts`
- Create: `src/app/api/ai/followup/route.ts`
- Create: `src/app/api/ai/reference-answer/route.ts`

- [ ] **Step 1: Create question generation route**

```ts
// src/app/api/ai/generate-question/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { buildQuestionPrompt } from "@/lib/ai/prompts";
import { createChatCompletion } from "@/lib/ai/client";
import { parseAiJson } from "@/lib/ai/json";
import { generatedQuestionSchema } from "@/lib/ai/schemas";

const requestSchema = z.object({
  questionType: z.enum(["single_choice", "multiple_choice", "case_analysis"]),
  abilityKeys: z.array(z.string()).min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  scenePreference: z.string().optional(),
  aiConfig: z.object({ baseUrl: z.string().optional(), apiKey: z.string().optional(), model: z.string().optional() }).optional()
});

export async function POST(request: Request) {
  await requireUser();
  const input = requestSchema.parse(await request.json());
  const messages = buildQuestionPrompt(input as never);
  const content = await createChatCompletion(messages, input.aiConfig);
  const question = parseAiJson(content, generatedQuestionSchema);
  return NextResponse.json({ question });
}
```

- [ ] **Step 2: Create evaluation route**

```ts
// src/app/api/ai/evaluate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { buildEvaluationPrompt } from "@/lib/ai/prompts";
import { createChatCompletion } from "@/lib/ai/client";
import { parseAiJson } from "@/lib/ai/json";
import { evaluationSchema } from "@/lib/ai/schemas";

const requestSchema = z.object({
  question: z.unknown(),
  answer: z.unknown(),
  aiConfig: z.object({ baseUrl: z.string().optional(), apiKey: z.string().optional(), model: z.string().optional() }).optional()
});

export async function POST(request: Request) {
  await requireUser();
  const input = requestSchema.parse(await request.json());
  const messages = buildEvaluationPrompt({ question: input.question, answer: input.answer });
  const content = await createChatCompletion(messages, input.aiConfig);
  const evaluation = parseAiJson(content, evaluationSchema);
  return NextResponse.json({ evaluation });
}
```

- [ ] **Step 3: Create follow-up route**

```ts
// src/app/api/ai/followup/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { buildFollowupPrompt } from "@/lib/ai/prompts";
import { createChatCompletion } from "@/lib/ai/client";
import { parseAiJson } from "@/lib/ai/json";
import { followupSchema } from "@/lib/ai/schemas";

const requestSchema = z.object({
  question: z.unknown(),
  evaluation: z.unknown(),
  previousAnswers: z.array(z.unknown()).default([]),
  aiConfig: z.object({ baseUrl: z.string().optional(), apiKey: z.string().optional(), model: z.string().optional() }).optional()
});

export async function POST(request: Request) {
  await requireUser();
  const input = requestSchema.parse(await request.json());
  const messages = buildFollowupPrompt(input);
  const content = await createChatCompletion(messages, input.aiConfig);
  const followup = parseAiJson(content, followupSchema);
  return NextResponse.json({ followup });
}
```

- [ ] **Step 4: Create reference answer route**

```ts
// src/app/api/ai/reference-answer/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { buildReferenceAnswerPrompt } from "@/lib/ai/prompts";
import { createChatCompletion } from "@/lib/ai/client";
import { parseAiJson } from "@/lib/ai/json";
import { referenceAnswerSchema } from "@/lib/ai/schemas";

const requestSchema = z.object({
  question: z.unknown(),
  answer: z.unknown(),
  evaluation: z.unknown(),
  followups: z.array(z.unknown()).default([]),
  aiConfig: z.object({ baseUrl: z.string().optional(), apiKey: z.string().optional(), model: z.string().optional() }).optional()
});

export async function POST(request: Request) {
  await requireUser();
  const input = requestSchema.parse(await request.json());
  const messages = buildReferenceAnswerPrompt(input);
  const content = await createChatCompletion(messages, input.aiConfig);
  const referenceAnswer = parseAiJson(content, referenceAnswerSchema);
  return NextResponse.json({ referenceAnswer });
}
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ai/generate-question/route.ts src/app/api/ai/evaluate/route.ts src/app/api/ai/followup/route.ts src/app/api/ai/reference-answer/route.ts
git commit -m "feat: add AI training API routes"
```

---

### Task 8: Build Training Workbench UI

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/training/training-workbench.tsx`
- Create: `src/components/training/question-card.tsx`
- Create: `src/components/training/answer-composer.tsx`
- Create: `src/components/training/evaluation-panel.tsx`
- Create: `src/components/training/followup-panel.tsx`
- Create: `src/components/training/training-workbench.test.tsx`

- [ ] **Step 1: Create dashboard page**

```tsx
// src/app/dashboard/page.tsx
import { requireUser } from "@/lib/auth/guards";
import { AppNav } from "@/components/layout/app-nav";
import { TrainingWorkbench } from "@/components/training/training-workbench";

export default async function DashboardPage() {
  await requireUser();
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <TrainingWorkbench />
      </main>
    </>
  );
}
```

- [ ] **Step 2: Create question card**

```tsx
// src/components/training/question-card.tsx
import type { TrainingQuestion } from "@/lib/types/training";

export function QuestionCard({ question }: { question: TrainingQuestion | null }) {
  if (!question) {
    return <div className="rounded-lg border border-dashed border-line bg-white p-6 text-muted">选择训练配置后生成题目。</div>;
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <p className="text-xs uppercase text-muted">{question.type}</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">{question.title}</h2>
      {question.scenario ? <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{question.scenario}</p> : null}
      <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-ink">{question.prompt}</p>
    </section>
  );
}
```

- [ ] **Step 3: Create answer composer**

```tsx
// src/components/training/answer-composer.tsx
"use client";

import type { TrainingQuestion } from "@/lib/types/training";

export function AnswerComposer({
  question,
  answer,
  selectedOptions,
  onTextChange,
  onToggleOption
}: {
  question: TrainingQuestion | null;
  answer: string;
  selectedOptions: string[];
  onTextChange: (value: string) => void;
  onToggleOption: (value: string) => void;
}) {
  if (!question) return null;

  if (question.type === "case_analysis") {
    return (
      <textarea
        className="min-h-72 w-full resize-y rounded-lg border border-line bg-white p-4 leading-7 outline-none focus:border-brand"
        placeholder="写下你的产品分析、方案取舍、指标设计和风险治理思考..."
        value={answer}
        onChange={(event) => onTextChange(event.target.value)}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {question.options?.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onToggleOption(option.id)}
          className={`rounded-lg border p-4 text-left ${selectedOptions.includes(option.id) ? "border-brand bg-blue-50" : "border-line bg-white"}`}
        >
          <span className="font-semibold">{option.id}.</span> {option.text}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create evaluation and follow-up panels**

```tsx
// src/components/training/evaluation-panel.tsx
import type { EvaluationResult } from "@/lib/types/training";

export function EvaluationPanel({ evaluation }: { evaluation: EvaluationResult | null }) {
  if (!evaluation) {
    return <aside className="rounded-lg border border-line bg-white p-5 text-sm text-muted">提交答案后显示评分与反馈。</aside>;
  }

  return (
    <aside className="rounded-lg border border-line bg-white p-5">
      <div className="text-sm text-muted">总分</div>
      <div className="mt-1 text-4xl font-semibold text-ink">{evaluation.overallScore}</div>
      <div className="mt-5 grid gap-3">
        {evaluation.dimensionScores.map((item) => (
          <div key={item.key} className="rounded border border-line p-3">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{item.key}</span>
              <span>{item.score}/{item.maxScore}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{item.evidence}</p>
            <p className="mt-2 text-sm text-brand">{item.advice}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
```

```tsx
// src/components/training/followup-panel.tsx
export type FollowupTurn = {
  question: string;
  intent?: string;
  answer?: string;
};

export function FollowupPanel({ turns }: { turns: FollowupTurn[] }) {
  if (turns.length === 0) return null;

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h3 className="font-semibold text-ink">AI 面试官追问</h3>
      <div className="mt-4 grid gap-3">
        {turns.map((turn, index) => (
          <div key={`${turn.question}-${index}`} className="rounded border border-line p-3">
            <p className="text-sm font-medium">第 {index + 1} 轮：{turn.question}</p>
            {turn.intent ? <p className="mt-2 text-sm text-muted">追问意图：{turn.intent}</p> : null}
            {turn.answer ? <p className="mt-2 text-sm text-ink">回答：{turn.answer}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create training workbench**

```tsx
// src/components/training/training-workbench.tsx
"use client";

import { useEffect, useState } from "react";
import { ABILITY_DIMENSIONS, type AbilityKey } from "@/lib/constants/abilities";
import type { Difficulty, EvaluationResult, QuestionType, TrainingQuestion } from "@/lib/types/training";
import { AnswerComposer } from "./answer-composer";
import { EvaluationPanel } from "./evaluation-panel";
import { FollowupPanel, type FollowupTurn } from "./followup-panel";
import { QuestionCard } from "./question-card";

export function TrainingWorkbench() {
  const [questionType, setQuestionType] = useState<QuestionType>("case_analysis");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [abilityKey, setAbilityKey] = useState<AbilityKey>("ai_boundary");
  const [question, setQuestion] = useState<TrainingQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [followups, setFollowups] = useState<FollowupTurn[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("training-draft");
    if (saved) setAnswer(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("training-draft", answer);
  }, [answer]);

  async function generateQuestion() {
    setStatus("正在生成题目...");
    const response = await fetch("/api/ai/generate-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionType, difficulty, abilityKeys: [abilityKey] })
    });
    const data = await response.json();
    setQuestion(data.question);
    setEvaluation(null);
    setFollowups([]);
    setAnswer("");
    setSelectedOptions([]);
    setStatus("");
  }

  async function submitAnswer() {
    if (!question) return;
    setStatus("正在评分...");
    const response = await fetch("/api/ai/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        answer: question.type === "case_analysis" ? { textAnswer: answer } : { selectedOptions }
      })
    });
    const data = await response.json();
    setEvaluation(data.evaluation);
    setStatus("");
  }

  function toggleOption(option: string) {
    if (!question) return;
    if (question.type === "single_choice") {
      setSelectedOptions([option]);
      return;
    }
    setSelectedOptions((current) => (current.includes(option) ? current.filter((item) => item !== option) : [...current, option]));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr_360px]">
      <aside className="rounded-lg border border-line bg-white p-4">
        <h1 className="text-lg font-semibold text-ink">训练配置</h1>
        <label className="mt-4 grid gap-2 text-sm">
          题型
          <select className="rounded border border-line px-3 py-2" value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)}>
            <option value="case_analysis">案例深训</option>
            <option value="single_choice">单选快练</option>
            <option value="multiple_choice">多选快练</option>
          </select>
        </label>
        <label className="mt-4 grid gap-2 text-sm">
          能力维度
          <select className="rounded border border-line px-3 py-2" value={abilityKey} onChange={(e) => setAbilityKey(e.target.value as AbilityKey)}>
            {ABILITY_DIMENSIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label className="mt-4 grid gap-2 text-sm">
          难度
          <select className="rounded border border-line px-3 py-2" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="beginner">入门</option>
            <option value="intermediate">进阶</option>
            <option value="advanced">高阶</option>
          </select>
        </label>
        <button className="mt-5 w-full rounded bg-brand px-4 py-2 text-white" type="button" onClick={generateQuestion}>生成新题</button>
        {status ? <p className="mt-3 text-sm text-muted">{status}</p> : null}
      </aside>

      <section className="grid gap-4">
        <QuestionCard question={question} />
        <AnswerComposer question={question} answer={answer} selectedOptions={selectedOptions} onTextChange={setAnswer} onToggleOption={toggleOption} />
        <button className="rounded bg-ink px-4 py-2 text-white disabled:opacity-50" type="button" disabled={!question} onClick={submitAnswer}>提交评分</button>
        <FollowupPanel turns={followups} />
      </section>

      <EvaluationPanel evaluation={evaluation} />
    </div>
  );
}
```

- [ ] **Step 6: Write workbench smoke test**

```tsx
// src/components/training/training-workbench.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrainingWorkbench } from "./training-workbench";

describe("TrainingWorkbench", () => {
  it("renders training controls", () => {
    render(<TrainingWorkbench />);
    expect(screen.getByRole("heading", { name: "训练配置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成新题" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run tests**

Run: `npm run test -- src/components/training/training-workbench.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/training
git commit -m "feat: add training workbench UI"
```

---

### Task 9: Persist Sessions And Ability Snapshots

**Files:**
- Create: `src/app/api/sessions/route.ts`
- Create: `src/app/api/sessions/[id]/route.ts`
- Create: `src/lib/training/persistence.ts`
- Create: `src/lib/training/persistence.test.ts`
- Modify: `src/components/training/training-workbench.tsx`

- [ ] **Step 1: Create ability snapshot mapper**

```ts
// src/lib/training/persistence.ts
import type { EvaluationResult } from "@/lib/types/training";

export function buildAbilitySnapshots(sessionId: string, userId: string, evaluation: EvaluationResult) {
  return evaluation.dimensionScores.map((score) => ({
    session_id: sessionId,
    user_id: userId,
    ability_key: score.key,
    score: score.score,
    max_score: score.maxScore
  }));
}
```

- [ ] **Step 2: Test snapshot mapper**

```ts
// src/lib/training/persistence.test.ts
import { describe, expect, it } from "vitest";
import { buildAbilitySnapshots } from "./persistence";

describe("buildAbilitySnapshots", () => {
  it("maps dimension scores to database rows", () => {
    const rows = buildAbilitySnapshots("session-1", "user-1", {
      overallScore: 80,
      strengths: [],
      gaps: [],
      advice: "继续训练",
      dimensionScores: [
        { key: "ai_boundary", score: 16, maxScore: 20, evidence: "能识别幻觉", advice: "补充评估方法" }
      ]
    });
    expect(rows[0]).toMatchObject({ session_id: "session-1", user_id: "user-1", ability_key: "ai_boundary" });
  });
});
```

- [ ] **Step 3: Create session create route**

```ts
// src/app/api/sessions/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  question: z.object({
    type: z.enum(["single_choice", "multiple_choice", "case_analysis"]),
    title: z.string(),
    prompt: z.string(),
    scenario: z.string().optional(),
    options: z.unknown().optional(),
    correctOptions: z.array(z.string()).optional(),
    abilityKeys: z.array(z.string()),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    rubric: z.string().optional()
  })
});

export async function POST(request: Request) {
  const user = await requireUser();
  const input = createSchema.parse(await request.json());
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .insert({
      user_id: user.id,
      question_type: input.question.type,
      status: "generated",
      difficulty: input.question.difficulty,
      ability_keys: input.question.abilityKeys,
      title: input.question.title
    })
    .select("id")
    .single();

  if (sessionError) throw sessionError;

  const { error: questionError } = await supabase.from("session_questions").insert({
    session_id: session.id,
    user_id: user.id,
    question_type: input.question.type,
    title: input.question.title,
    prompt: input.question.prompt,
    scenario: input.question.scenario,
    options: input.question.options ?? null,
    correct_options: input.question.correctOptions ?? null,
    rubric: input.question.rubric ? { text: input.question.rubric } : null
  });

  if (questionError) throw questionError;

  return NextResponse.json({ sessionId: session.id });
}
```

- [ ] **Step 4: Create session update route**

```ts
// src/app/api/sessions/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { buildAbilitySnapshots } from "@/lib/training/persistence";

const updateSchema = z.object({
  answer: z.object({
    selectedOptions: z.array(z.string()).optional(),
    textAnswer: z.string().optional()
  }),
  evaluation: z.object({
    overallScore: z.number(),
    dimensionScores: z.array(z.any()),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    advice: z.string(),
    optionAnalysis: z.record(z.string()).optional()
  })
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const input = updateSchema.parse(await request.json());
  const supabase = await createClient();

  await supabase.from("user_responses").insert({
    session_id: id,
    user_id: user.id,
    selected_options: input.answer.selectedOptions ?? null,
    text_answer: input.answer.textAnswer ?? null,
    is_draft: false,
    submitted_at: new Date().toISOString()
  });

  await supabase.from("evaluations").insert({
    session_id: id,
    user_id: user.id,
    overall_score: input.evaluation.overallScore,
    dimension_scores: input.evaluation.dimensionScores,
    strengths: input.evaluation.strengths,
    gaps: input.evaluation.gaps,
    advice: input.evaluation.advice,
    option_analysis: input.evaluation.optionAnalysis ?? null
  });

  await supabase.from("ability_snapshots").insert(buildAbilitySnapshots(id, user.id, input.evaluation as never));

  await supabase
    .from("training_sessions")
    .update({ status: "evaluated", overall_score: input.evaluation.overallScore, completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Wire persistence into workbench**

Add this state to `src/components/training/training-workbench.tsx`:

```tsx
const [sessionId, setSessionId] = useState<string | null>(null);
```

After `setQuestion(data.question);` in `generateQuestion`, add:

```tsx
const sessionResponse = await fetch("/api/sessions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question: data.question })
});
const sessionData = await sessionResponse.json();
setSessionId(sessionData.sessionId);
```

After `setEvaluation(data.evaluation);` in `submitAnswer`, add:

```tsx
if (sessionId) {
  await fetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answer: question.type === "case_analysis" ? { textAnswer: answer } : { selectedOptions },
      evaluation: data.evaluation
    })
  });
}
```

- [ ] **Step 6: Run tests and typecheck**

Run: `npm run test -- src/lib/training/persistence.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/sessions src/lib/training src/components/training/training-workbench.tsx
git commit -m "feat: persist training sessions"
```

---

### Task 10: Add Settings Page And AI Config Priority

**Files:**
- Create: `src/app/settings/page.tsx`
- Create: `src/components/settings/ai-settings-form.tsx`
- Create: `src/lib/settings/ai-config.ts`
- Create: `src/lib/settings/ai-config.test.ts`
- Modify: `src/components/training/training-workbench.tsx`

- [ ] **Step 1: Create AI config helper**

```ts
// src/lib/settings/ai-config.ts
export type StoredAiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export const AI_CONFIG_STORAGE_KEY = "ai-pm-trainer-ai-config";

export function isCompleteAiConfig(config: Partial<StoredAiConfig>) {
  return Boolean(config.baseUrl && config.apiKey && config.model);
}
```

- [ ] **Step 2: Test config helper**

```ts
// src/lib/settings/ai-config.test.ts
import { describe, expect, it } from "vitest";
import { isCompleteAiConfig } from "./ai-config";

describe("isCompleteAiConfig", () => {
  it("requires baseUrl apiKey and model", () => {
    expect(isCompleteAiConfig({ baseUrl: "x", apiKey: "y", model: "z" })).toBe(true);
    expect(isCompleteAiConfig({ baseUrl: "x", model: "z" })).toBe(false);
  });
});
```

- [ ] **Step 3: Create settings form**

```tsx
// src/components/settings/ai-settings-form.tsx
"use client";

import { useEffect, useState } from "react";
import { AI_CONFIG_STORAGE_KEY, type StoredAiConfig } from "@/lib/settings/ai-config";

const initialConfig: StoredAiConfig = {
  baseUrl: "",
  apiKey: "",
  model: ""
};

export function AiSettingsForm() {
  const [config, setConfig] = useState(initialConfig);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (raw) setConfig(JSON.parse(raw));
  }, []);

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
  }

  return (
    <form className="grid max-w-2xl gap-4 rounded-lg border border-line bg-white p-5" onSubmit={save}>
      <h1 className="text-xl font-semibold text-ink">AI 服务设置</h1>
      <label className="grid gap-2 text-sm">
        Base URL
        <input className="rounded border border-line px-3 py-2" value={config.baseUrl} onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" />
      </label>
      <label className="grid gap-2 text-sm">
        API Key
        <input className="rounded border border-line px-3 py-2" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} type="password" />
      </label>
      <label className="grid gap-2 text-sm">
        Model
        <input className="rounded border border-line px-3 py-2" value={config.model} onChange={(e) => setConfig({ ...config, model: e.target.value })} placeholder="gpt-4.1-mini" />
      </label>
      <button className="w-fit rounded bg-brand px-4 py-2 text-white" type="submit">保存设置</button>
      {saved ? <p className="text-sm text-success">已保存到当前浏览器。</p> : null}
    </form>
  );
}
```

- [ ] **Step 4: Create settings page**

```tsx
// src/app/settings/page.tsx
import { requireUser } from "@/lib/auth/guards";
import { AppNav } from "@/components/layout/app-nav";
import { AiSettingsForm } from "@/components/settings/ai-settings-form";

export default async function SettingsPage() {
  await requireUser();
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <AiSettingsForm />
      </main>
    </>
  );
}
```

- [ ] **Step 5: Send config from workbench**

In `src/components/training/training-workbench.tsx`, import:

```tsx
import { AI_CONFIG_STORAGE_KEY } from "@/lib/settings/ai-config";
```

Add helper inside component:

```tsx
function getAiConfig() {
  const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
  return raw ? JSON.parse(raw) : undefined;
}
```

Add `aiConfig: getAiConfig()` to the JSON body for AI route calls.

- [ ] **Step 6: Run tests**

Run: `npm run test -- src/lib/settings/ai-config.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/settings/page.tsx src/components/settings/ai-settings-form.tsx src/lib/settings src/components/training/training-workbench.tsx
git commit -m "feat: add AI settings"
```

---

### Task 11: Add Growth History Page

**Files:**
- Create: `src/app/history/page.tsx`
- Create: `src/components/history/growth-dashboard.tsx`
- Create: `src/components/history/growth-dashboard.test.tsx`

- [ ] **Step 1: Create growth dashboard component**

```tsx
// src/components/history/growth-dashboard.tsx
type SessionRow = {
  id: string;
  title: string;
  question_type: string;
  overall_score: number | null;
  completed_at: string | null;
};

type SnapshotRow = {
  ability_key: string;
  score: number;
  max_score: number;
  created_at: string;
};

export function GrowthDashboard({ sessions, snapshots }: { sessions: SessionRow[]; snapshots: SnapshotRow[] }) {
  if (sessions.length === 0) {
    return <div className="rounded-lg border border-line bg-white p-6 text-muted">还没有训练记录。完成一次训练后，这里会显示趋势。</div>;
  }

  const average = Math.round(
    sessions.reduce((sum, item) => sum + (item.overall_score ?? 0), 0) / sessions.length
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <section className="rounded-lg border border-line bg-white p-5">
        <p className="text-sm text-muted">平均分</p>
        <div className="mt-2 text-4xl font-semibold text-ink">{average}</div>
        <p className="mt-2 text-sm text-muted">共 {sessions.length} 次训练</p>
      </section>
      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="font-semibold text-ink">最近训练</h2>
        <div className="mt-4 grid gap-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded border border-line p-3">
              <div>
                <p className="font-medium">{session.title}</p>
                <p className="text-sm text-muted">{session.question_type}</p>
              </div>
              <span className="text-lg font-semibold">{session.overall_score ?? "-"}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-lg border border-line bg-white p-5 lg:col-span-2">
        <h2 className="font-semibold text-ink">能力快照</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {snapshots.slice(0, 12).map((snapshot, index) => (
            <div key={`${snapshot.ability_key}-${index}`} className="rounded border border-line p-3">
              <div className="flex justify-between text-sm">
                <span>{snapshot.ability_key}</span>
                <span>{snapshot.score}/{snapshot.max_score}</span>
              </div>
              <div className="mt-2 h-2 rounded bg-panel">
                <div className="h-2 rounded bg-brand" style={{ width: `${(snapshot.score / snapshot.max_score) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create history page**

```tsx
// src/app/history/page.tsx
import { requireUser } from "@/lib/auth/guards";
import { AppNav } from "@/components/layout/app-nav";
import { GrowthDashboard } from "@/components/history/growth-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("id,title,question_type,overall_score,completed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: snapshots } = await supabase
    .from("ability_snapshots")
    .select("ability_key,score,max_score,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <GrowthDashboard sessions={sessions ?? []} snapshots={snapshots ?? []} />
      </main>
    </>
  );
}
```

- [ ] **Step 3: Write dashboard test**

```tsx
// src/components/history/growth-dashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GrowthDashboard } from "./growth-dashboard";

describe("GrowthDashboard", () => {
  it("renders empty state", () => {
    render(<GrowthDashboard sessions={[]} snapshots={[]} />);
    expect(screen.getByText("还没有训练记录。完成一次训练后，这里会显示趋势。")).toBeInTheDocument();
  });

  it("renders average score", () => {
    render(
      <GrowthDashboard
        sessions={[{ id: "1", title: "案例题", question_type: "case_analysis", overall_score: 80, completed_at: null }]}
        snapshots={[]}
      />
    );
    expect(screen.getByText("80")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/components/history/growth-dashboard.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/history/page.tsx src/components/history
git commit -m "feat: add growth history"
```

---

### Task 12: Complete Case Follow-Up And Reference Answer

**Files:**
- Modify: `src/components/training/followup-panel.tsx`
- Create: `src/components/training/reference-answer-panel.tsx`
- Modify: `src/components/training/training-workbench.tsx`
- Modify: `src/app/api/sessions/[id]/route.ts`

- [ ] **Step 1: Extend follow-up panel with answer input**

```tsx
// src/components/training/followup-panel.tsx
export type FollowupTurn = {
  question: string;
  intent?: string;
  answer?: string;
};

export function FollowupPanel({
  turns,
  pendingAnswer,
  onAnswerChange,
  onSubmitAnswer,
  onGenerateFollowup,
  canGenerate
}: {
  turns: FollowupTurn[];
  pendingAnswer: string;
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onGenerateFollowup: () => void;
  canGenerate: boolean;
}) {
  if (!canGenerate && turns.length === 0) return null;

  const latest = turns.at(-1);
  const needsAnswer = latest && !latest.answer;

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-ink">AI 面试官追问</h3>
        <button className="rounded border border-line px-3 py-2 text-sm disabled:opacity-50" type="button" disabled={!canGenerate || Boolean(needsAnswer)} onClick={onGenerateFollowup}>
          生成追问
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {turns.map((turn, index) => (
          <div key={`${turn.question}-${index}`} className="rounded border border-line p-3">
            <p className="text-sm font-medium">第 {index + 1} 轮：{turn.question}</p>
            {turn.intent ? <p className="mt-2 text-sm text-muted">追问意图：{turn.intent}</p> : null}
            {turn.answer ? <p className="mt-2 text-sm text-ink">回答：{turn.answer}</p> : null}
          </div>
        ))}
      </div>
      {needsAnswer ? (
        <div className="mt-4 grid gap-3">
          <textarea className="min-h-28 rounded border border-line p-3" value={pendingAnswer} onChange={(event) => onAnswerChange(event.target.value)} placeholder="回答这一轮追问..." />
          <button className="w-fit rounded bg-ink px-4 py-2 text-white" type="button" onClick={onSubmitAnswer}>保存追问回答</button>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 2: Create reference answer panel**

```tsx
// src/components/training/reference-answer-panel.tsx
export type ReferenceAnswer = {
  outline: string[];
  sampleAnswer: string;
  commonMistakes: string[];
  nextTrainingAdvice: string;
};

export function ReferenceAnswerPanel({ referenceAnswer }: { referenceAnswer: ReferenceAnswer | null }) {
  if (!referenceAnswer) return null;

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h3 className="font-semibold text-ink">参考答案与复盘</h3>
      <div className="mt-4 grid gap-4">
        <div>
          <p className="text-sm font-medium">优秀答案框架</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {referenceAnswer.outline.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-ink">{referenceAnswer.sampleAnswer}</p>
        <div>
          <p className="text-sm font-medium">常见误区</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {referenceAnswer.commonMistakes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <p className="rounded bg-blue-50 p-3 text-sm text-brand">{referenceAnswer.nextTrainingAdvice}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Wire follow-up and reference calls in workbench**

In `src/components/training/training-workbench.tsx`, import:

```tsx
import { ReferenceAnswerPanel, type ReferenceAnswer } from "./reference-answer-panel";
```

Add state:

```tsx
const [pendingFollowupAnswer, setPendingFollowupAnswer] = useState("");
const [referenceAnswer, setReferenceAnswer] = useState<ReferenceAnswer | null>(null);
```

Add handlers:

```tsx
async function generateFollowup() {
  if (!question || !evaluation || followups.length >= 3) return;
  setStatus("正在生成追问...");
  const response = await fetch("/api/ai/followup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, evaluation, previousAnswers: followups, aiConfig: getAiConfig() })
  });
  const data = await response.json();
  setFollowups((current) => [...current, { question: data.followup.question, intent: data.followup.intent }]);
  setStatus("");
}

function submitFollowupAnswer() {
  setFollowups((current) => {
    const next = [...current];
    const last = next[next.length - 1];
    if (last) next[next.length - 1] = { ...last, answer: pendingFollowupAnswer };
    return next;
  });
  setPendingFollowupAnswer("");
}

async function generateReferenceAnswer() {
  if (!question || !evaluation) return;
  setStatus("正在生成参考答案...");
  const response = await fetch("/api/ai/reference-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer: question.type === "case_analysis" ? { textAnswer: answer } : { selectedOptions }, evaluation, followups, aiConfig: getAiConfig() })
  });
  const data = await response.json();
  setReferenceAnswer(data.referenceAnswer);
  setStatus("");
}
```

Replace the follow-up render with:

```tsx
<FollowupPanel
  turns={followups}
  pendingAnswer={pendingFollowupAnswer}
  onAnswerChange={setPendingFollowupAnswer}
  onSubmitAnswer={submitFollowupAnswer}
  onGenerateFollowup={generateFollowup}
  canGenerate={Boolean(question?.type === "case_analysis" && evaluation && followups.length < 3)}
/>
{evaluation ? (
  <button className="w-fit rounded border border-line bg-white px-4 py-2" type="button" onClick={generateReferenceAnswer}>
    生成参考答案
  </button>
) : null}
<ReferenceAnswerPanel referenceAnswer={referenceAnswer} />
```

- [ ] **Step 4: Persist follow-up turns in session route**

Extend `updateSchema` in `src/app/api/sessions/[id]/route.ts`:

```ts
followups: z.array(z.object({
  question: z.string(),
  intent: z.string().optional(),
  answer: z.string().optional()
})).optional()
```

After inserting `ability_snapshots`, add:

```ts
if (input.followups?.length) {
  await supabase.from("followup_turns").upsert(
    input.followups.map((turn, index) => ({
      session_id: id,
      user_id: user.id,
      turn_index: index + 1,
      question: turn.question,
      intent: turn.intent ?? null,
      user_answer: turn.answer ?? null
    })),
    { onConflict: "session_id,turn_index" }
  );
}
```

Update the workbench session `PATCH` body to include:

```tsx
followups
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/training/followup-panel.tsx src/components/training/reference-answer-panel.tsx src/components/training/training-workbench.tsx src/app/api/sessions/[id]/route.ts
git commit -m "feat: complete follow-up and reference flow"
```

---

### Task 13: Finish Error States, Responsive QA, And Docs

**Files:**
- Create: `README.md`
- Create: `tests/e2e/training.spec.ts`
- Modify: `src/components/training/training-workbench.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add visible error state to workbench**

In `src/components/training/training-workbench.tsx`, add:

```tsx
const [error, setError] = useState("");
```

Wrap `generateQuestion` and `submitAnswer` bodies in `try/catch`:

```tsx
try {
  setError("");
  // existing fetch logic
} catch (err) {
  setError(err instanceof Error ? err.message : "请求失败，请检查 AI 配置后重试。");
} finally {
  setStatus("");
}
```

Render under the status text:

```tsx
{error ? <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-danger">{error}</p> : null}
```

- [ ] **Step 2: Tighten responsive CSS**

Add to `src/app/globals.css`:

```css
textarea,
input,
select,
button {
  max-width: 100%;
}

pre,
p,
h1,
h2,
h3 {
  overflow-wrap: anywhere;
}
```

- [ ] **Step 3: Create E2E smoke test**

```ts
// tests/e2e/training.spec.ts
import { test, expect } from "@playwright/test";

test("auth page renders", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "AI 产品经理思维训练器" })).toBeVisible();
});
```

- [ ] **Step 4: Create README**

```md
# AI 产品经理思维训练器

一个面向 AI 产品经理能力训练的响应式 Web MVP，支持选择题快练、案例深训、AI 评分、面试官追问、参考答案和成长记录。

## 本地运行

1. 安装依赖：

```bash
npm install
```

2. 复制环境变量：

```bash
cp .env.example .env.local
```

3. 配置 Supabase：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. 配置默认 AI Provider：

- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

5. 应用数据库迁移：

```bash
supabase db push
```

6. 启动开发服务：

```bash
npm run dev
```

## Vercel 部署

在 Vercel Project Settings 中配置与 `.env.example` 对应的环境变量。Supabase Auth 的 Site URL 和 Redirect URLs 需要加入 Vercel 部署域名。

## 验证

```bash
npm run typecheck
npm run test
npm run build
```
```

- [ ] **Step 5: Run full verification**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

Run: `npm run test:e2e`

Expected: PASS for desktop and mobile projects, or a clear configuration error if Supabase credentials are not present.

- [ ] **Step 6: Commit**

```bash
git add README.md tests/e2e/training.spec.ts src/components/training/training-workbench.tsx src/app/globals.css
git commit -m "docs: add setup guide and smoke tests"
```

---

## Final Verification Checklist

- [ ] `npm run typecheck` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] Supabase migration is applied and all user-data tables have RLS enabled.
- [ ] Manual desktop check: `/dashboard` uses three-column layout with no overlapping text.
- [ ] Manual mobile check: `/dashboard` collapses to single column with readable controls.
- [ ] Manual choice flow: generate question, select answer, submit, see evaluation, save session.
- [ ] Manual case flow: generate case, write answer, submit, see rubric evaluation, generate follow-up, save session.
- [ ] `/history` shows empty state before training and records after training.
- [ ] `/settings` stores browser AI config and AI calls fall back to `.env.local` when local config is absent.
