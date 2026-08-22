import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flame, Gamepad2, Lock, Target, Trophy } from "lucide-react";
import { getSession } from "@/lib/auth";
import { SignInButton } from "@/components/dashboard/sign-in-button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
};

// Illustrative numbers so the showcase panel reads like the real product.
// The caption below spells out that they're preview data.
const PROOF_STATS = [
  { icon: Trophy, value: "12,847", label: "achievements unlocked" },
  { icon: Flame, value: "34", label: "unlocked this month" },
  { icon: Target, value: "96%", label: "average completion" },
];

const PROOF_ROWS = [
  { name: "Elden Ring", pct: 98, note: "2 to go" },
  { name: "Hades", pct: 100, note: "Perfect" },
  { name: "Baldur's Gate 3", pct: 61, note: "18 of 54" },
];

function errorMessageFor(code: string): string {
  switch (code) {
    case "auth_failed":
      return "Steam could not verify your sign-in. Please try again.";
    case "no_steamid":
      return "We couldn't read your Steam ID. Please try again.";
    case "db_error":
      return "We couldn't save your profile. Your session still works.";
    default:
      return "Something went wrong.";
  }
}

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
  const errorMessage = error ? errorMessageFor(error) : null;

  return (
    <main className="grid min-h-screen w-full lg:grid-cols-[1.15fr_1fr]">
      {/* Showcase — desktop only; mobile gets the compact brand header instead */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border/60 bg-card/40 p-10 lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" aria-hidden />
          </div>
          <span className="text-lg font-semibold">CheevoDash</span>
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            A lifetime of Steam achievements,{" "}
            <span className="text-primary">finally worth looking at.</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Completion rates, rarity hunts, friend leaderboards — your whole
            library, decoded.
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-4">
            {PROOF_STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border/60 bg-background/60 p-4"
              >
                <s.icon className="h-4 w-4 text-primary" aria-hidden />
                <dd className="mt-2 text-2xl font-bold tabular-nums">{s.value}</dd>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>

          <ul className="mt-8 space-y-3">
            {PROOF_ROWS.map((g) => (
              <li
                key={g.name}
                className="rounded-xl border border-border/60 bg-background/60 p-3"
              >
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{g.name}</span>
                  <span className="tabular-nums text-muted-foreground">{g.note}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${g.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Preview data shown — yours replaces it after sign-in.
        </p>
      </section>

      {/* Sign-in */}
      <section className="flex flex-col items-center justify-center gap-6 p-8">
        <div className="flex flex-col items-center gap-3 text-center lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Gamepad2 className="h-6 w-6 text-primary-foreground" aria-hidden />
          </div>
          <span className="text-xl font-semibold">CheevoDash</span>
        </div>

        <Card className="w-full max-w-sm border-border/70">
          <CardContent className="flex flex-col items-start gap-5 p-7 pt-7">
            <div>
              <h2 className="text-xl font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use your Steam account. We never see your password.
              </p>
            </div>
            {errorMessage && (
              <div
                role="alert"
                className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}
            <SignInButton />
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              Your Steam profile and game details must be public for achievement
              tracking to work.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
