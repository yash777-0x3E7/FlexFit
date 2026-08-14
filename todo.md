# FlexFit Studio — Feature & Requirement Checklist

> Derived from [problem.md](file:///Users/apple/Documents/CODING/i2HR/problem.md) and [plan.md](file:///Users/apple/Documents/CODING/i2HR/plan.md), verified against the codebase.

---

## 1. Authentication & User Management

- [x] **Login** — Email + password login with session cookie (`auth.ts`)
- [x] **Registration** — New member sign-up with email, password, name, phone (`auth.ts`)
- [x] **Logout** — Session invalidation and cookie deletion (`auth.ts`)
- [x] **Session management** — Token-based sessions with 30-day expiry (`sessions` table)
- [x] **Role-based access** — `member`, `trainer`, `admin` roles enforced via tRPC middleware
- [x] **Account deactivation** — Deactivated accounts blocked at login (`user.active` check)
- [x] **Profile viewing** — Member can view own profile, membership, and attendance count (`members.profile`)
- [x] **Profile editing** — Member can update name and phone (`members.updateProfile`)

---

## 2. Membership Plans & Subscriptions

- [x] **List plans** — Public listing of active membership plans (`plans.list`)
- [x] **Subscribe to plan** — Member can purchase a plan; creates membership + payment record (`plans.subscribe`)
- [x] **Credit allocation** — Credits assigned from plan's `classCredits` on subscription
- [x] **Plan duration** — Membership end date auto-calculated from `durationDays`
- [x] **Membership statuses** — Supports `active`, `expired`, `cancelled`, `frozen`
- [x] **Admin: Create plan** — Admin can create new membership plans (`plans.create`)
- [x] **Admin: Toggle plan active/inactive** — Admin can activate/deactivate plans (`plans.setActive`)

---

## 3. Class Management

- [x] **List classes** — Public schedule with date filtering and spots-left calculation (`classes.list`)
- [x] **View class details** — Class info with combined roster (standard + corporate) (`classes.byId`)
- [x] **Create class** — Staff can create classes with name, trainer, room, capacity, time, cost (`classes.create`)
- [x] **Update class** — Staff can edit class name, room, capacity, time, trainer (`classes.update`)
- [x] **Cancel class (Admin)** — Admin cancels class, refunds all booked/waitlisted members, sends notifications (`classes.cancel`)
- [x] **Combined capacity calculation** — `spotsLeft` accounts for both standard and corporate bookings
- [x] **Trainer assignment** — Classes linked to trainers via `trainerId`

---

## 4. Standard Bookings

- [x] **Book a class** — Member books with active membership + sufficient credits (`bookings.book`)
- [x] **Credit deduction** — Credits deducted from membership on booking
- [x] **View my bookings** — Member sees their bookings with optional past history (`bookings.mine`)
- [x] **Cancel booking** — Member cancels; credits refunded if within free cancellation window (`bookings.cancel`)
- [x] **Staff cancellation** — Staff can cancel on behalf of member (bypasses time restriction)
- [x] **Waitlist auto-join** — If class is full, booking is created with `waitlisted` status
- [x] **Waitlist auto-promotion** — When a spot opens, top FIFO waitlisted member is auto-promoted (`waitlist.service.ts`)
- [x] **Waitlist promotion notification** — Promoted member receives a notification
- [x] **View waitlisted bookings** — Member sees waitlist positions (`bookings.waitlisted`)

---

## 5. Corporate Bookings

- [x] **Corporate booking** — Corporate member books using company credit pool (`corporateBookings.book`)
- [x] **Company credit deduction** — Credits deducted from `companies.creditPoolBalance`
- [x] **View corporate bookings** — Corporate member sees their corporate bookings (`corporateBookings.mine`)
- [x] **Cancel corporate booking** — Credits refunded to company pool (`corporateBookings.cancel`)
- [x] **Corporate waitlist** — Corporate bookings can be waitlisted with same FIFO logic
- [x] **Corporate check-in** — Staff can mark corporate booking attendance (`corporateBookings.markAttended`)
- [x] **Corporate roster** — Staff can view corporate class roster (`corporateBookings.rosterFor`)
- [x] **Fallback to personal booking** — If not a corporate member, `createCorporateBooking` falls back to standard booking

---

## 6. Rescheduling

- [x] **Reschedule booking** — Member moves booking from one class to another (`reschedules.reschedule`)
- [x] **Credit adjustment** — If new class costs more/less, credits are topped up or refunded
- [x] **Validate reschedule** — Pre-check if reschedule is valid (capacity, credits, etc.) (`reschedules.validateReschedule`)
- [x] **Reschedule history** — Member views past reschedules (`reschedules.history`)
- [x] **Waitlist promotion on reschedule** — When member leaves a class, waitlisted member auto-promoted

---

## 7. Check-ins & Attendance

- [x] **Mark attendance** — Staff marks `attended` status on bookings (`bookings.markAttended`)
- [x] **Check-in sources** — Supports `front_desk`, `kiosk`, `app` sources (`checkins` table)
- [x] **Duplicate check-in prevention** — Service prevents double check-ins
- [x] **Check-in count** — Staff can get check-in count per class (`bookings.checkinCountFor`)
- [x] **Kiosk mode** — Dedicated kiosk UI for member lookup and check-in (`/kiosk` page)
- [x] **Kiosk member lookup** — Find member by email/phone for kiosk check-in (`members.lookupByEmailOrPhone`)
- [x] **Upcoming bookings for member** — Staff sees member's upcoming bookings for check-in (`bookings.upcomingForMember`)

---

## 8. Payments & Financials

- [x] **View my payments** — Member sees their payment history with plan names (`payments.mine`)
- [x] **View all payments (Admin)** — Admin sees all payments with member info (`payments.all`)
- [x] **Mark payment as paid** — Admin updates pending payments to paid (`payments.markPaid`)
- [x] **Refund payment** — Admin refunds paid payments; cancels associated membership (`payments.refund`)
- [x] **Refund guard** — Refunded payments can't be marked paid; only paid can be refunded
- [x] **Payment methods** — Supports `card`, `cash`, `upi`, `transfer`

---

## 9. Notifications

- [x] **Unread count** — Member sees count of unread notifications (`notifications.unreadCount`)
- [x] **List notifications** — Member views notification history (`notifications.list`)
- [x] **Mark all as read** — Member marks all unread as read (`notifications.markAllAsRead`)
- [x] **Broadcast announcement** — Admin sends notification to all members (`notifications.broadcast`)
- [x] **Notification types** — `waitlist_promotion`, `class_cancelled`, `membership_expiring`, `announcement`
- [x] **Class cancellation notification** — Auto-sent when admin cancels a class
- [x] **Waitlist promotion notification** — Auto-sent when member is promoted from waitlist

---

## 10. Trainer Features

- [x] **View upcoming classes** — Trainer sees their assigned upcoming classes (`trainers.upcomingClasses`)
- [x] **View class roster** — Staff can view booked members per class (`bookings.rosterFor`)
- [x] **Set availability** — Trainer sets/updates availability per day-of-week (`trainers.setAvailability`)
- [x] **View availability** — Trainer views their current availability slots (`trainers.availability`)
- [x] **Remove availability** — Trainer removes availability for a specific day (`trainers.removeAvailability`)
- [x] **Check availability** — Staff checks if trainer is free for a given timeslot (`trainers.checkAvailability`)
- [x] **Conflict detection** — Checks for overlapping classes when validating trainer availability

---

## 11. Admin Dashboard & Reports

- [x] **Dashboard stats** — Total members, active memberships, upcoming classes, revenue, check-ins, pending payments (`admin.stats`)
- [x] **Class utilisation** — Booked vs. capacity ratio per class (`admin.classUtilisation`)
- [x] **Revenue by month** — Monthly revenue breakdown (`admin.revenueByMonth`)
- [x] **Revenue by method** — Revenue split by payment method (`admin.revenueByMethod`)
- [x] **Expiring memberships** — Members expiring within 14 days (`admin.expiringMemberships`)
- [x] **Refund count** — Total refunded payments (`admin.refundCount`)
- [x] **Check-ins per day** — Daily check-in trend (last 14 days) (`admin.checkinsPerDay`)
- [x] **Top trainers** — Trainers ranked by attended bookings (`admin.topTrainers`)
- [x] **No-show list** — Members who didn't attend booked classes (`admin.noShowList`)

---

## 12. Corporate / Company Management (Admin)

- [x] **List companies** — Admin views all registered companies (`adminCompanies.list`)
- [x] **Company details** — Admin views company info, members, and recent bookings (`adminCompanies.getById`)
- [x] **Create company** — Admin creates a new company with contact email and credit pool (`adminCompanies.create`)
- [x] **Toggle company active** — Admin activates/deactivates a company (`adminCompanies.updateActive`)
- [x] **Top up credits** — Admin adds credits to company pool (`adminCompanies.topUp`)
- [x] **Link member to company** — Admin associates a member with a company (`adminCompanies.linkMember`)
- [x] **Unlink member** — Admin removes a member from a company (`adminCompanies.unlinkMember`)
- [x] **Member role guard** — Only members (not trainers/admins) can be linked to companies

---

## 13. Member Management (Admin/Staff)

- [x] **Search members** — Staff searches members by name or email (`members.search`)
- [x] **View member details** — Staff views member profile + membership history (`members.byId`)
- [x] **Activate/deactivate account** — Admin toggles `active` on user account (`members.setActive`)
- [x] **Change member role** — Admin sets role to member/trainer/admin (`members.setRole`)

---

## 14. Architecture & Code Quality (from plan.md)

### Step 1: Domain Service Layer
- [x] `credit.service.ts` — Credit calculations, deductions, and refunds
- [x] `waitlist.service.ts` — FIFO waitlist queuing and auto-promotion
- [x] `booking.service.ts` — Booking creation, status transitions, check-ins, cancellations
- [x] `corporate.service.ts` — Company credit pools and corporate member verifications
- [x] `reschedule.service.ts` — Reschedule logic with credit adjustments

### Step 2: Refactored tRPC Routers
- [x] `bookings.ts` — Delegates to `bookingService` and `waitlistService`
- [x] `corporate-bookings.ts` — Delegates to `corporateService` and `bookingService`
- [x] `reschedules.ts` — Delegates to `rescheduleService`
- [x] `admin.ts` — Streamlined admin operations
- [x] `admin-companies.ts` — Streamlined company management

### Step 3: UI Component Organization
- [x] `components/common/` — NavBar, Modal, Badge, EmptyState, Feedback, PageHeader, StatTile
- [x] `components/booking/` — BookingCard, RescheduleModal, ScheduleClassCard, WaitlistEntry
- [x] `components/admin/` — Reports, CompanyForm, CompanyTopUpForm, LinkMemberForm, AnnouncementForm, AttendanceReports, OverviewLists
- [x] `components/kiosk/` — KioskFindMember, KioskMemberPanel
- [x] `components/trainer/` — AvailabilityEditor, TrainerClassCard

### Shared Constants
- [x] `src/lib/constants.ts` — Centralized `FREE_CANCELLATION_HOURS`, `UNLIMITED_CREDITS`, `FREE_RESCHEDULE_HOURS`, etc.

---

## 15. Verification & Testing (from plan.md)

- [x] **TypeScript strict compilation** — `npx tsc --noEmit` passes
- [x] **Production build** — `npm run build` succeeds
- [x] **Database reset** — `npm run db:reset` creates schema and seeds data
- [x] **Integration tests** — `booking.test.ts` covers capacity, waitlist promotion, corporate fallback
- [ ] **E2E: Member flow** — Log in as `rahul.k@example.com`, book class, view credits, join waitlist, cancel, verify auto-promotion
- [ ] **E2E: Trainer flow** — Log in as `arjun@flexfit.test`, check rosters, mark attendance
- [ ] **E2E: Admin flow** — Log in as `admin@flexfit.test`, inspect revenue, manage corporate credits, refund payments

---

## 16. App Pages / Routes

- [x] `/` — Landing / home page
- [x] `/login` — Login page
- [x] `/dashboard` — Member dashboard
- [x] `/schedule` — Class schedule browser
- [x] `/plans` — Membership plans listing
- [x] `/waitlist` — Waitlist status page
- [x] `/notifications` — Notification inbox
- [x] `/kiosk` — Front desk kiosk for check-ins
- [x] `/trainer/schedule` — Trainer's class schedule
- [x] `/admin` — Admin dashboard (stats overview)
- [x] `/admin/reports` — Revenue and attendance reports
- [x] `/admin/companies` — Corporate company management
- [x] `/admin/attendance` — Attendance management
- [x] `/admin/announcements` — Broadcast announcements

---

## 17. Database Schema (Entities)

- [x] `users` — Members, trainers, admins
- [x] `sessions` — Auth session tokens
- [x] `membershipPlans` — Available membership tiers
- [x] `memberships` — User-to-plan subscriptions
- [x] `classes` — Scheduled gym classes
- [x] `bookings` — Standard class bookings (with waitlist status)
- [x] `checkins` — Attendance check-in records
- [x] `payments` — Payment transactions
- [x] `notifications` — User notification inbox
- [x] `trainerAvailability` — Trainer weekly availability slots
- [x] `reschedules` — Reschedule audit trail
- [x] `companies` — Corporate entities with credit pools
- [x] `companyMembers` — User-to-company links
- [x] `corporateBookings` — Corporate class bookings (with waitlist status)

---

## Summary

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| Authentication & Users | 8 | 8 | 0 |
| Membership Plans | 7 | 7 | 0 |
| Class Management | 7 | 7 | 0 |
| Standard Bookings | 9 | 9 | 0 |
| Corporate Bookings | 8 | 8 | 0 |
| Rescheduling | 5 | 5 | 0 |
| Check-ins & Attendance | 7 | 7 | 0 |
| Payments & Financials | 6 | 6 | 0 |
| Notifications | 7 | 7 | 0 |
| Trainer Features | 7 | 7 | 0 |
| Admin Dashboard & Reports | 9 | 9 | 0 |
| Corporate Management | 8 | 8 | 0 |
| Member Management | 4 | 4 | 0 |
| Architecture & Code Quality | 16 | 16 | 0 |
| Verification & Testing | 7 | 4 | 3 |
| App Pages / Routes | 14 | 14 | 0 |
| Database Schema | 14 | 14 | 0 |
| **Total** | **147** | **144** | **3** |

> **3 remaining items** are the End-to-End persona verification flows (Member, Trainer, Admin) from Section 5 of the plan. These require manual browser testing against the running application.

---

## 18. Complete Website Workflows & User Journeys

This section details how the different personas (Members, Corporate Members, Trainers, Admins, and Front Desk Staff) interact in a complete end-to-end gym lifecycle.

### Workflow A: The Standard Member Journey (Membership to Booking)
1. **Account Creation**: A user visits `/` and registers at `/login?mode=register` (or logs in at `/login`).
2. **Buying a Membership**: 
   - Member navigates to `/plans`.
   - Member selects a plan (e.g., "Monthly Unlimited" or "10-Class Pack") and pays using a simulated payment method.
   - The system creates an `active` membership record and issues class credits to `creditsRemaining`.
3. **Browsing & Booking**:
   - Member visits `/schedule`.
   - Member views upcoming classes and clicks **Book Class**.
   - **System Checks**: Has active membership? Sufficient credits remaining? If yes, deduct credit and create a `booked` booking.
4. **Rescheduling / Cancellation**:
   - If the member cannot attend, they can visit `/dashboard` and reschedule the class (via [RescheduleModal.tsx](file:///Users/apple/Documents/CODING/i2HR/src/components/booking/RescheduleModal.tsx)).
   - If rescheduled within the free window, credits are refunded or adjusted.
   - If cancelled completely, credits are returned.

### Workflow B: The Waitlist Promotion Lifecycle
1. **Class Fills Up**: A class reaches its capacity (e.g., 10/10 spots filled).
2. **Joining the Waitlist**:
   - Next member books the class.
   - The system detects the class is full and registers the booking as `waitlisted`.
   - Member sees their position on the `/waitlist` page.
3. **Cancellation & Auto-Promotion**:
   - One of the booked members cancels their booking.
   - The waitlist engine (FIFO) runs immediately.
   - The top member on the waitlist is promoted to `booked`.
   - A notification of type `waitlist_promotion` is generated and appears in the promoted member's inbox (`/notifications`).

### Workflow C: The Corporate Booking Lifecycle
1. **Admin Setup**: Admin creates a company profile at `/admin/companies` and funds a corporate pool of credits.
2. **Employee Linking**: Admin links members (employees) to the company pool.
3. **Corporate Booking**:
   - The linked employee books a class.
   - The booking logic automatically checks if they are linked to an active company with a positive pool balance.
   - If true, credits are deducted from the company's shared pool balance rather than the member's individual membership.
4. **Cancellation**:
   - If the corporate booking is cancelled, credits are restored directly to the company pool.

### Workflow D: The Trainer Workflow
1. **Trainer Login**: Trainer logs in using trainer credentials.
2. **Setting Availability**: Trainer visits `/trainer/schedule` to set their working hours/availability.
3. **Assigned Classes**: Trainer views their roster of assigned upcoming classes.
4. **Attendance Tracking**: Trainer or Front Desk Staff views the class details and checks in members as they arrive.

### Workflow E: The Admin & Front Desk Check-in Flow
1. **Kiosk Check-in**: 
   - A member walks into the gym.
   - Staff/Kiosk at `/kiosk` searches for the member by email or phone.
   - Kiosk lists the member's upcoming classes (within 2 hours).
   - Staff clicks **Check In**, recording a check-in with source `kiosk` or `front_desk`.
2. **Revenue & Stats Auditing**:
   - Admin goes to `/admin` to view key performance stats (revenue, pending payments, daily check-in counts).
   - Admin views monthly revenue trends, payment methods, class utilization, top trainers, and no-shows at `/admin/reports`.