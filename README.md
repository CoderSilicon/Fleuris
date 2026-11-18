  # Fleuris
![Nuxt](https://img.shields.io/badge/Nuxt-17191F?style=flat-square&logo=nuxt.js&logoColor=8CA4FF)
![Local-First](https://img.shields.io/badge/Local--First-3155D9?style=flat-square)
![Supabase Optional](https://img.shields.io/badge/Optional_Cloud_Sync-17191F?style=flat-square&logo=supabase&logoColor=8CA4FF)


<br />

When your ideas live in separate notes, lists, or folders, it’s easy to save things—but hard to see how they fit together. A concept sits in one doc, a question in another, and a useful link somewhere else, leaving the bigger picture buried. **fleurıs** lets you map your thoughts out visually so the connections between them stay clear, meaningful, and uniquely yours.

<br />

## What fleurıs helps you do

- **Connect a point of view** — Link notes, questions, and sources together so you can see how isolated fragments form a coherent stance.
- **Keep the context** — Tie every thought to the question, reference, or task that gave it meaning in the first place.
- **Think without rigid folders** — Ideas rarely belong in just one box; let a single note connect to as many threads as it naturally touches.
- **Start in seconds** — Open the app, create a graph, drop in your ideas, and start drawing connections—no setup required.
- **Stay in control** — Your work stays yours. Keep everything locally in your browser and export a personal copy of any graph whenever you want.

---

## How it works

<table>
  <tr>
    <td width="60" align="center"><code>01</code></td>
    <td><strong>Create a graph</strong> for a topic, project, or question you’re exploring.</td>
  </tr>
  <tr>
    <td align="center"><code>02</code></td>
    <td><strong>Drop in the pieces</strong> — half-formed ideas, quotes, links, questions, and tasks.</td>
  </tr>
  <tr>
    <td align="center"><code>03</code></td>
    <td><strong>Draw the connections</strong> to show how they relate—what belongs under what, and what sparks another thought.</td>
  </tr>
  <tr>
    <td align="center"><code>04</code></td>
    <td><strong>Zoom out and refine</strong> as patterns emerge and your point of view takes shape.</td>
  </tr>
  <tr>
    <td align="center"><code>05</code></td>
    <td><strong>Save a copy</strong> as a file anytime you want a backup or want to share your map.</td>
  </tr>
</table>

> You don’t need a cloud account to get started—a local account takes just a display name.

---

## Accounts & optional cloud sync

fleurıs is **local-first**. You’ll set up a quick account before entering the dashboard, and it can stay completely local on your machine.

| Mode | How it works |
| :--- | :--- |
| **Local account** | Choose **Local** on sign-in or sign-up, enter a display name, and jump in. Your name and graphs stay right in your browser—no email or password needed. |
| **Cloud account** | Sign up or sign in with Supabase when configured. Your account's `public.graphs` rows are the source of truth, and edits sync quietly in the background. |

- **Route guard:** `/dashboard` and the editor always require an active account. Signed-out visitors are redirected to `/login`, whether or not Supabase is configured.
- **Library isolation:** Local and cloud libraries live in separate browser caches. Signing into a cloud account never mixes your local browser graphs into that account—and your local graphs stay untouched when you switch back.
- **Automatic sync:** Edits push after a short pause, queued changes flush when you hide or close the tab, and fresh updates pull on sign-in, tab focus, reconnect, and once a minute while open. Manual sync is also available in the dashboard and account menu.
- **Signing out:** Clears the active session and returns to `/login`, where you can switch between local and cloud accounts anytime.

<details>
<summary><strong>What is stored in the cloud?</strong></summary>
<br />
Each row in <code>public.graphs</code> belongs to a single user (<code>user_id</code>) and stores the graph slug, title, description, nodes, connections, viewport state, and timestamps. Row-level security ensures users can only read and modify their own rows.
</details>

---

## What’s in this project

This repository houses both the fleurıs frontend and the backend in a single application, making it a mono repository:

- **Dashboard** — A place to find, create, open, copy, import, export, and delete your graphs.
- **Graph editor** — A canvas for capturing ideas, linking them, and shaping your map over time.
- **Auth** — A place which allows you to choose your choice about the data. Without others.

---

## Community & project files

- [Contributing guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)