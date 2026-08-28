"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  Gamepad2,
  ShieldCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/members", label: "Members", icon: BadgeCheck },
  { href: "/admin/teams", label: "Games & Teams", icon: Gamepad2 },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
];

export function AdminNavbar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-[4.5rem] z-30 h-[calc(100vh-4.5rem)] w-16 shrink-0 border-r border-red-500/25 bg-black/95 font-sans font-bold text-white shadow-[12px_0_35px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:w-64">
      <div className="flex h-full flex-col px-2 py-5 lg:px-4">
        <div className="hidden border-b border-white/10 px-3 pb-5 lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-red-400">
            Management
          </p>
          <h2 className="mt-2 font-sans text-xl font-bold tracking-wide text-white">
            Admin Console
          </h2>
        </div>

        <nav
          aria-label="Admin navigation"
          className="mt-0 flex flex-col gap-2 lg:mt-5"
        >
          {adminLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                title={label}
                className={cn(
                  "group relative flex h-12 items-center justify-center gap-3 overflow-hidden rounded-lg border px-3 font-sans text-lg font-bold text-white outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-red-400 lg:justify-start",
                  isActive
                    ? "border-red-500/45 bg-gradient-to-r from-red-900/70 to-red-950/35 text-white shadow-[inset_0_1px_0_rgba(248,113,113,0.16),0_0_18px_rgba(220,38,38,0.12)]"
                    : "border-transparent hover:border-white/10 hover:bg-white/[0.05]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-2 left-0 w-px bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)] transition-transform",
                    isActive
                      ? "scale-y-100"
                      : "scale-y-0 group-hover:scale-y-100",
                  )}
                />
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-6 shrink-0",
                    isActive ? "text-red-300" : "text-white",
                  )}
                />
                <span className="hidden lg:inline">{label}</span>
                <span className="sr-only lg:hidden">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
