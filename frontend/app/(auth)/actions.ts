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

  // No local presence check: LoginRequestDto already declares both fields
  // required, and its messages are the ones the user should see.
  const result = await apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (!result.success || !result.data) {
    return { message: result.message, errors: result.errors ?? [], username, email: "" };
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
  const email = readField(formData, "email").trim();
  const password = readField(formData, "password");
  const confirmPassword = readField(formData, "confirmPassword");

  // Every rule, including the two passwords matching, is declared on
  // UserWriteDto. Nothing is validated here, so there is one place to change a
  // rule and no way for the two ends to disagree.
  const created = await apiFetch<UserRead>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password, confirmPassword }),
  });

  if (!created.success) {
    return {
      message: created.message,
      errors: created.errors ?? [],
      username,
      email,
    };
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
      email,
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
