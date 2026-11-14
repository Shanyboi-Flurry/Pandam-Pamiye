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

## Night mode

The Sun/Moon button (top bar, login page, landing page) switches themes and remembers the choice; the first visit follows the device setting. Theme colours are defined once in `src/index.css` (`:root` for light, `.dark` for night) and wired into `tailwind.config.js`, so existing classes such as `bg-surface`, `text-slate-600` and `bg-sky-100` adapt automatically. When adding a new `text-<colour>-600/700/800/900` class on a light surface, night mode already handles it for the colours used here.

## Demo accounts

Staff and demo logins (password in brackets): admin@reuseu.edu (Admin@123), teacher@reuseu.edu (Teacher@123), staff@reuseu.edu (Staff@123), student@reuseu.edu (Student@123).
Students added with starting EcoPoints use the `surname.firstname@student.auf.edu.ph` pattern and the password `Student@123`: Kurt Justine Sarmiento (315), Justin Mandapat (165). Mikaella Andrea M. Bungay (60) keeps her own registered account; the points are attached by email.
Roster changes live in `applyRoster` in `src/lib/logic.js`; it runs on every load and only adds what is missing, so it is safe for existing data.

## Sample data

`src/lib/demo.js` adds realistic sample records once (listings, completed loans, donations and swaps over the last two months, messages, and pending items: 5 listings waiting for the administrator, plus borrow, claim and swap requests for owners to answer). Every record has a fixed id, so it is never added twice and anything changed later stays changed. To reset the demo, delete the row in Supabase (Table Editor -> `app_state`) and reload the site.
