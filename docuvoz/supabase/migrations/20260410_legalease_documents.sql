create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  file_name text,
  file_url text,
  storage_path text,
  mime_type text,
  extracted_text text,
  translated_text text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.documents
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists status text not null default 'processing',
  add column if not exists error_message text;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id),
  user_id text not null,
  role text check (role in ('user', 'assistant')),
  message text,
  created_at timestamptz not null default now()
);
