# EventInvito

Digital wedding invitations with a personal link for every guest and RSVPs in one dashboard.
Built with MongoDB, Express, React and Node.js (MERN).

*Create. Invite. Celebrate.*

## What it does

- **Hosts** sign up, pick one of four designs (Pure Elegance, Modern Romance, Royal Red, Crimson Love), fill in their details with a live preview, and publish.
- **Guests** are added one by one or imported from Excel/CSV. Each gets a private link that greets them by name ("Dear Amal Perera").
- **Sharing**: copy a link, or open WhatsApp with the message ready. The host always presses Send.
- **RSVP**: guests answer Attending / Not attending and can change their answer until the deadline (Sri Lanka time). The server refuses late replies and replies through reset or removed links.
- **Languages**: English, Sinhala and Tamil, one per invitation.

## Project layout

```
EventInvito/
├── client/                 React app (Vite + Tailwind)
│   └── src/
│       ├── pages/          one file per screen
│       ├── components/     shared pieces (layout, forms, modal…)
│       ├── templates/      the invitation designs, wording in 3 languages, RSVP form
│       ├── context/        signed-in user
│       └── lib/            API calls, sharing, spreadsheet import
├── server/                 Express API
│   ├── src/
│   │   ├── routes/         URL → controller
│   │   ├── controllers/    the logic for each feature
│   │   ├── models/         MongoDB data (User, Template, Invitation, Guest)
│   │   ├── middleware/     sign-in checks, error responses
│   │   ├── utils/          guest-link tokens, errors, JWT
│   │   ├── config/         database connection, settings check
│   │   ├── data/           the built-in templates
│   │   └── scripts/        seed templates / demo data
│   └── test/               automated tests (npm test)
└── package.json            build / start scripts for deployment
```

## Run it on your computer

Needs **Node.js 20 or newer** and a **MongoDB Atlas** cluster (the free tier is fine).

1. **Settings**: copy `server/.env.example` to `server/.env` and fill in `MONGODB_URI` and `JWT_SECRET`.
2. **Atlas access**: in Atlas → *Network Access*, add your IP address.
3. **Install**:
   ```
   npm run install:all
   ```
4. **Load the templates** (once):
   ```
   cd server
   npm run seed:templates
   ```
5. **Start** the API and the website in two terminals:
   ```
   cd server && npm run dev        # http://localhost:5000
   cd client && npm run dev        # http://localhost:5173  ← open this
   ```

### Demo data

```
cd server
npm run seed:demo
```

Creates `demo@eventinvito.test` / `Demo1234` with five invitations in different states (live, Sinhala, draft, deadline passed, unpublished) and 22 guests, and prints every guest link. A second account, `other@eventinvito.test`, is for checking that users can't see each other's data. Re-running it resets only these two accounts. It refuses to run when `NODE_ENV=production`.

## Tests

```
cd server
npm test
```

47 tests cover sign-up and sign-in, ownership (users can't reach each other's invitations or guests), personal links (unique, unguessable, reset/removed/unpublished), RSVP rules (deadline day, after the deadline, revoked links, no answering for someone else), the spreadsheet import, and API safety (security headers, size limits).

They run against a temporary in-memory MongoDB, never your Atlas data. The first run downloads a MongoDB binary (about 100 MB), so it needs internet once.

## Screens

| Address | Screen |
|---|---|
| `/` | Home |
| `/templates` | Explore invitations (public) |
| `/signin`, `/signup` | Sign in, create account |
| `/dashboard` | Host dashboard |
| `/invitations/:id/edit` | Editor with live preview, publish |
| `/invitations/:id/preview` | Full-page preview (`?guest=Name`) |
| `/invitations/:id/guests` | Manage guests, copy link, WhatsApp |
| `/invitations/:id/guests/import` | Import guests from Excel/CSV |
| `/guests` | Choose an invitation's guest list |
| `/i/:code` | A guest's personal invitation and RSVP |

## Deploying

The server can serve the built React app itself, so the whole site runs as **one Node.js web service** at one address.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Start command | `npm start` |
| Node version | 20 or newer |

Environment variables on the host:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `CLIENT_URL` | your real address, e.g. `https://eventinvito.lk` (guest links use it) |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | a new long random value (not the one from your computer) |
| `TRUST_PROXY` | `1` on hosts that sit behind a proxy (most do) |

Then in Atlas → *Network Access*, allow the host's outgoing IP addresses (or `0.0.0.0/0` if the host doesn't have fixed ones; keep the database password strong). Run `npm run seed:templates` once against the production database.

The server refuses to start in production if `CLIENT_URL` isn't https or `JWT_SECRET` is missing or short.

## Security notes

- Passwords are hashed with bcrypt; sign-in uses JWTs that expire after 7 days.
- Every invitation and guest request checks that the invitation belongs to the signed-in user. Other users get "not found".
- Guest links are 192-bit random codes. The database stores only a SHA-256 hash (for lookup) and an AES-256-GCM encrypted copy (so the host can copy the link again).
- The guest page receives only the invitation content and that guest's name, with no other guests, contact details or counts. It is marked `noindex` and not cached.
- Rate limits: sign-up/sign-in 20 per 15 minutes, guest-link views 100 and RSVPs 30 per 15 minutes, per IP.
- Security headers via Helmet, including a content security policy and `Referrer-Policy: no-referrer`.
- Exported CSV reports are protected against spreadsheet formula injection.

## Troubleshooting

| Message | Fix |
|---|---|
| `querySrv ECONNREFUSED` / `ENOTFOUND` | Your network's DNS can't look up the Atlas address. The server already uses Google/Cloudflare DNS; if it persists, restart the router, change network, or set Windows DNS to 8.8.8.8. |
| `IP that isn't whitelisted` | Add your current IP in Atlas → Network Access. Home IPs change. |
| `bad auth` | The password in `MONGODB_URI` doesn't match the Atlas database user. |
| `JWT_SECRET is missing` | Add it to `server/.env` (see `.env.example`). |
| Client shows `Failed to resolve import …` | Run `npm install` in `client/`. |

## Not built yet

From the PRD: custom design packages and requests, the admin area (Phase 5), password reset (needs an email provider), photo uploads (needs a storage choice), and a fluent-speaker review of the Sinhala and Tamil wording.
