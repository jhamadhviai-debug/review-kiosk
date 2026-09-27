-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run
-- This adds a "plan" column so each business can be Free or Pro.
-- Safe to run even though your tables already exist — it only adds one column.

alter table businesses
  add column if not exists plan text not null default 'free';
