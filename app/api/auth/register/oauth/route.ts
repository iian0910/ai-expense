import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { mirrorAvatarToBlob } from "@/lib/oauthAvatar";
import { OAUTH_PENDING_COOKIE, getPendingOAuthProfile } from "@/lib/oauthSession";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/session";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const pending = await getPendingOAuthProfile();
  if (!pending) {
    return NextResponse.json(
      { error: "註冊資訊已過期，請重新使用快速登入" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : pending.name;

  try {
    await connectToDatabase();

    const existing = await User.findOne({ email: pending.email });
    if (existing) {
      return NextResponse.json({ error: "此 email 已被註冊" }, { status: 409 });
    }

    const avatarUrl = pending.avatarUrl
      ? await mirrorAvatarToBlob(pending.avatarUrl, `google-${pending.providerId}`)
      : null;

    const user = await User.create({
      email: pending.email,
      name,
      role: "member",
      avatarUrl,
      googleId: pending.providerId,
    });

    const token = await createSessionToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    response.cookies.set(OAUTH_PENDING_COOKIE, "", { path: "/", maxAge: 0 });

    return response;
  } catch (error) {
    console.error("Failed to complete OAuth registration:", error);
    return NextResponse.json({ error: "註冊失敗，請稍後再試" }, { status: 500 });
  }
}
