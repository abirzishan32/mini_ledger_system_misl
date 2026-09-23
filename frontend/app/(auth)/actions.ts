"use server";

import { redirect } from "next/navigation";

import { apiFetch, type TokenResponse, type UserRead } from "@/lib/api";
import { clearSession, createSession, getSession } from "@/lib/auth";
import type { AuthFormState } from "./form-state";

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

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
