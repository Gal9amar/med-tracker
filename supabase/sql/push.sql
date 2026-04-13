-- BabyCare Web Push (server-side push when site is closed)

-- 1) push_subscriptions: stores browser push endpoints per user
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text,
  auth text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "users manage own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 2) push_sent: dedupe / audit of sent notifications
create table if not exists public.push_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  family_id uuid,
  baby_id uuid,
  kind text not null,
  scheduled_at timestamptz not null,
  dedupe_key text not null unique,
  created_at timestamptz not null default now()
);

alter table public.push_sent enable row level security;

-- Users don't need access to this table; only service role (Edge Functions) will use it.
create policy "no direct access"
on public.push_sent
for all
to authenticated
using (false)
with check (false);

