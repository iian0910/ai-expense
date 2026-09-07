import { randomBytes } from "crypto";

export const OAUTH_STATE_COOKIE = "oauth_state";

export function generateOAuthState() {
  return randomBytes(16).toString("hex");
}
