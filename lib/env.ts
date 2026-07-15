/**
 * Read-only access to server-only env vars. Throws on missing critical values
 * only when they are actually accessed, so the build can still pass without them.
 */
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  get steamApiKey() {
    return required("STEAM_API_KEY");
  },
  get tursoDatabaseUrl() {
    return process.env.TURSO_DATABASE_URL ?? "file:local.db";
  },
  get tursoAuthToken() {
    return process.env.TURSO_AUTH_TOKEN;
  },
  get authSecret() {
    return required("AUTH_SECRET");
  },
  get appBaseUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
  get steamCallbackBaseUrl() {
    return process.env.STEAM_CALLBACK_BASE_URL ?? this.appBaseUrl;
  },
};
