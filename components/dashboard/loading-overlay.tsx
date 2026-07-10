"use client";

import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";

export function LoadingOverlay({ message }: { message?: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      style={{
        animation: visible
          ? "loading-fade-in 0.2s ease-out"
          : "loading-fade-out 0.4s ease-out forwards",
      }}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Gamepad icon with pulsing animation */}
      <div className="relative mb-8">
        <div
          className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
          style={{ animation: "loading-pulse 1.5s ease-in-out infinite" }}
        />
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
          style={{ animation: "loading-pulse 1.5s ease-in-out infinite" }}
        >
          <Gamepad2 className="h-9 w-9 text-primary" />
        </div>
      </div>

      {/* Brand name */}
      <h1 className="mb-2 text-lg font-bold text-foreground">CheevoDash</h1>

      {/* Loading message */}
      <p className="mb-6 text-sm text-muted-foreground">
        {message ?? "Loading your achievements..."}
      </p>

      {/* Animated progress bar */}
      <div className="relative h-1 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute h-full w-12 rounded-full bg-primary"
          style={{ animation: "loading-bar 1.2s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}
