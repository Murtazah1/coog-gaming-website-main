import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ avatar?: string | string[] }>;
}) {
  const params = await searchParams;
  const avatarNeedsRetry = params.avatar === "retry";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account. The confirmation link will sign you in
                and return you to the site.
              </p>
              {avatarNeedsRetry && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                  Your profile picture could not be saved. You can upload it
                  from your profile after confirming your account.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
