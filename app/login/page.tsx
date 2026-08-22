import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  LoginVariantA,
  LoginVariantB,
  LoginVariantC,
} from "./login-prototype";
import { PrototypeSwitcher } from "@/components/ui/prototype-switcher";

export const metadata: Metadata = {
  title: "Sign in",
};

// PROTOTYPE (throwaway): three login designs behind ?variant= — see
// ./login-prototype.tsx. Fold the winner into this page, then delete the
// variants and the switcher.

const VARIANTS = [
  { key: "A", name: "Split showcase" },
  { key: "B", name: "Poster" },
  { key: "C", name: "Glass over app" },
] as const;

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
  searchParams: Promise<{ error?: string; variant?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const { error, variant } = await searchParams;
  const current = VARIANTS.find((v) => v.key === variant)?.key ?? "A";
  const errorMessage = error ? errorMessageFor(error) : null;

  const props = { errorMessage };

  return (
    <>
      {current === "A" && <LoginVariantA {...props} />}
      {current === "B" && <LoginVariantB {...props} />}
      {current === "C" && <LoginVariantC {...props} />}
      <PrototypeSwitcher
        variants={[...VARIANTS]}
        current={current}
      />
    </>
  );
}
