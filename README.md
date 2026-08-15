# FlexFit Studio

Class booking and membership management for a single gym site. Members book classes, buy memberships and spend class credits. Staff run the front desk, manage trainers and pull reports. Companies buy credit pools their employees book against.

## Recent Improvements
We've recently added several key UI/UX improvements to the app:
- **Registration**: New members can now create accounts via the `/login` page.
- **Mobile Navigation**: Added a responsive hamburger menu for seamless usage on phones.
- **Skeleton Loaders**: Replaced plain text loading states with polished pulsing animations.
- **Confirmation Dialogs**: Destructive actions (like cancelling a booking) now ask "Are you sure?" before proceeding.

## Requirements

Node 20 or newer, and pnpm (or npm). If you don't have pnpm:

```bash
npm install -g pnpm
```

The database is SQLite and lives in a file. There's no server to install and no account to create.

## Getting set up

You can use either `pnpm` or standard `npm` to install and run the project:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

That gets you a populated studio at http://localhost:3000 with a couple of weeks of classes either side of today.

`db:push` creates `flexfit.db` and applies the schema. `db:seed` fills it with sample members, plans, classes and bookings.

## Signing in

| Role    | Email                  | Password   |
| ------- | ---------------------- | ---------- |
| Admin   | admin@flexfit.test     | admin123   |
| Trainer | arjun@flexfit.test     | trainer123 |
| Member  | rahul.k@example.com    | member123  |

Every seeded member uses `member123`. The other member emails are in `src/db/seed.ts`. You can also create a new member using the **Sign up** option on the login page.

## Commands

| Command         | What it does                                      |
| --------------- | ------------------------------------------------- |
| `npm run dev`      | Development server on port 3000                    |
| `npm run build`    | Production build                                   |
| `npm run db:push`  | Apply the schema in `src/db/schema.ts`             |
| `npm run db:seed`  | Wipe the data and reseed                           |
| `npm run db:reset` | Delete the database file, then push and seed again |

`db:reset` is the one you want when the data gets into a state you don't like. It's destructive and it's meant to be.

## Two things that will waste your time

Don't run `npm run build` while `npm run dev` is running. The build writes over the directory the dev server is using and the app starts throwing `MODULE_NOT_FOUND`. Nothing is actually broken. Stop the dev server, delete `.next`, start it again. If you want to typecheck while the server is up, use `npx tsc --noEmit` instead.

If you're changing anything in `src/db/schema.ts`, run `npm run db:push` afterwards or the app and the database will disagree with each other in confusing ways.

## Layout

```
src/
  app/          routes and pages
  components/   shared components
  db/           schema, client, seed data
  lib/          helpers
  server/       tRPC routers
documents/      empty, for your own notes
```
