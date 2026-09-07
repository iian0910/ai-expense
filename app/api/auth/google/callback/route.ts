import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { exchangeGoogleCode } from "@/lib/oauth";
import { mirrorAvatarToBlob } from "@/lib/oauthAvatar";
import {
  OAUTH_PENDING_COOKIE,
  OAUTH_STATE_COOKIE,
  createPendingOAuthToken,
} from "@/lib/oauthSession";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/session";
import User from "@/models/User";

const CLEAR_STATE_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    loginUrl.searchParams.set("error", "oauth_state_mismatch");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(OAUTH_STATE_COOKIE, "", CLEAR_STATE_COOKIE);
    return response;
  }

  try {
    const profile = await exchangeGoogleCode(code, request.nextUrl.origin);

    if (!profile.email) {
      loginUrl.searchParams.set("error", "oauth_no_email");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set(OAUTH_STATE_COOKIE, "", CLEAR_STATE_COOKIE);
      return response;
    }

    const email = profile.email.toLowerCase();

    await connectToDatabase();

    let user = await User.findOne({ googleId: profile.providerId });

    if (!user) {
      const existingByEmail = await User.findOne({ email });
      if (existingByEmail) {
        existingByEmail.set("googleId", profile.providerId);
        if (!existingByEmail.avatarUrl && profile.avatarUrl) {
          const mirroredAvatarUrl = await mirrorAvatarToBlob(profile.avatarUrl, `google-${profile.providerId}`);
          if (mirroredAvatarUrl) {
            existingByEmail.avatarUrl = mirroredAvatarUrl;
          }
        }
        await existingByEmail.save();
        user = existingByEmail;
      }
    }

    if (user) {
      const token = await createSessionToken({
        sub: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      });

      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
      response.cookies.set(OAUTH_STATE_COOKIE, "", CLEAR_STATE_COOKIE);
      return response;
    }

    // No account found for this identity yet — hand off to the register page
    // to finish sign-up using the profile info we just retrieved.
    const pendingToken = await createPendingOAuthToken({
      providerId: profile.providerId,
      email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });

    const response = NextResponse.redirect(new URL("/register?oauth=1", request.url));
    response.cookies.set(OAUTH_PENDING_COOKIE, pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    response.cookies.set(OAUTH_STATE_COOKIE, "", CLEAR_STATE_COOKIE);
    return response;
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    loginUrl.searchParams.set("error", "oauth_failed");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(OAUTH_STATE_COOKIE, "", CLEAR_STATE_COOKIE);
    return response;
  }
}
