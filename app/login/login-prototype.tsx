// PROTOTYPE (throwaway): three structurally different /login designs,
// switchable via ?variant= on the login route. Question: "what should the
// landing/login page look like?" Delete once a winner is folded in.
//
//   A · Split showcase — marketing panel with fake dashboard proof, sign-in card right
//   B · Poster        — editorial full-bleed type, no card, one dominant CTA
//   C · Glass over app— blurred fake-dashboard backdrop, frosted auth card floating

import {
  Flame,
  Gamepad2,
  Lock,
  Target,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SignInButton } from "@/components/dashboard/sign-in-button";

export interface LoginVariantProps {
  errorMessage: string | null;
}

function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const icon = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <div className={`flex ${box} items-center justify-center rounded-xl bg-primary`}>
      <Gamepad2 className={`${icon} text-primary-foreground`} aria-hidden />
    </div>
  );
}

// --- Fake dashboard proof data (hardcoded, read-only) -----------------------

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

// --- A · Split showcase ------------------------------------------------------

export function LoginVariantA({ errorMessage }: LoginVariantProps) {
  return (
    <main className="grid min-h-screen w-full lg:grid-cols-[1.15fr_1fr]">
      {/* Showcase */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border/60 bg-card/40 p-10 lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <BrandMark />
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
              <div key={s.label} className="rounded-xl border border-border/60 bg-background/60 p-4">
                <s.icon className="h-4 w-4 text-primary" aria-hidden />
                <dd className="mt-2 text-2xl font-bold tabular-nums">{s.value}</dd>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>

          <ul className="mt-8 space-y-3">
            {PROOF_ROWS.map((g) => (
              <li key={g.name} className="rounded-xl border border-border/60 bg-background/60 p-3">
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

        <p className="text-xs text-muted-foreground">Fake preview data — yours replaces it after sign-in.</p>
      </section>

      {/* Sign-in */}
      <section className="flex flex-col items-center justify-center gap-6 p-8">
        <div className="flex flex-col items-center gap-3 text-center lg:hidden">
          <BrandMark size="lg" />
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
              <div role="alert" className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
            <SignInButton />
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              Your Steam profile and game details must be public for achievement tracking to work.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

// --- B · Poster --------------------------------------------------------------

export function LoginVariantB({ errorMessage }: LoginVariantProps) {
  return (
    <main className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden p-8 sm:p-12 lg:p-16">
      {/* Oversized ghost wordmark */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 select-none text-[22rem] font-bold leading-none tracking-tighter text-foreground/[0.025] xl:block"
      >
        GG
      </span>

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="font-semibold">CheevoDash</span>
        </div>
        <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
          Steam Web API · OpenID
        </span>
      </header>

      <div className="max-w-4xl">
        <h1 className="text-5xl font-bold leading-[0.95] tracking-tighter sm:text-7xl lg:text-8xl">
          Every achievement
          <br />
          you&rsquo;ve ever earned.
          <br />
          <span className="text-primary">One screen.</span>
        </h1>
        <p className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg">
          Completion, rarity, friends — your Steam library with the numbers
          turned up.
        </p>
        {errorMessage && (
          <p role="alert" className="mt-6 max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <div className="mt-10 scale-125 origin-left">
          <SignInButton />
        </div>
      </div>

      <footer className="max-w-md text-xs text-muted-foreground">
        Your Steam profile and game details must be public for achievement tracking to work.
      </footer>
    </main>
  );
}

// --- C · Glass over app --------------------------------------------------------

function DashboardBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none blur-[6px]"
    >
      <div className="flex h-full">
        {/* sidebar mock */}
        <aside className="hidden w-56 shrink-0 flex-col gap-2 border-r border-border/60 bg-card/50 p-5 md:flex">
          <div className="mb-4 flex items-center gap-2">
            <BrandMark />
            <span className="font-semibold">CheevoDash</span>
          </div>
          {["Overview", "Games", "Achievements", "Friends", "Insights"].map((item) => (
            <span key={item} className="rounded-lg px-3 py-2 text-sm text-muted-foreground">
              {item}
            </span>
          ))}
        </aside>
        {/* content mock */}
        <div className="flex-1 p-6 lg:p-10">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[["12,847", "earned"], ["87.4%", "avg completion"], ["212", "games owned"], ["41", "perfect"]].map(
              ([value, label]) => (
                <div key={label} className="rounded-xl border border-border/60 bg-card/60 p-4">
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ),
            )}
          </div>
          <div className="mt-6 space-y-4">
            {PROOF_ROWS.map((g) => (
              <div key={g.name} className="rounded-xl border border-border/60 bg-card/60 p-4">
                <div className="flex items-baseline justify-between text-sm font-medium">
                  <span>{g.name}</span>
                  <span className="tabular-nums text-muted-foreground">{g.pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginVariantC({ errorMessage }: LoginVariantProps) {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background">
      <DashboardBackdrop />
      <div className="absolute inset-0 bg-background/55" />

      <div className="relative flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md border-white/10 bg-card/75 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center gap-6 p-9 pt-9 text-center">
            <BrandMark size="lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome back, gamer.</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This is your dashboard waiting behind the glass. Sign in through
                Steam to make it real.
              </p>
            </div>
            {errorMessage && (
              <div role="alert" className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
            <SignInButton />
            <p className="text-xs text-muted-foreground">
              Your Steam profile and game details must be public for achievement tracking to work.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
