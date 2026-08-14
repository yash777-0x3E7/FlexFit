import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import {
  getMemberBookings,
  createMemberBooking,
  cancelMemberBooking,
  checkInMember,
  getClassRoster,
  getUpcomingForMember,
  getCheckinCount,
  getWaitlistedBookingsWithPosition,
} from "../services/booking.service";

export const bookingsRouter = router({
  mine: protectedProcedure
    .input(z.object({ includePast: z.boolean().default(false) }).default({}))
    .query(async ({ ctx, input }) => {
      return getMemberBookings(ctx.db, ctx.user.id, input.includePast);
    }),

  book: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return createMemberBooking(ctx.db, ctx.user.id, input.classId);
    }),

  cancel: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.user.role === "admin" || ctx.user.role === "trainer";
      return cancelMemberBooking(ctx.db, ctx.user.id, input.bookingId, isStaff);
    }),

  markAttended: staffProcedure
    .input(
      z.object({
        bookingId: z.number(),
        source: z.enum(["front_desk", "kiosk", "app"]).default("front_desk"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return checkInMember(ctx.db, input.bookingId, input.source);
    }),

  rosterFor: staffProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getClassRoster(ctx.db, input.classId);
    }),

  upcomingForMember: staffProcedure
    .input(z.object({ userId: z.number(), hoursAhead: z.number().default(2) }))
    .query(async ({ ctx, input }) => {
      return getUpcomingForMember(ctx.db, input.userId, input.hoursAhead);
    }),

  checkinCountFor: staffProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getCheckinCount(ctx.db, input.classId);
    }),

  waitlisted: protectedProcedure.query(async ({ ctx }) => {
    return getWaitlistedBookingsWithPosition(ctx.db, ctx.user.id);
  }),
});
