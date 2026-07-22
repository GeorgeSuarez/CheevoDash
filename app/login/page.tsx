import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Gamepad2 } from "lucide-react";
import { SignInButton } from "@/components/dashboard/sign-in-button";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const { error } = await searchParams;
  const errorMessages: Record<string, string> = {
    auth_failed: "Steam could not verify your sign-in. Please try again.",
    no_steamid: "We couldn't read your Steam ID. Please try again.",
    db_error: "We couldn't save your profile. Your session still works.",
  };
  const errorMessage = error
    ? (errorMessages[error] ?? "Something went wrong.")
    : null;

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 overflow-hidden bg-background">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />

      {/* Content */}
      <div
        className="flex animate-fade-in flex-col items-center gap-4 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Gamepad2 className="h-8 w-8 text-primary-foreground" aria-hidden />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">CheevoDash</h1>
          <p className="mt-2 max-w-sm text-base text-muted-foreground">
            Sign in with Steam to track your achievements and compare your
            progress with friends.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <div className="animate-fade-in">
        <SignInButton />
      </div>

      <p className="max-w-sm animate-fade-in text-center text-xs text-muted-foreground">
        Your Steam profile and game details must be public for achievement
        tracking to work.
      </p>
    </main>
  );
}
