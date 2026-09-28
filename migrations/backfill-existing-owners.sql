-- OPTIONAL. Run ONCE in Supabase SQL Editor, AFTER add-email-only-redesign.sql.
-- Only needed if businesses already exist that signed up the OLD way
-- (magic link). It gives each one a private dashboard link + email on file.
-- Safe to re-run: it skips businesses that already have one.
-- No emails are sent by this. Owners get their link by using
-- "Forgot your link?" on the home page (needs Resend set up).
insert into business_private (business_id, email, dashboard_token)
select b.id,
       u.email,
       replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
from businesses b
join auth.users u on u.id = b.owner_id
where u.email is not null
  and not exists (select 1 from business_private p where p.business_id = b.id);
