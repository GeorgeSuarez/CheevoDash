import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

export async function GET() {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${env.appBaseUrl}/auth/steam/callback`,
    "openid.realm": env.appBaseUrl,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.ns.pape": "http://specs.openid.net/extensions/pape/1.0",
    "openid.pape.max_auth_age": "0",
  });

  return NextResponse.redirect(`${STEAM_OPENID_URL}?${params.toString()}`);
}
