# Haven — property classifieds

Owner-listed homes for **rent** and **sale**. Buyers browse, save, and inquire. Owners manage listings from a private dashboard.

## Stack

- React 18 + Vite + Tailwind CSS (`/client`)
- Express + SQLite (`better-sqlite3`) (`/server`)
- Auth: email/password, JWT in an httpOnly cookie (`haven_token`)

## Setup

```bash
npm install
cp server/.env.example server/.env
npm run seed
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:4000

## Demo accounts

Password for every seeded user: `Password123!`

| Role | Email |
| --- | --- |
| Owner | `maya.chen@haven.test` |
| Owner | `james.okonkwo@haven.test` |
| Buyer | `alex.nguyen@haven.test` |
| Buyer | `jordan.lee@haven.test` |

Eight owners and twelve buyers are seeded, plus 108 listings, inquiries, and saved homes.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run seed` | Recreates SQLite and loads sample data |
| `npm run dev` | API (`--watch`) + Vite together |
| `npm run dev:server` / `dev:client` | Run one side |
| `npm test` | Run server unit tests with `node:test` |
| `npm run build` | Build client production bundle with Vite |

## Layout

- `server/src` — Express routes, SQLite, seed
- `server/data/property.db` — created on seed/start
- `client/src/pages` — buyer site and `/owner` dashboard

## Env (`server/.env`)

`PORT`, `JWT_SECRET`, `CLIENT_ORIGIN`, `DATABASE_PATH`, `COOKIE_SECURE`
