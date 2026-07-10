import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { createSession } from "@/lib/auth";
import { env } from "@/lib/env";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_PREFIX = "https://steamcommunity.com/openid/id/";

interface PlayerSummary {
  steamid: string;
  personaname: string;
  avatarfull: string;
}

async function verifyOpenId(params: URLSearchParams): Promise<boolean> {
  const verifyParams = new URLSearchParams(params);
  verifyParams.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });
  const text = await res.text();
  return text.includes("is_valid:true");
}

function extractSteamId(params: URLSearchParams): string | null {
  const claimedId = params.get("openid.claimed_id");
  if (!claimedId?.startsWith(STEAM_ID_PREFIX)) return null;
  return claimedId.slice(STEAM_ID_PREFIX.length);
}

async function getPlayerSummary(
  steamId: string,
): Promise<PlayerSummary | null> {
  const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
  url.searchParams.set("key", env.steamApiKey);
  url.searchParams.set("steamids", steamId);
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const player = json?.response?.players?.[0];
  return player ?? null;
}

async function upsertUser(steamId: string): Promise<void> {
  const summary = await getPlayerSummary(steamId);
  const existing = await getDb()
    .select()
    .from(users)
    .where(eq(users.steamId, steamId))
    .limit(1);

  if (existing.length > 0) {
    if (summary) {
      await getDb()
        .update(users)
        .set({
          personaName: summary.personaname,
          avatar: summary.avatarfull,
        })
        .where(eq(users.steamId, steamId));
    }
    return;
  }

  await getDb().insert(users).values({
    steamId,
    personaName: summary?.personaname ?? `Player ${steamId.slice(-4)}`,
    avatar: summary?.avatarfull ?? null,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const isValid = await verifyOpenId(params);
  if (!isValid) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", env.appBaseUrl));
  }

  const steamId = extractSteamId(params);
  if (!steamId) {
    return NextResponse.redirect(new URL("/login?error=no_steamid", env.appBaseUrl));
  }

  try {
    await upsertUser(steamId);
  } catch (err) {
    console.error("Failed to upsert user:", err);
    // Continue to session creation even if DB write fails (user can still use the app)
  }

  await createSession(steamId);
  return NextResponse.redirect(new URL("/", env.appBaseUrl));
}
