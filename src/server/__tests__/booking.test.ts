import { describe, it, expect, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@/db/schema";
import {
  createMemberBooking,
  cancelMemberBooking,
} from "../services/booking.service";
import {
  createCorporateBooking,
  cancelCorporateBooking,
} from "../services/corporate.service";

describe("FlexFit Studio Domain Services", () => {
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeEach(async () => {
    const client = createClient({ url: ":memory:" });
    db = drizzle(client, { schema });

    await client.executeMultiple(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'member',
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE membership_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price_cents INTEGER NOT NULL,
        duration_days INTEGER NOT NULL,
        class_credits INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES membership_plans(id),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        credits_remaining INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        credit_pool_balance INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE company_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        company_id INTEGER NOT NULL REFERENCES companies(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        trainer_id INTEGER REFERENCES users(id),
        room TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        starts_at TEXT NOT NULL,
        duration_min INTEGER NOT NULL DEFAULT 60,
        credit_cost INTEGER NOT NULL DEFAULT 1,
        cancelled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL REFERENCES classes(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        membership_id INTEGER REFERENCES memberships(id),
        status TEXT NOT NULL DEFAULT 'booked',
        credits_used INTEGER NOT NULL DEFAULT 0,
        booked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        cancelled_at TEXT
      );
      CREATE TABLE corporate_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL REFERENCES classes(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        company_id INTEGER NOT NULL REFERENCES companies(id),
        status TEXT NOT NULL DEFAULT 'booked',
        credits_used INTEGER NOT NULL DEFAULT 0,
        booked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        cancelled_at TEXT
      );
      CREATE TABLE reschedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        from_booking_id INTEGER NOT NULL REFERENCES bookings(id),
        to_booking_id INTEGER NOT NULL REFERENCES bookings(id),
        from_class_id INTEGER NOT NULL REFERENCES classes(id),
        to_class_id INTEGER NOT NULL REFERENCES classes(id),
        rescheduled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        booking_id INTEGER REFERENCES bookings(id),
        checked_in_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        source TEXT NOT NULL DEFAULT 'front_desk'
      );
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert mock seed data
    await db.insert(schema.users).values([
      { id: 1, email: "user1@test.com", passwordHash: "pass", name: "User One", role: "member" },
      { id: 2, email: "user2@test.com", passwordHash: "pass", name: "User Two", role: "member" },
      { id: 3, email: "corp1@test.com", passwordHash: "pass", name: "Corp One", role: "member" },
    ]);

    await db.insert(schema.membershipPlans).values({
      id: 1, name: "Basic Plan", priceCents: 5000, durationDays: 30, classCredits: 10,
    });

    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await db.insert(schema.memberships).values([
      { id: 1, userId: 1, planId: 1, startDate: "2026-01-01", endDate: futureDate, creditsRemaining: 5, status: "active" },
      { id: 2, userId: 2, planId: 1, startDate: "2026-01-01", endDate: futureDate, creditsRemaining: 5, status: "active" },
    ]);

    await db.insert(schema.companies).values({
      id: 1, name: "Acme Corp", contactEmail: "acme@test.com", creditPoolBalance: 20, active: true,
    });

    await db.insert(schema.companyMembers).values({
      id: 1, companyId: 1, userId: 3,
    });

    const futureClassTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await db.insert(schema.classes).values([
      { id: 1, name: "Yoga", room: "Studio A", capacity: 2, startsAt: futureClassTime, creditCost: 1 },
      { id: 2, name: "Yoga", room: "Studio A", capacity: 10, startsAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), creditCost: 1 },
    ]);
  });

  it("should combine standard and corporate bookings for class capacity and waitlisting", async () => {
    // Book spot 1 as standard member
    const b1 = await createMemberBooking(db, 1, 1);
    expect(b1.status).toBe("booked");
    expect(b1.creditsUsed).toBe(1);

    // Book spot 2 as corporate member
    const b2 = await createCorporateBooking(db, 3, 1);
    expect(b2.status).toBe("booked");
    expect(b2.creditsUsed).toBe(1);

    // Class has capacity 2 and now has 2 booked members (1 std + 1 corp)
    // Book spot 3 as standard member -> should be waitlisted!
    const b3 = await createMemberBooking(db, 2, 1);
    expect(b3.status).toBe("waitlisted");
    expect(b3.creditsUsed).toBe(0);
  });

  it("should promote waitlisted user when a spot is vacated via cancellation", async () => {
    const b1 = await createMemberBooking(db, 1, 1);
    const b2 = await createCorporateBooking(db, 3, 1);
    const b3 = await createMemberBooking(db, 2, 1); // waitlisted

    expect(b3.status).toBe("waitlisted");

    // Cancel b1
    await cancelMemberBooking(db, 1, b1.id, false);

    // b3 should now be promoted to booked
    const updatedB3 = await db.query.bookings.findFirst({
      where: (table, { eq }) => eq(table.id, b3.id),
    });
    expect(updatedB3?.status).toBe("booked");
    expect(updatedB3?.creditsUsed).toBe(1);
  });

  it("should support corporate member booking fallback from createMemberBooking", async () => {
    // User 3 has no individual membership, but has corporate company membership
    const b = await createMemberBooking(db, 3, 2);
    expect(b).toBeDefined();
    expect(b.status).toBe("booked");
  });
});
