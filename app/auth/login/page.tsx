import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function safeRedirectPath(next: string | string[] | undefined) {
  return typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//")
    ? next
    : "/";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const supabase = await createClient();
  const [{ data }, params] = await Promise.all([
    supabase.auth.getClaims(),
    searchParams,
  ]);
  const redirectTo = safeRedirectPath(params.next);

  if (data?.claims) {
    redirect(redirectTo);
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
