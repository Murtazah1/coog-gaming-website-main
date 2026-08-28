"use client";

import Image from "next/image";
import Link from "next/link";
import { Gamepad2, House, Info, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import {
  AccountNavLink,
  type AccountNavData,
} from "./account-nav-link";
import { NavbarLink } from "./navbar-link";

const links = [
  { href: "/", label: "Home", icon: House },
  { href: "/teams", label: "Teams", icon: UsersRound },
  { href: "/about", label: "About", icon: Info },
];

type NavbarClientProps = {
  account: AccountNavData;
};

export function NavbarClient({ account }: NavbarClientProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="sticky top-0 z-50 overflow-hidden border-b border-red-500/25 bg-black/90 text-white shadow-[0_14px_45px_rgba(0,0,0,0.65)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/80"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-60%,rgba(239,68,68,0.32),transparent_42%),linear-gradient(105deg,transparent_38%,rgba(127,29,29,0.12)_50%,transparent_62%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/90 to-transparent shadow-[0_0_14px_rgba(239,68,68,0.9)]"
      />

      <div className="relative mx-auto flex h-[4.5rem] max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Coog Gaming home"
          className="group flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
        >
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-1 rotate-45 border border-red-500/25 bg-red-950/30 transition duration-300 group-hover:rotate-[135deg] group-hover:border-red-400/60 group-hover:bg-red-900/30"
            />
            <Image
              src="/coog-gaming-logo.png"
              alt=""
              width={500}
              height={563}
              priority
              className="relative z-10 h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(239,68,68,0.32)] transition duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_14px_rgba(239,68,68,0.6)]"
            />
          </span>

          <span className="hidden min-w-0 items-center gap-3 md:flex">
            <span className="h-8 w-px bg-gradient-to-b from-transparent via-red-500/80 to-transparent" />
            <span className="flex flex-col leading-none">
              <span className="font-heading text-lg tracking-[0.16em] text-white transition-colors group-hover:text-red-100 lg:text-xl">
                COOG GAMING
              </span>
              <span className="mt-1.5 flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.28em] text-red-400">
                <Gamepad2 className="h-3 w-3" aria-hidden="true" />
                Cougar powered
              </span>
            </span>
          </span>
        </Link>

        <div className="relative flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.035] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_30px_rgba(0,0,0,0.35)]">
          <span
            aria-hidden="true"
            className="absolute -left-px -top-px h-3 w-3 border-l border-t border-red-400/70"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-px -right-px h-3 w-3 border-b border-r border-red-400/70"
          />

          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === href : pathname.startsWith(href);

            return (
              <NavbarLink
                key={href}
                href={href}
                label={label}
                isActive={isActive}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-red-300"
                      : "text-zinc-300 group-hover/link:text-red-400",
                  )}
                />
              </NavbarLink>
            );
          })}

          <AccountNavLink
            {...account}
            isActive={
              pathname.startsWith("/profile") ||
              pathname.startsWith("/membership") ||
              pathname.startsWith("/admin")
            }
          />
        </div>
      </div>
    </nav>
  );
}
