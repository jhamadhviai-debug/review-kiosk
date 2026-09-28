-- Use ONLY to delete test businesses you made while testing.
-- Replace the slug below with your test slug (from the test QR link /r/<slug>).
delete from feedback where business_id in (select id from businesses where slug = 'PUT-TEST-SLUG-HERE');
delete from businesses where slug = 'PUT-TEST-SLUG-HERE';  -- business_private is removed automatically
