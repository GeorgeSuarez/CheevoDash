"use client";

// PROTOTYPE (throwaway): floating ?variant= switcher for the /login design
// exploration. Cycles variants with arrows or ←/→ keys. Renders nothing in
// production builds. Delete once a winner is folded into login/page.tsx.

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PrototypeVariant {
  key: string;
  name: string;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA"
  );
}

export function PrototypeSwitcher({
  variants,
  current,
}: {
  variants: PrototypeVariant[];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function cycle(direction: 1 | -1) {
    const index = variants.findIndex((v) => v.key === current);
    const next = variants[(index + direction + variants.length) % variants.length];
    goTo(next.key);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // Never ship the prototype bar.
  if (process.env.NODE_ENV === "production") return null;

  const active = variants.find((v) => v.key === current);

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card px-2 py-1.5 shadow-2xl shadow-black/60">
      <button
        type="button"
        aria-label="Previous variant"
        onClick={() => cycle(-1)}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-44 px-2 text-center text-xs font-medium tabular-nums">
        {active ? `${active.key} · ${active.name}` : current}
      </span>
      <button
        type="button"
        aria-label="Next variant"
        onClick={() => cycle(1)}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
