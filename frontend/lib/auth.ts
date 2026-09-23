import "server-only";

import { cookies } from "next/headers";

import type { TokenResponse } from "@/lib/api";

export const ACCESS_TOKEN_COOKIE = "ledger_access_token";
export const REFRESH_TOKEN_COOKIE = "ledger_refresh_token";

/**
 * Matches the backend's 7-day refresh token. The access token expires after 15
 * minutes via its own `exp` claim, which the backend enforces; its cookie
 * deliberately outlives that so an expired token can still be exchanged for a
 * fresh pair instead of forcing a new login.
 */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const COOKIE_OPTIONS = {
  // Neither token is readable from JavaScript, so an XSS bug cannot steal them.
  httpOnly: true,
  // Development runs over plain http, where a Secure cookie would be dropped.
  secure: process.env.NODE_ENV === "production",
  // Lax still blocks the cookies on cross-site POSTs, which is the CSRF case
  // that matters here, while keeping them on ordinary top-level navigation.
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
} as const;

export type Session = {
  accessToken: string;
  refreshToken: string;
};

/** Only callable from a Server Action or Route Handler. */
export async function createSession(tokens: TokenResponse): Promise<void> {
  const store = await cookies();

  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, COOKIE_OPTIONS);
  store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();

  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

/** Only callable from a Server Action or Route Handler. */
export async function clearSession(): Promise<void> {
  const store = await cookies();

  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}
