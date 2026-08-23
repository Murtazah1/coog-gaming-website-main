import { BadgeCheck, CalendarClock, CalendarDays } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthenticatedUser } from "@/server/auth";
import { getOwnMembership } from "@/server/members";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

function formatDate(date: string | Date | null) {
  if (!date) {
    return "Not set";
  }

  const value = typeof date === "string" ? `${date}T00:00:00Z` : date;

  return dateFormatter.format(new Date(value));
}

export default async function MembershipPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/auth/login?next=/membership");
  }

  const membershipResult = await getOwnMembership();

  if (membershipResult.error) {
    redirect(
      "/auth/error?error=Unable%20to%20load%20your%20membership%20information",
    );
  }

  const membership = membershipResult.data;

  if (!membership) {
    notFound();
  }

  const planLabel =
    membership.planType === "year" ? "Annual membership" : "Semester membership";

  const details = [
    {
      label: "Membership plan",
      value: planLabel,
      icon: BadgeCheck,
    },
    {
      label: "Membership ends",
      value: formatDate(membership.currentPeriodEnd),
      icon: CalendarClock,
    },
    {
      label: "Member since",
      value: formatDate(membership.createdAt),
      icon: CalendarDays,
    },
  ];

  return (
    <section className="min-h-[calc(100vh-4.5rem)] bg-[url('/uh-site-background.png')] bg-cover bg-fixed px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.25em] text-red-400">
          Coog Gaming member
        </p>
        <h1 className="mt-2 font-heading text-3xl tracking-[0.08em] sm:text-4xl">
          Your membership
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-200">
          Review the plan and dates associated with your membership.
        </p>

        <Card className="mt-8 border-red-500/25 bg-black/80 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Membership information</CardTitle>
            <CardDescription className="text-zinc-300">
              These details are managed by Coog Gaming administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 md:grid-cols-3">
              {details.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
                >
                  <dt className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Icon
                      aria-hidden="true"
                      className="size-4 text-red-400"
                    />
                    {label}
                  </dt>
                  <dd className="mt-3 text-lg font-semibold text-white">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
