import type { Metadata } from "next";
import { Gamepad2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <LoginContent searchParams={searchParams} />;
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessages: Record<string, string> = {
    auth_failed: "Steam could not verify your sign-in. Please try again.",
    no_steamid: "We couldn't read your Steam ID. Please try again.",
  };
  const errorMessage = error
    ? (errorMessages[error] ?? "Something went wrong.")
    : null;

  return (
    <div className="flex w-full flex-col min-h-screen items-center justify-center gap-8 bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Gamepad2 className="h-8 w-8 text-primary-foreground" aria-hidden />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">CheevoDash</h1>
          <p className="mt-2 max-w-sm text-lg text-muted-foreground">
            Sign in with Steam to track your achievements and compare your
            progress with friends.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <a
        href="/auth/steam"
        className="inline-flex items-center gap-3 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/85"
      >
        <SteamIcon className="h-5 w-5" />
        Sign in through Steam
      </a>

      <p className="max-w-sm text-center text-lg text-muted-foreground">
        Your Steam profile and game details must be public for achievement
        tracking to work.
      </p>
    </div>
  );
}

function SteamIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M16 0C7.2 0 .1 7 .1 15.6l8.5 3.5c.7-.5 1.6-.8 2.6-.8h.2l3.8-5.5v-.1c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6h-.1l-5.4 3.9v.2c0 2.5-2 4.5-4.5 4.5-2.2 0-4-1.5-4.4-3.6L2.6 21C4.7 27.3 9.8 32 16 32c8.8 0 16-7.2 16-16S24.8 0 16 0zm-6 24.4l-2-.8c.3.7.9 1.3 1.7 1.6 1.7.7 3.6-.1 4.3-1.8.3-.8.3-1.7 0-2.5s-.9-1.4-1.7-1.8c-.8-.3-1.6-.3-2.4 0l2 .8c1.2.5 1.8 1.9 1.3 3.1s-1.9 1.8-3.2 1.4zm12.7-9.3c0-2.2-1.8-4-4-4s-4 1.8-4 4 1.8 4 4 4 4-1.8 4-4zm-7 0c0-1.7 1.3-3 3-3s3 1.3 3 3-1.3 3-3 3-3-1.3-3-3z" />
    </svg>
  );
}
