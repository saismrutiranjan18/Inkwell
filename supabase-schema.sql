-- ============================================================
-- INKWELL — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Enable extensions ─────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── USERS ─────────────────────────────────────────────────
-- Extends Supabase auth.users with profile data
create table if not exists public.users (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── BOOKS ─────────────────────────────────────────────────
create table if not exists public.books (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete cascade not null,
  title           text not null default 'Untitled Book',
  author_name     text not null default '',
  subtitle        text,
  description     text,

  -- Cover design
  cover_theme     jsonb default '{"name":"dark-gold","bg":"#1a1208","text":"#c9a84c","accent":"rgba(201,168,76,0.6)"}'::jsonb,
  cover_ornament  text default '✦',
  cover_subtitle  text,

  -- Stats
  status          text default 'draft' check (status in ('draft', 'published')),
  total_words     integer default 0,

  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- ── CHAPTERS ──────────────────────────────────────────────
create table if not exists public.chapters (
  id            uuid default uuid_generate_v4() primary key,
  book_id       uuid references public.books(id) on delete cascade not null,
  title         text not null default 'Chapter 1',
  content       text default '',        -- TipTap JSON (stringified)
  content_text  text default '',        -- Plain text for AI & word count
  order_index   integer not null default 0,
  word_count    integer default 0,

  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ── AUTO-UPDATE updated_at ────────────────────────────────
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_updated_at
  before update on public.books
  for each row execute procedure public.update_updated_at();

create trigger chapters_updated_at
  before update on public.chapters
  for each row execute procedure public.update_updated_at();

-- ── AUTO-UPDATE book word count when chapter saves ────────
create or replace function public.sync_book_word_count()
returns trigger
language plpgsql
as $$
begin
  update public.books
  set total_words = (
    select coalesce(sum(word_count), 0)
    from public.chapters
    where book_id = new.book_id
  )
  where id = new.book_id;
  return new;
end;
$$;

create trigger sync_words_on_chapter_change
  after insert or update of word_count on public.chapters
  for each row execute procedure public.sync_book_word_count();

-- ── ROW LEVEL SECURITY ────────────────────────────────────
alter table public.users    enable row level security;
alter table public.books    enable row level security;
alter table public.chapters enable row level security;

-- Users: can only see/edit their own profile
create policy "users_own_profile" on public.users
  for all using (auth.uid() = id);

-- Books: full access to own books only
create policy "books_owner_all" on public.books
  for all using (auth.uid() = user_id);

-- Chapters: access only if you own the book
create policy "chapters_owner_all" on public.chapters
  for all using (
    exists (
      select 1 from public.books
      where id = chapters.book_id
      and user_id = auth.uid()
    )
  );

-- ── INDEXES ───────────────────────────────────────────────
create index if not exists books_user_id_idx     on public.books(user_id);
create index if not exists books_updated_at_idx  on public.books(updated_at desc);
create index if not exists chapters_book_id_idx  on public.chapters(book_id);
create index if not exists chapters_order_idx    on public.chapters(book_id, order_index);

-- ============================================================
-- DONE ✦
-- You should now see: users, books, chapters tables
-- with RLS enabled and all triggers active.
-- ============================================================
