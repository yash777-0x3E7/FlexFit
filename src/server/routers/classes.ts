import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { classes, bookings, corporateBookings, users, notifications } from "@/db/schema";
import { router, publicProcedure, staffProcedure, adminProcedure } from "../trpc";
import { refundCredits, refundCorporateCredits } from "../services/credit.service";

export const classesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
          includeCancelled: z.boolean().default(false),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const filters = [];
      if (input.from) filters.push(gte(classes.startsAt, input.from));
      if (input.to) filters.push(lte(classes.startsAt, input.to));
      if (!input.includeCancelled) filters.push(eq(classes.cancelled, false));

      const rows = await ctx.db
        .select({
          id: classes.id,
          name: classes.name,
          description: classes.description,
          room: classes.room,
          capacity: classes.capacity,
          startsAt: classes.startsAt,
          durationMin: classes.durationMin,
          creditCost: classes.creditCost,
          cancelled: classes.cancelled,
          trainerName: users.name,
          booked: sql<number>`(
            (select count(*) from ${bookings} where ${bookings.classId} = ${classes.id} and ${bookings.status} = 'booked') +
            (select count(*) from ${corporateBookings} where ${corporateBookings.classId} = ${classes.id} and ${corporateBookings.status} = 'booked')
          )`.as("booked"),
        })
        .from(classes)
        .leftJoin(users, eq(classes.trainerId, users.id))
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(asc(classes.startsAt));

      return rows.map((r) => ({
        ...r,
        spotsLeft: Math.max(0, r.capacity - Number(r.booked)),
        full: Number(r.booked) >= r.capacity,
      }));
    }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const cls = await ctx.db
        .select()
        .from(classes)
        .where(eq(classes.id, input.id))
        .get();

      if (!cls) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
      }

      const stdRoster = await ctx.db
        .select({
          bookingId: bookings.id,
          status: bookings.status,
          memberName: users.name,
          memberEmail: users.email,
          isCorporate: sql<boolean>`0`,
        })
        .from(bookings)
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(eq(bookings.classId, cls.id));

      const corpRoster = await ctx.db
        .select({
          bookingId: corporateBookings.id,
          status: corporateBookings.status,
          memberName: users.name,
          memberEmail: users.email,
          isCorporate: sql<boolean>`1`,
        })
        .from(corporateBookings)
        .innerJoin(users, eq(corporateBookings.userId, users.id))
        .where(eq(corporateBookings.classId, cls.id));

      const roster = [...stdRoster, ...corpRoster];

      return { ...cls, roster };
    }),

  create: staffProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        trainerId: z.number().optional(),
        room: z.string().min(1),
        capacity: z.number().int().positive(),
        startsAt: z.string(),
        durationMin: z.number().int().positive().default(60),
        creditCost: z.number().int().min(0).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .insert(classes)
        .values({
          ...input,
          description: input.description ?? null,
          trainerId: input.trainerId ?? null,
        })
        .returning()
        .get();
    }),

  update: staffProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        room: z.string().min(1).optional(),
        capacity: z.number().int().positive().optional(),
        startsAt: z.string().optional(),
        trainerId: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      const updated = await ctx.db
        .update(classes)
        .set(patch)
        .where(eq(classes.id, id))
        .returning()
        .get();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
      }
      return updated;
    }),

  cancel: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const cls = await ctx.db
        .update(classes)
        .set({ cancelled: true })
        .where(eq(classes.id, input.id))
        .returning()
        .get();

      if (!cls) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
      }

      const stdActive = await ctx.db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.classId, input.id),
            inArray(bookings.status, ["booked", "waitlisted"]),
          ),
        );

      const corpActive = await ctx.db
        .select()
        .from(corporateBookings)
        .where(
          and(
            eq(corporateBookings.classId, input.id),
            inArray(corporateBookings.status, ["booked", "waitlisted"]),
          ),
        );

      const nowIso = new Date().toISOString();

      // Refund & cancel standard bookings
      for (const b of stdActive) {
        await ctx.db
          .update(bookings)
          .set({ status: "cancelled", cancelledAt: nowIso })
          .where(eq(bookings.id, b.id));

        if (b.creditsUsed > 0 && b.membershipId) {
          await refundCredits(ctx.db, b.membershipId, b.creditsUsed);
        }

        await ctx.db.insert(notifications).values({
          userId: b.userId,
          type: "class_cancelled",
          title: "Class Cancelled",
          message: `The class '${cls.name}' has been cancelled. Any used credits have been refunded.`,
        });
      }

      // Refund & cancel corporate bookings
      for (const cb of corpActive) {
        await ctx.db
          .update(corporateBookings)
          .set({ status: "cancelled", cancelledAt: nowIso })
          .where(eq(corporateBookings.id, cb.id));

        if (cb.creditsUsed > 0) {
          await refundCorporateCredits(ctx.db, cb.companyId, cb.creditsUsed);
        }

        await ctx.db.insert(notifications).values({
          userId: cb.userId,
          type: "class_cancelled",
          title: "Class Cancelled",
          message: `The class '${cls.name}' has been cancelled. Any used company credits have been refunded.`,
        });
      }

      return cls;
    }),
});
