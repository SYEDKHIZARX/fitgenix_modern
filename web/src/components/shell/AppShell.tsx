"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Dumbbell,
  CalendarDays,
  LineChart,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthProvider";
import { useFit } from "@/context/FitgenixProvider";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/train", label: "Train", icon: Dumbbell },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({
  children,
  injuryPart,
}: {
  children: React.ReactNode;
  injuryPart?: string | null;
}) {
  const pathname = usePathname();
  const { userEmail, session, signOut, isGuest, configured } = useAuth();
  const { cloud } = useFit();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="glass sticky top-0 z-40 border-b border-white/[0.08]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/home" className="flex items-center gap-2">
            <span className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              FIT<span className="text-neon">GENIX</span>
            </span>
            <Badge tone="neon" className="hidden sm:inline-flex">
              AI Coach
            </Badge>
          </Link>
          <div className="flex items-center gap-2">
            {cloud && <Badge tone="success" className="hidden md:inline-flex">Synced</Badge>}
            {isGuest && configured && (
              <Link href="/login">
                <Badge tone="muted">Guest Mode</Badge>
              </Link>
            )}
            {injuryPart ? (
              <Badge tone="heat">Active Injury: {injuryPart}</Badge>
            ) : null}
            {session && (
              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[var(--text-secondary)] transition hover:border-neon/40 hover:text-neon"
                title={userEmail || "Sign out"}
              >
                <LogOut size={14} />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {userEmail || "Sign out"}
                </span>
              </button>
            )}
            {!session && configured && (
              <Link
                href="/login"
                className="text-xs font-bold uppercase tracking-wide text-neon hover:underline"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-6 px-4 pb-28 pt-5 lg:pb-8">
        {/* Desktop side rail */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-neon/10 text-neon border border-neon/30 shadow-[0_0_15px_rgba(232,255,0,0.1)]"
                      : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="glass fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-[3.5rem] flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[0.65rem] font-bold uppercase tracking-wide transition",
                  active ? "text-neon font-black" : "text-[var(--text-muted)]"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
                {active && (
                  <motion.span
                    layoutId="mobileNavDot"
                    className="mt-0.5 h-1 w-5 rounded-full bg-neon shadow-[0_0_10px_rgba(232,255,0,0.8)]"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
