# Pandam Pamiye — Share More. Waste Less. Grow Together.

A school resource-sharing platform (lend, borrow, donate, exchange) built with React, Vite, Tailwind CSS, React Router, Recharts and Lucide. Data is stored in the browser's `localStorage`; no backend is required.

## Run
Install Node.js LTS from https://nodejs.org first, then:
```
npm install
npm run dev        # development at http://localhost:5173
npm run build      # production build -> dist/
```
Deploy: push to GitHub and import the repo in Vercel (`vercel.json` already rewrites all routes to `index.html`).

## Sample accounts
| Role | Email | Password |
|---|---|---|
| Administrator | admin@reuseu.edu | Admin@123 |
| Teacher | teacher@reuseu.edu | Teacher@123 |
| Staff | staff@reuseu.edu | Staff@123 |
| Student | student@reuseu.edu | Student@123 |

The app starts empty apart from these four accounts. New members can also register (student, teacher or staff).

## How listing approval works
1. A student, teacher or staff member adds a resource. It is saved as **pending** and is visible only to its owner and the administrator.
2. The administrator opens **Listing approvals**, then approves or rejects it (with an optional reason).
3. Approved listings go live in the marketplace, donations and exchanges, and the owner earns EcoPoints.
4. Rejected listings show the reason to the owner. Editing and saving resubmits them for review.

The administrator account only reviews listings (plus a read-only marketplace and analytics view).

## Messages
Members can send each other private messages (Messages page, or the "Message" button on any resource). Unread messages show as a badge in the sidebar and the bell. Administrators do not use messaging.

## Reset data
Open the browser DevTools (F12) → Application → Local Storage → delete the `reuseu:v2` entry (the storage key keeps its original internal name), then refresh.

## Where the logic lives
- `src/lib/logic.js` — conflict detection, overdue tracking, smart matching, demand analytics, EcoPoints stats, badges, waste estimates, reminders, starter accounts
- `src/lib/actions.js` — borrow/donate/exchange workflows, listing approval, messaging, point awards

## Limits
Authentication and storage are browser-only. A real deployment needs verified authentication and a shared database.

## Shared database (Supabase)

Without setup the app stores data in each browser only. To keep data online for everyone:

1. Create a free project at supabase.com, open **SQL Editor**, paste `supabase.sql`, and run it.
2. In **Project Settings -> API**, copy the Project URL and the `anon` public key.
3. Add them as environment variables (locally in a `.env` file, see `.env.example`; on Vercel in Settings -> Environment Variables):
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Then redeploy.

The first visit seeds the demo data. To reset, delete the row in Table Editor -> `app_state`.
