# CareerCollab

A platform connecting students and companies through real industry projects: project feed,
applications, collaboration workspace with milestones, notifications, reviews, directories and
dashboards.

Stack: React 19 + TanStack Start (Vite), TanStack Query, Tailwind CSS v4, shadcn/ui, and a hosted
Postgres backend with auth (Supabase-compatible).

## Running the exported code locally

1. Install dependencies:

   ```bash
   npm install     # or: bun install
   ```

2. Create a `.env` file in the project root. The exported repository/ZIP does **not** include it,
   and the app cannot start without it:

   ```text
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
   VITE_SUPABASE_PROJECT_ID=<project-ref>

   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_PUBLISHABLE_KEY=<publishable key>
   SUPABASE_PROJECT_ID=<project-ref>
   ```

   The `VITE_*` values are used in the browser; the plain ones are used during server-side
   rendering. Both sets hold the same values. Copy them from the project's backend settings in
   Lovable (they are publishable keys — safe in the client bundle). Never put the service-role key
   in this file.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   The app runs on http://localhost:3000.

## Authentication notes for local runs

- **Email + password** works locally. Sign-ups are auto-confirmed, so an account can sign in
  immediately after it is created. If you see `Invalid login credentials` for an account you just
  created, the email is not confirmed — confirm it from the backend Users screen.
- **Google sign-in does not work on `localhost`.** It uses Lovable's managed Google credentials,
  which are bound to the app's `*.lovable.app` origin through Lovable's OAuth broker. Running the
  code locally bypasses that broker, and the auth server answers with
  `Unsupported provider: missing OAuth secret`.

  Two options:
  - Use email + password locally and Google only on the deployed Lovable URL, or
  - Create your own Google Cloud OAuth client, add the project's auth callback URL
    (`https://<project-ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI, and paste
    the client ID/secret into the backend's Google provider settings. Google then works from
    localhost too, with your own consent-screen branding.

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the dev server               |
| `npm run build`   | Production build                   |
| `npm run preview` | Preview the production build       |
| `npm run lint`    | Lint the codebase                  |
| `npm run format`  | Format with Prettier               |
