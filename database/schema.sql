-- Campus Green Ideas Board schema
-- Run this entire file in Supabase Dashboard > SQL Editor.
-- The Express server uses the server-side service-role key only after application-level auth checks.
-- RLS is enabled and anonymous/authenticated direct table access is denied by default.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null check (char_length(trim(name)) between 2 and 80),
  email varchar(254) not null unique,
  password_hash text not null,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title varchar(120) not null check (char_length(trim(title)) between 5 and 120),
  description varchar(1500) not null check (char_length(trim(description)) between 20 and 1500),
  category text not null check (category in ('Waste reduction','Energy saving','Water conservation','Green spaces','Transport','Other')),
  status text not null default 'New' check (status in ('New','Under review','In progress','Completed')),
  author_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votes_one_per_user_per_idea unique (idea_id,user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body varchar(600) not null check (char_length(trim(body)) between 2 and 600),
  created_at timestamptz not null default now()
);

create index if not exists ideas_created_at_idx on public.ideas(created_at desc);
create index if not exists ideas_category_status_idx on public.ideas(category,status);
create index if not exists ideas_author_id_idx on public.ideas(author_id);
create index if not exists votes_idea_id_idx on public.votes(idea_id);
create index if not exists comments_idea_created_idx on public.comments(idea_id,created_at);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ideas_set_updated_at on public.ideas;
create trigger ideas_set_updated_at before update on public.ideas
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.ideas enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;

-- No public policies are created intentionally. Browser clients cannot read/write tables directly.
-- The Express backend uses its private service-role key and enforces JWT + role checks.
