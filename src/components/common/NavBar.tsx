"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const utils = trpc.useUtils();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      router.push("/login");
    },
  });

  const isActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-lg ${
      isActive(path)
        ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-sm shadow-cyan-500/10"
        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3.5 sm:px-6">
        <Link href="/" className="group mr-4 flex items-center gap-2 font-extrabold text-lg tracking-tight text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white text-xs font-black">FF</span>
          </div>
          FlexFit<span className="text-cyan-400">.</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/schedule" className={navLinkClass("/schedule")}>
            Schedule
          </Link>

          {user && (
            <>
              <Link href="/dashboard" className={navLinkClass("/dashboard")}>
                My Bookings
              </Link>
              <Link href="/waitlist" className={navLinkClass("/waitlist")}>
                Waitlist
              </Link>
            </>
          )}

          {user?.role === "trainer" && (
            <Link href="/trainer/schedule" className={navLinkClass("/trainer/schedule")}>
              Trainer Schedule
            </Link>
          )}

          {user?.role === "admin" && (
            <>
              <Link href="/admin" className={navLinkClass("/admin")}>
                Admin Portal
              </Link>
              <Link href="/admin/attendance" className={navLinkClass("/admin/attendance")}>
                Attendance
              </Link>
            </>
          )}

          {(user?.role === "admin" || user?.role === "trainer") && (
            <Link href="/kiosk" className={navLinkClass("/kiosk")}>
              Front Desk Kiosk
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {user && (
            <Link
              href="/notifications"
              className="relative p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-slate-300 hover:text-white"
              title="Notifications"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount && unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 ring-2 ring-slate-950">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                <span className="text-[10px] font-medium text-cyan-400 capitalize">{user.role}</span>
              </div>
              <button
                className="btn btn-sm text-slate-300 hover:text-white hover:border-rose-500/30 hover:bg-rose-500/10"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-sm btn-primary">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
