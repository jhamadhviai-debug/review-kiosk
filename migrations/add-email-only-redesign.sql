-- Run ONCE in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- This is purely additive: it does not delete or rewrite any existing
-- table, row, or policy. Your live app keeps working unchanged before,
-- during, and after you run this.

-- 1) The old flow required a Supabase Auth user (owner_id) for every
--    business. The new no-login flow doesn't create one, so owner_id must
--    become optional. Existing rows are untouched — they keep their
--    owner_id and the old /dashboard (magic-link) page keeps working
--    exactly as before.
alter table businesses
  alter column owner_id drop not null;

-- 2) Private data (email, the secret dashboard token, and reminder-email
--    flags) lives in its own table, separate from "businesses" — which
--    has a public "select using (true)" policy for the /r/[slug] page.
--    Row Level Security is enabled here with NO policies at all, which
--    means the anon key and any logged-in user get zero access. Only
--    server-side code using SUPABASE_SERVICE_ROLE_KEY (never sent to the
--    browser) can read or write it.
create table business_private (
  business_id uuid primary key references businesses(id) on delete cascade,
  email text not null,
  dashboard_token text unique not null,
  trial_ending_email_sent boolean not null default false,
  trial_ended_email_sent boolean not null default false,
  payment_issue_email_sent_at timestamptz,
  created_at timestamptz default now()
);

alter table business_private enable row level security;
-- (deliberately no policies created -> locked to service_role only)

create index if not exists business_private_token_idx on business_private (dashboard_token);
create index if not exists business_private_email_idx on business_private (email);
