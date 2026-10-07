# Enable sign-in and cloud storage

This PR adds Supabase email/password authentication and per-account PostgreSQL storage. It does not provision a Supabase project or migrate records automatically.

1. Create or select a project at https://supabase.com/dashboard . Choose the plan and region yourself; review any provider charges.
2. Open **SQL Editor → New query**, paste `supabase/schema.sql`, and run it once. It creates the table and row-level access policies. Do not disable RLS.
3. In **Authentication → Providers → Email**, enable email/password and email confirmation. Configure production SMTP and suitable rate limits before inviting real users. Public sign-up is enabled by this UI; disable new signups in the provider if this should be invitation-only.
4. In **Authentication → URL Configuration**, set Site URL to your production app URL, and allow your exact preview URL as a redirect URL for password recovery. Avoid broad wildcard redirects.
5. Copy the project URL and **publishable** (or legacy **anon**) key from Supabase API settings. In Vercel **Project → Settings → Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production and Preview. Never use a service-role or secret key. These two values are bundled into public client code; authorization depends on RLS, not hiding the publishable key.
6. Redeploy the preview after setting the variables. Create an account, confirm your email, and test saving, refreshing, editing, deleting, CSV import/export, reset password, and sign-out.
7. Verify isolation: create accounts A and B. Save a prospect under A, then sign in as B and confirm it is invisible. Requests by B for A's row must return no data, and attempts to insert/update A's user_id must be rejected. Anonymous reads/writes must be rejected. Do this before merging.

Existing browser data is preserved. Sign in and explicitly click **Import old browser records** on the original browser to migrate it into the current account. Export a CSV backup first. This action retains the local backup; importing into multiple accounts creates separate copies.

Current scope: records are private to each user, not shared with colleagues. Uses browser-managed sessions (sign out on shared devices). Concurrent-device edits are last-write-wins; this is not collaborative editing. Loading is limited to 10,000 records and reports when the limit is reached. No credentials or database access were available to execute live integration/RLS tests in the development sandbox.
