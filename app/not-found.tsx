import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Gamepad2 } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
        <Gamepad2 className="h-8 w-8 text-primary-foreground" aria-hidden />
      </div>
      <div>
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-lg font-medium text-foreground">
          Page not found
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Button render={<Link href="/">Back to Dashboard</Link>} />
    </main>
  );
}
