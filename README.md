# fleurıs

fleurıs is a calm space for connected thinking.

When your ideas live in separate notes, lists, or folders, it’s easy to save things but hard to see how they belong together. A concept might sit in one place, a question in another, and a useful resource somewhere else — and the relationship between them gets lost. fleurıs helps solve that by letting you place ideas on a graph, so the links between them stay clear and easy to revisit.

## What fleurıs helps you do

- **Keep context:** connect a note to the question, source, or task that gives it meaning.
- **See the bigger picture:** turn scattered thoughts into a map you can explore.
- **Follow your thinking naturally:** ideas don’t always fit in one folder — in fleurıs, one idea can connect to many others.
- **Start simply:** open the app, create a graph, add ideas, and draw connections.
- **Stay in control:** your work stays with you, and you can keep a personal copy of a graph as a file whenever you want.

## How to use it (simply)

1. **Create a graph** for a topic, project, or question you care about.
2. **Add the pieces** — ideas, resources, questions, and tasks.
3. **Connect them** to show how they relate (what belongs under what, and what’s simply related).
4. **Explore and refine** as your understanding grows.
5. **Save a copy** as a file if you want a backup or want to move/share your work.

You don’t need a cloud account to get started — a local account takes just a name.

## Accounts and optional cloud sync

fleurıs is local-first. Completing an account is compulsory before the dashboard opens, but the account can be entirely local.

- **Local account:** choose **Local** on the sign-in or sign-up page, enter a display name, and continue. The name and every graph stay in this browser. No email or password.
- **Cloud account:** sign up or sign in with Supabase when it is configured. The account's `public.graphs` rows are authoritative; edits sync quietly after changes.
- **Route guard:** `/dashboard` and the editor always require a completed account. Signed-out visitors are sent to `/login`, whether or not Supabase is configured. There is no bypass.
- **Signing out:** clears the current account and returns to the sign-in page, where you can choose local or cloud again.

Local and cloud libraries are kept in separate browser caches. Signing into a cloud account never mixes this browser's local graphs into that account: the dashboard shows exactly the rows owned by the signed-in user. Local graphs stay available when you switch back to a local account.

Cloud sync is automatic: edits push after a short pause, queued edits flush when the tab is hidden, and a fresh pull runs on sign-in, tab focus, reconnect, and once a minute while the tab is open. Signed-in users can also trigger a sync from the dashboard or account menu.

## Running fleurıs locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No configuration is required for local-only use.

The `dev`, `build`, `generate`, and `preview` scripts load `.env` and `.env.local`, with
`.env.local` taking precedence. If you run `nuxi` directly, pass
`--dotenv .env --dotenv .env.local` yourself. `NUXT_PUBLIC_SUPABASE_URL` and
`NUXT_PUBLIC_SUPABASE_KEY` also work as runtime overrides.

## Optional: enable accounts with Supabase

1. Copy the environment template to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Create a Supabase project, or start one locally with the [Supabase CLI](https://supabase.com/docs/guides/local-development):

   ```bash
   supabase start
   ```

3. Add the URL and publishable/anon key to `.env.local`:

   ```env
   # Hosted project
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-publishable-key

   # Or local Supabase
   # SUPABASE_URL=http://127.0.0.1:54321
   # SUPABASE_KEY=your-local-anon-key
   ```

   `nuxt.config.ts` maps these into `runtimeConfig.public.supabaseUrl` and
   `runtimeConfig.public.supabaseKey`. Use only the publishable/anon key here;
   never put a service-role secret in a public runtime config value.

4. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor (or as a migration). It creates the `graphs` table, indexes, and row-level security policies. The file ends with `notify pgrst, 'reload schema';` so PostgREST refreshes its schema cache immediately. If you still see `PGRST205` / “Could not find the table 'public.graphs' in the schema cache”, run that `notify` line once manually.

5. In Supabase, add these redirect URLs under **Authentication → URL Configuration**:

   - `http://localhost:3000/auth/callback`
   - your production URL followed by `/auth/callback`

6. Restart the Nuxt dev server.

Email/password sign-up must be enabled under **Authentication → Providers → Email**. If email confirmation is on, Supabase sends the confirmation link that returns to `/auth/callback`.

### What is stored in Supabase

Each row in `public.graphs` belongs to one user (`user_id`) and contains the graph slug, title, description, nodes, connections, viewport, and timestamps. Row-level security ensures a signed-in user can only read and write their own rows.

## What’s in this project

This repository contains the fleurıs website and the graph workspace in one Nuxt application.

- **Dashboard:** where you can find, create, open, copy, import, export, and remove your graphs.
- **Graph editor:** a visual canvas for adding ideas, connecting them, and shaping your map over time.
- **Auth pages:** `/login` and `/signup` with local and cloud account choices, plus `/auth/callback` for email confirmation.
- **Database schema:** [`supabase/schema.sql`](./supabase/schema.sql) for optional cloud sync.


## Community and project files

- [Contributing guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)
- [License](./LICENSE) — view and use permitted; modification, code changes/removal, and redistribution are not permitted without prior written permission.

