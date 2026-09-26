"use server";

import { redirect } from "next/navigation";

import { apiFetch, type TokenResponse, type UserRead } from "@/lib/api";
import { clearSession, createSession, getSession } from "@/lib/auth";
import type { AuthFormState } from "./form-state";

// Signs a user in. Posts the credentials to the backend through apiFetch, then
// createSession (lib/auth) stores the returned pair as HttpOnly cookies.
// Nothing is validated here: LoginRequestDto owns the rules and its messages are
// passed through untouched, so the form and the server cannot disagree.
export async function login(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = readField(formData, "username");
  const password = readField(formData, "password");

  const result = await apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (!result.success || !result.data) {
    return { message: result.message, errors: result.errors ?? [], username, email: "" };
  }

  await createSession(result.data);
  redirect("/dashboard");
}

// Creates a login, then signs straight in so the user is not asked to type the
// same password twice. Two backend calls: register, then login.
// If the account is created but the sign-in fails, it says so rather than
// reporting a failure — the account does exist and retrying would now conflict.
export async function register(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = readField(formData, "username");
  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const confirmPassword = readField(formData, "confirmPassword");

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

// Signs out in both places that matter. Tells the backend first, which clears
// the stored refresh token hash so no copy of that token can renew again, then
// clearSession (lib/auth) deletes the local cookies.
export async function signOut(): Promise<void> {
  const session = await getSession();

  if (session) {
    await apiFetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
  }

  await clearSession();

  redirect("/login");
}

// Pulls one field out of a FormData as a string. A missing field and a file
// upload both read as "", which the backend's Required rules then reject.
function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
