import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import {
  getCorporateBookings,
  createCorporateBooking,
  cancelCorporateBooking,
  checkInCorporateMember,
  getCorporateClassRoster,
} from "../services/corporate.service";

export const corporateBookingsRouter = router({
  mine: protectedProcedure
    .input(z.object({ includePast: z.boolean().default(false) }).default({}))
    .query(async ({ ctx, input }) => {
      return getCorporateBookings(ctx.db, ctx.user.id, input.includePast);
    }),

  book: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return createCorporateBooking(ctx.db, ctx.user.id, input.classId);
    }),

  cancel: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.user.role === "admin" || ctx.user.role === "trainer";
      return cancelCorporateBooking(ctx.db, ctx.user.id, input.bookingId, isStaff);
    }),

  markAttended: staffProcedure
    .input(
      z.object({
        bookingId: z.number(),
        source: z.enum(["front_desk", "kiosk", "app"]).default("front_desk"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return checkInCorporateMember(ctx.db, input.bookingId);
    }),

  rosterFor: staffProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getCorporateClassRoster(ctx.db, input.classId);
    }),
});
