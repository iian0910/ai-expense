import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthorizeUrl, isGoogleConfigured } from "@/lib/oauth";
import { OAUTH_STATE_COOKIE, generateOAuthState } from "@/lib/oauthSession";

export async function GET(request: NextRequest) {
  if (!isGoogleConfigured()) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "oauth_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const state = generateOAuthState();
  const response = NextResponse.redirect(buildGoogleAuthorizeUrl(request.nextUrl.origin, state));

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
