import Link from "next/link";
import {
  BadgeCheck,
  ChevronDown,
  CircleUserRound,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { SignOutButton } from "@/components/site-components/login-components/sign-out-button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  getNavbarItemClassName,
  NavbarItemIndicator,
  NavbarItemLabel,
  NavbarLink,
} from "./navbar-link";

export type AccountNavData = {
  isSignedIn: boolean;
  isMember: boolean;
  isAdmin: boolean;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
};

type AccountNavLinkProps = AccountNavData & {
  isActive: boolean;
};

export function AccountNavLink({
  isSignedIn,
  isMember,
  isAdmin,
  avatarUrl,
  firstName,
  lastName,
  isActive,
}: AccountNavLinkProps) {
  const initials =
    `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() ||
    "CG";

  if (!isSignedIn) {
    return (
      <NavbarLink href="/profile" label="Account" isActive={isActive}>
        <CircleUserRound
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
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-current={isActive ? "page" : undefined}
          title="Account"
          className={cn(
            getNavbarItemClassName(isActive),
            "data-[state=open]:border-red-500/45 data-[state=open]:bg-red-950/60",
          )}
        >
          <NavbarItemIndicator isActive={isActive} />
          <Avatar className="size-6 border border-red-400/50 bg-zinc-900 shadow-sm">
            <AvatarImage
              src={avatarUrl ?? undefined}
              alt=""
              className="object-cover"
            />
            <AvatarFallback className="bg-zinc-900 text-[0.65rem] font-semibold text-zinc-100">
              {initials}
            </AvatarFallback>
          </Avatar>
          <NavbarItemLabel label="Account" />
          <ChevronDown
            aria-hidden="true"
            className="hidden size-3.5 text-zinc-400 transition-transform group-data-[state=open]/link:rotate-180 sm:block"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 border-red-500/25 bg-black/95 p-2 text-zinc-100 shadow-xl backdrop-blur-xl"
      >
        <DropdownMenuItem
          asChild
          className="cursor-pointer py-2.5 text-base focus:bg-red-950/70 focus:text-white"
        >
          <Link href="/profile">
            <Settings aria-hidden="true" />
            Account settings
          </Link>
        </DropdownMenuItem>
        {isMember ? (
          <DropdownMenuItem
            asChild
            className="cursor-pointer py-2.5 text-base focus:bg-red-950/70 focus:text-white"
          >
            <Link href="/membership">
              <BadgeCheck aria-hidden="true" />
              View membership
            </Link>
          </DropdownMenuItem>
        ) : null}
        {isAdmin ? (
          <DropdownMenuItem
            asChild
            className="cursor-pointer py-2.5 text-base focus:bg-red-950/70 focus:text-white"
          >
            <Link href="/admin">
              <ShieldCheck aria-hidden="true" />
              Admin dashboard
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator className="bg-white/10" />
        <SignOutButton appearance="menu-item" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
