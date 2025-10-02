# Immobazyme Kosher Dossier Manager (Hosted)

A simple multi-user dossier manager for chemical documentation (SDS/CoA uploads, CAS & composition, manufacturing & process notes), powered by Next.js + Supabase.

## Features
- Email magic-link sign-in (Supabase Auth)
- Dossiers stored in Supabase Postgres with Row-Level Security (RLS)
- Private SDS/CoA uploads to Supabase Storage (signed URL downloads)
- Org-scoped visibility via `memberships` table

## Quick Start
1. **Supabase**
   - Create a project, then create a Storage bucket named `files` (private).
   - Open **SQL Editor** and run `supabase/supabase_dossier_setup.sql`.
   - Copy `Project URL` and `anon public key` from **Settings → API**.

2. **Local env**
   - Copy `.env.example` to `.env.local` and fill in values:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_ORG_ID` (a UUID for your organisation; use any valid UUID)

3. **Run locally**
   ```bash
   npm i   # or yarn / pnpm
   npm run dev
   ```

4. **Deploy**
   - Push this repo to GitHub
   - Import into **Vercel** and set the same three env vars there

5. **Invite team**
   - In Supabase Table Editor, insert rows into `memberships` with your `org_id` and `role` (`member` or `admin`). After users sign in once, you can update `user_id` to their actual `auth.users.id`.

---

### Notes
- Storage object keys follow: `<ORG_ID>/dossiers/<DOSSIER_ID>/<filename>`
- All reads require membership in the org via RLS policies.
- You can add roles and extra policies later.
