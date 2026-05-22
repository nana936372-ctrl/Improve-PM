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

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.ai_settings,
  public.training_sessions,
  public.session_questions,
  public.user_responses,
  public.evaluations,
  public.followup_turns,
  public.ability_snapshots
to authenticated;

alter table public.profiles enable row level security;
alter table public.ai_settings enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.user_responses enable row level security;
alter table public.evaluations enable row level security;
alter table public.followup_turns enable row level security;
alter table public.ability_snapshots enable row level security;

create policy "profiles are owned by user" on public.profiles
  for all to authenticated
  using ((select auth.uid()) is not null and id = (select auth.uid()))
  with check ((select auth.uid()) is not null and id = (select auth.uid()));

create policy "ai settings are owned by user" on public.ai_settings
  for all to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "training sessions are owned by user" on public.training_sessions
  for all to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "session questions are owned by user" on public.session_questions
  for all to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "responses are owned by user" on public.user_responses
  for all to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "evaluations are owned by user" on public.evaluations
  for all to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "followups are owned by user" on public.followup_turns
  for all to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "ability snapshots are owned by user" on public.ability_snapshots
  for all to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
