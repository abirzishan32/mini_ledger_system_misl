import { NextResponse, type NextRequest } from "next/server";

import { refreshTokens } from "@/lib/api";
import {
  ACCESS_TOKEN_COOKIE,
  COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
  isAccessTokenExpired,
  readAccessTokenClaims,
} from "@/lib/auth";

const AUTH_PATHS = ["/login", "/register"];
const PROTECTED_PREFIX = "/dashboard";

/**
 * Routes traffic based on the session cookies and renews an expired access
 * token before the page renders.
 *
 * This is a convenience layer, not the security boundary. Server Functions are
 * POSTs to the route that declares them, so a matcher change could silently
 * drop coverage. Every page and action checks the session itself as well.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const onAuthPath = AUTH_PATHS.includes(pathname);
  const onProtectedPath =
    pathname === PROTECTED_PREFIX ||
    pathname.startsWith(`${PROTECTED_PREFIX}/`);

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const claims = accessToken ? readAccessTokenClaims(accessToken) : null;

  if (!refreshToken || !claims) {
    return onProtectedPath ? redirectTo("/login", request) : NextResponse.next();
  }

  if (onAuthPath) {
    return redirectTo(PROTECTED_PREFIX, request);
  }

  if (!isAccessTokenExpired(claims)) {
    return NextResponse.next();
  }

  const refreshed = await refreshTokens(claims.sub, refreshToken);

  if (!refreshed.success || !refreshed.data) {
    // The refresh token is spent, expired or revoked. Drop the cookies so the
    // next request is treated as a clean signed-out visit.
    const response = onProtectedPath
      ? redirectTo("/login", request)
      : NextResponse.next();

    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  // Rewrite the incoming Cookie header as well as setting the outgoing one, so
  // this render already uses the new token. Redirecting instead would turn a
  // Server Function POST into a GET and silently drop the submission.
  request.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.data.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.data.refreshToken);

  const headers = new Headers(request.headers);
  headers.set("cookie", request.cookies.toString());

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    refreshed.data.accessToken,
    COOKIE_OPTIONS,
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    refreshed.data.refreshToken,
    COOKIE_OPTIONS,
  );

  return response;
}

function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(path, request.url));
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
