"use server";

import { redirect } from "next/navigation";

import { apiFetch, type TokenResponse, type UserRead } from "@/lib/api";
import { clearSession, createSession, getSession } from "@/lib/auth";
import type { AuthFormState } from "./form-state";

export async function login(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = readField(formData, "username").trim();
  const password = readField(formData, "password");

  if (!username || !password) {
    return { message: "Enter your username and password.", errors: [], username };
  }

  const result = await apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (!result.success || !result.data) {
    return { message: result.message, errors: result.errors ?? [], username };
  }

  await createSession(result.data);

  // redirect throws, so it must stay outside any try/catch. apiFetch already
  // resolves its own failures into the envelope above, so there is none here.
  redirect("/dashboard");
}

export async function register(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = readField(formData, "username").trim();
  const password = readField(formData, "password");
  const confirmPassword = readField(formData, "confirmPassword");

  if (!username || !password) {
    return { message: "Choose a username and password.", errors: [], username };
  }

  // Checked here rather than only in the browser: there is no password reset,
  // so a typo would lock the account out permanently.
  if (password !== confirmPassword) {
    return { message: "The two passwords do not match.", errors: [], username };
  }

  const created = await apiFetch<UserRead>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (!created.success) {
    return { message: created.message, errors: created.errors ?? [], username };
  }

  // Registration returns the new user, not tokens, so sign in to get a session.
  const signIn = await apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (!signIn.success || !signIn.data) {
    return {
      message: "Your account was created, but signing in failed. Please sign in.",
      errors: signIn.errors ?? [],
      username,
    };
  }

  await createSession(signIn.data);

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const session = await getSession();

  if (session) {
    // Best effort. The cookies are dropped either way, but revoking server-side
    // is what stops a captured refresh token from minting new sessions for the
    // rest of its seven days. apiFetch resolves its own failures, so a backend
    // that is down cannot strand the user in a signed-in state.
    await apiFetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
  }

  await clearSession();

  redirect("/login");
}

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
