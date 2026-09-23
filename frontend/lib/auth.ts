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

export const COOKIE_OPTIONS = {
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

export type AccessTokenClaims = {
  /** The user id, which /api/auth/refresh-token requires alongside the token. */
  sub: string;
  /** Expiry, in seconds since the epoch. */
  exp: number;
  /** The username. */
  unique_name?: string;
};

/**
 * Reads the payload without verifying the signature. Safe here because nothing
 * is trusted on the strength of it: the claims only decide when to refresh and
 * what name to display. Every request that matters is re-verified by the
 * backend, which rejects a token it did not sign.
 */
export function readAccessTokenClaims(token: string): AccessTokenClaims | null {
  const payload = token.split(".")[1];

  if (!payload) {
    return null;
  }

  try {
    const claims: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );

    if (
      typeof claims !== "object" ||
      claims === null ||
      typeof (claims as AccessTokenClaims).sub !== "string" ||
      typeof (claims as AccessTokenClaims).exp !== "number"
    ) {
      return null;
    }

    return claims as AccessTokenClaims;
  } catch {
    return null;
  }
}

/**
 * Treats a token expiring within the skew window as already expired, so a
 * request does not set off mid-flight against a backend with ClockSkew zero.
 */
export function isAccessTokenExpired(
  claims: AccessTokenClaims,
  skewSeconds = 30,
): boolean {
  return claims.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

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
