-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run
-- Adds two columns so we can track each business's Stripe subscription.
-- Safe to run even though your tables already exist.

alter table businesses
  add column if not exists stripe_customer_id text;

alter table businesses
  add column if not exists stripe_subscription_id text;
