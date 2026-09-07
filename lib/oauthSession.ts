import { randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

export const OAUTH_STATE_COOKIE = "oauth_state";
export const OAUTH_PENDING_COOKIE = "oauth_pending";
const PENDING_MAX_AGE = 60 * 10; // 10 minutes

export interface PendingOAuthProfile {
  providerId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export function generateOAuthState() {
  return randomBytes(16).toString("hex");
}

export async function createPendingOAuthToken(profile: PendingOAuthProfile) {
  return new SignJWT({ ...profile })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_MAX_AGE}s`)
    .sign(secretKey);
}

export async function verifyPendingOAuthToken(token: string): Promise<PendingOAuthProfile | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (
      typeof payload.providerId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string"
    ) {
      return {
        providerId: payload.providerId,
        email: payload.email,
        name: payload.name,
        avatarUrl: typeof payload.avatarUrl === "string" ? payload.avatarUrl : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getPendingOAuthProfile(): Promise<PendingOAuthProfile | null> {
  const store = await cookies();
  const token = store.get(OAUTH_PENDING_COOKIE)?.value;
  if (!token) return null;
  return verifyPendingOAuthToken(token);
}
