A gym management app where everything works. It has been through five developers in two years, none of whom spoke to each other and all of whom were behind schedule.

Details:

Members book classes, buy memberships, spend class credits and sit on waitlists.

Staff run a front desk, manage trainers and pull revenue reports; companies buy credit pools for their employees to use.

Stack: Next.js 15 (App Router), TypeScript, tRPC, Drizzle ORM, SQLite, Tailwind. Around 5,400 lines across 40 files.

Notes:

Restructure and rewrite to sensible modern Next.js and TypeScript practice: break up files that have grown too big, and pull repeated logic into one place instead of four. If a file is doing two unrelated jobs, it probably shouldn't be.

There is no one correct folder layout. We mark whether the structure makes sense and whether you can explain why you picked it.

B. Project 1: What must not change

The app has to behave exactly the same when you're done.

Details:

Every feature that works today still works: same inputs, same outputs, same errors, same edge cases. A member who could book a class can still book it; an admin who could refund a payment can still refund it.

Nobody hands you a list of what the app currently does. Working that out, then protecting it while you change everything around it, is the exercise. How you go about that is up to you.

Staying in the TypeScript and leaving the database alone is fine.

Going further and changing the data model is also fine if you think the design needs it. We're not after a particular depth, we're after a decision you can defend.

Notes:

If you find something that looks wrong, you have two good options: fix it carefully, or write it up clearly and leave it alone. Either earns credit. Missing it doesn't.

Some references, if useful, are linked under Links & Logistics below.

