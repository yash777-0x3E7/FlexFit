"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const utils = trpc.useUtils();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: user } = trpc.auth.me.useQuery();
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      setIsMobileMenuOpen(false);
      router.push("/login");
    },
  });

  const isActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm font-bold transition-all duration-200 px-4 py-2 rounded-full ${isActive(path)
      ? "text-pastel-text bg-pastel-pink border border-pastel-purple shadow-sm shadow-pastel-pink/20"
      : "text-slate-500 hover:text-pastel-text hover:bg-pastel-pink/30"
    }`;

  const navLinks = (
    <>
      <Link href="/schedule" className={navLinkClass("/schedule")} onClick={() => setIsMobileMenuOpen(false)}>
        Schedule
      </Link>

      {user && (
        <>
          <Link href="/dashboard" className={navLinkClass("/dashboard")} onClick={() => setIsMobileMenuOpen(false)}>
            My Bookings
          </Link>
          <Link href="/waitlist" className={navLinkClass("/waitlist")} onClick={() => setIsMobileMenuOpen(false)}>
            Waitlist
          </Link>
        </>
      )}

      {user?.role === "trainer" && (
        <Link href="/trainer/schedule" className={navLinkClass("/trainer/schedule")} onClick={() => setIsMobileMenuOpen(false)}>
          Trainer Schedule
        </Link>
      )}

      {user?.role === "admin" && (
        <>
          <Link href="/admin" className={navLinkClass("/admin")} onClick={() => setIsMobileMenuOpen(false)}>
            Admin Portal
          </Link>
          <Link href="/admin/attendance" className={navLinkClass("/admin/attendance")} onClick={() => setIsMobileMenuOpen(false)}>
            Attendance
          </Link>
        </>
      )}

      {(user?.role === "admin" || user?.role === "trainer") && (
        <Link href="/kiosk" className={navLinkClass("/kiosk")} onClick={() => setIsMobileMenuOpen(false)}>
          Front Desk Kiosk
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-pastel-purple/30">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3.5 sm:px-6">
        <Link href="/" className="group mr-4 flex items-center gap-2 font-extrabold text-xl tracking-tight text-pastel-text">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pastel-pink to-pastel-purple shadow-sm shadow-pastel-pink/50 group-hover:scale-105 transition-transform">
            <span className="text-2xl">☁️</span>
          </div>
          StayFit
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks}
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
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col text-right">
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
            <div className="hidden sm:block">
              <Link href="/login" className="btn btn-sm btn-primary">
                Sign in
              </Link>
            </div>
          )}

          <button
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl px-4 py-4 space-y-2">
          {navLinks}
          <div className="pt-4 mt-4 border-t border-white/10">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">{user.name}</span>
                  <span className="text-xs font-medium text-cyan-400 capitalize">{user.role}</span>
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
              <Link href="/login" className="btn btn-sm btn-primary w-full justify-center" onClick={() => setIsMobileMenuOpen(false)}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
