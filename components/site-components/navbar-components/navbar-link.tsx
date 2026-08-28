import Link from "next/link";

import { cn } from "@/lib/utils";

type NavbarLinkProps = {
  href: string;
  label: string;
  isActive: boolean;
  children: React.ReactNode;
};

export function getNavbarItemClassName(isActive: boolean) {
  return cn(
    "group/link relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-lg border px-3 font-sans text-base font-bold uppercase tracking-[0.16em] text-white outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-red-400 sm:min-w-24 sm:px-4",
    isActive
      ? "border-red-500/45 bg-gradient-to-b from-red-900/60 to-red-950/35 text-white shadow-[0_0_18px_rgba(220,38,38,0.18),inset_0_1px_0_rgba(248,113,113,0.18)]"
      : "border-transparent hover:border-white/10 hover:bg-white/[0.045]",
  );
}

export function NavbarItemIndicator({ isActive }: { isActive: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-x-3 bottom-0 h-px origin-center bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)] transition-transform duration-300",
        isActive
          ? "scale-x-100"
          : "scale-x-0 group-hover/link:scale-x-100",
      )}
    />
  );
}

export function NavbarItemLabel({ label }: { label: string }) {
  return (
    <>
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </>
  );
}

export function NavbarLink({
  href,
  label,
  isActive,
  children,
}: NavbarLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      title={label}
      className={getNavbarItemClassName(isActive)}
    >
      <NavbarItemIndicator isActive={isActive} />
      {children}
      <NavbarItemLabel label={label} />
    </Link>
  );
}
