import "server-only";

import { cookies } from "next/headers";

import type { TokenResponse } from "@/lib/api";

export const ACCESS_TOKEN_COOKIE = "ledger_access_token";
export const REFRESH_TOKEN_COOKIE = "ledger_refresh_token";

// Matches the backend's 7-day refresh token. The access token expires after 15
// minutes via its own exp claim, but its cookie deliberately outlives that: the
// refresh step reads the user id out of the expired token, so discarding the
// cookie at 15 minutes would make renewal impossible.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// Settings both session cookies are written with. Every flag here is doing a
// specific job, so none of them is safe to drop.
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
  // The user id, which /api/auth/refresh-token requires alongside the token.
  sub: string;
  // Expiry, in seconds since the epoch.
  exp: number;
  // The username, shown in the sidebar.
  unique_name?: string;
};

// Decodes the access token's payload without verifying its signature, and
// returns null for anything malformed. Safe because nothing is granted on the
// strength of it: the claims only decide when proxy.ts should refresh and what
// name the sidebar shows. Every request that matters is re-verified by the
// backend, which rejects a token it did not sign.
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

// Treats a token expiring within the next 30 seconds as already expired, so a
// request cannot set off valid and arrive expired. The backend is configured
// with ClockSkew zero, so it allows no leeway of its own.
export function isAccessTokenExpired(
  claims: AccessTokenClaims,
  skewSeconds = 30,
): boolean {
  return claims.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

// Stores both tokens as HttpOnly cookies, which is what "signed in" means here.
// Called by the login and register actions once the backend returns a pair.
// Only callable from a Server Action or Route Handler, because only those may
// write cookies.
export async function createSession(tokens: TokenResponse): Promise<void> {
  const store = await cookies();

  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, COOKIE_OPTIONS);
  store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
}

// Reads both tokens back out of the cookies, or null if either is missing.
// The single place identity enters the server: apiFetchAuthed, the pages and
// proxy.ts all start from here rather than from anything the client sent.
export async function getSession(): Promise<Session | null> {
  const store = await cookies();

  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

// Deletes both cookies. Called by the signOut action after the backend has
// already cleared the stored refresh token hash — this only removes the local
// copy, so it is the second half of signing out, not the whole of it.
export async function clearSession(): Promise<void> {
  const store = await cookies();

  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}
