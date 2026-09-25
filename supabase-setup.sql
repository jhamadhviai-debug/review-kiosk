-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) not null,
  name text not null,
  slug text unique not null,
  google_review_link text not null,
  created_at timestamptz default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) not null,
  type text not null,
  message text,
  created_at timestamptz default now()
);

alter table businesses enable row level security;
alter table feedback enable row level security;

-- Anyone can view a business by its slug (needed for the public QR page)
create policy "Public can view businesses"
  on businesses for select
  using (true);

-- Only the logged-in owner can create their own business row
create policy "Owners can insert their business"
  on businesses for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their business"
  on businesses for update
  using (auth.uid() = owner_id);

-- Anyone (including a customer with no login) can submit feedback
create policy "Anyone can submit feedback"
  on feedback for insert
  with check (true);

-- Only the business owner can read their own feedback
create policy "Owners can view their feedback"
  on feedback for select
  using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );
