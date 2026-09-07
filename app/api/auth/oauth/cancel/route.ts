import { NextResponse } from "next/server";
import { OAUTH_PENDING_COOKIE } from "@/lib/oauthSession";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OAUTH_PENDING_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
