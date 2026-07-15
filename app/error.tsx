"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We hit an unexpected error while loading this page. If it persists,
            check your Steam profile privacy and API key.
          </p>
        </div>
        <Button
          onClick={() => reset()}
          className="inline-flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </main>
  );
}
