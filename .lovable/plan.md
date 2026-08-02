# Fixing auth when running the exported code locally

Two separate problems. Neither is a bug in the exported code.

## 1. "Invalid login credentials" on email + password

Verified against the live user table: every recently created account has **no confirmed email**
(`email_confirmed_at` is empty). Email confirmation is on, so sign-up creates the account but
sign-in is rejected until the user clicks the confirmation link in their inbox. That is why the
same credentials "don't work".

Two ways forward — pick one:

- **Turn on auto-confirm** (recommended for development): accounts become usable immediately after
  sign-up, no email round-trip. I would enable it on the backend and leave the app code as is.
- **Keep confirmation on**: then the sign-up screen must tell the user to check their inbox (it
  already does) and they must click the link before signing in.

Existing unconfirmed accounts can be confirmed in bulk so the ones already created start working.

## 2. "Unsupported provider: missing OAuth secret" on Google

Google sign-in uses Lovable's managed Google credentials, which are wired to the app's
`*.lovable.app` origin through Lovable's OAuth broker. When the code runs on `localhost`, that
broker path does not exist, so the request reaches the auth server with no Google client secret —
exactly the error shown. Google sign-in therefore works on the Lovable preview/published URL but
cannot work from a local `bun dev`/`npm run dev` as-is.

Options:

- **Accept it**: use email + password locally, and Google only on the deployed URL.
- **Use your own Google OAuth app for local dev**: create a Google Cloud OAuth client, add the
  project's auth callback URL as an authorized redirect URI, and paste the client ID/secret into
  the backend's Google provider settings. Google then works on localhost too. This replaces the
  managed credentials everywhere, so the branding on the consent screen becomes yours.

## 3. Local environment checklist

The exported repo does not carry the backend connection values. Before `npm run dev` locally,
create a `.env` in the project root with:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_PROJECT_ID=...
```

I will add a short `README` section listing these exact keys and the local run steps, so the ZIP
is reproducible. (If your local app already loads data, this part is already in place.)

## Technical notes

- Changes to code: only the README local-setup section, and optionally a clearer sign-in error
  message that says "confirm your email" when the backend reports unconfirmed credentials.
- Changes to backend: auto-confirm setting (if chosen) and confirming the existing pending users.
- No schema, routing, or design-system changes.
