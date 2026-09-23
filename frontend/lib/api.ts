import "server-only";

/**
 * Mirrors ApiResponse<T> from the ASP.NET backend. Every endpoint returns this
 * envelope for both success and failure, so callers only ever handle one shape.
 */
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
  createdAt: string;
};

function baseUrl(): string {
  const configured = process.env.API_BASE_URL;

  if (!configured) {
    throw new Error(
      "Missing API_BASE_URL. Copy .env.example to .env and point it at the backend.",
    );
  }

  return configured.replace(/\/+$/, "");
}

/**
 * Calls the backend from the server only. Importing this module from a client
 * component is a build error, which is what keeps API_BASE_URL and the bearer
 * token out of the browser bundle.
 */
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

/**
 * Trades a refresh token for a new pair. The backend identifies the session by
 * user id as well as token, and the id comes from the access token's `sub`.
 */
export async function refreshTokens(
  userId: string,
  refreshToken: string,
): Promise<ApiResponse<TokenResponse>> {
  return apiFetch<TokenResponse>("/api/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify({ userId, refreshToken }),
  });
}

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
