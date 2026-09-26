import "server-only";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

// Mirrors ApiResponse<T> from the ASP.NET backend. Every endpoint returns this
// envelope for both success and failure, so callers only ever handle one shape.
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[] | null;
  statusCode: number;
  timeStamp: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type UserRead = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

// Reads API_BASE_URL and strips any trailing slash so callers can pass paths
// beginning with "/". Throws rather than defaulting: a missing value would
// otherwise surface later as every request failing for no stated reason.
function baseUrl(): string {
  const configured = process.env.API_BASE_URL;

  if (!configured) {
    throw new Error(
      "Missing API_BASE_URL. Copy .env.example to .env and point it at the backend.",
    );
  }

  return configured.replace(/\/+$/, "");
}

// Calls the ASP.NET backend and always returns an ApiResponse, never throws.
// A dead backend and a non-envelope body are both converted by failure() below,
// so callers need one branch rather than a try/catch as well. The "server-only"
// import at the top makes importing this from a client component a build error,
// which is what keeps API_BASE_URL and the bearer token out of the browser.
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
      // Auth responses are per-user and must never be reused.
      cache: "no-store",
    });
  } catch {
    // Backend down, wrong port, DNS failure. Report it in the same envelope so
    // callers never need a second error path.
    return failure(503, "Cannot reach the server. Please try again.");
  }

  const body: unknown = await response.json().catch(() => null);

  if (body !== null && typeof body === "object" && "success" in body) {
    return body as ApiResponse<T>;
  }

  // A non-envelope body means an unhandled exception or a proxy error page.
  return failure(
    response.status,
    `Unexpected response from the server (HTTP ${response.status}).`,
  );
}

// Calls the backend as the signed-in user, attaching the access token from the
// cookie that getSession reads out of lib/auth.
// There is deliberately no user-id parameter: the identity comes from this
// request's own HttpOnly cookie, so no caller can ask on someone else's behalf.
// Both failure paths redirect rather than return, so a page cannot forget them.
export async function apiFetchAuthed<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const response = await apiFetch<T>(path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (response.statusCode === 401) {
    redirect("/login");
  }

  return response;
}

// Trades a refresh token for a fresh pair. Called only by proxy.ts, before a
// page renders. The user id is sent alongside the token because the token itself
// carries no information; proxy.ts reads that id out of the expiring access
// token's sub claim.
export async function refreshTokens(
  userId: string,
  refreshToken: string,
): Promise<ApiResponse<TokenResponse>> {
  return apiFetch<TokenResponse>("/api/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify({ userId, refreshToken }),
  });
}

// Builds the same envelope shape the backend returns, for failures that never
// reached it. Keeping one shape is what lets every caller handle errors once.
function failure<T>(statusCode: number, message: string): ApiResponse<T> {
  return {
    success: false,
    message,
    data: null,
    errors: null,
    statusCode,
    timeStamp: new Date().toISOString(),
  };
}
