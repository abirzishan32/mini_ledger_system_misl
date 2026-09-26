"use server";

import { revalidatePath } from "next/cache";

import { apiFetchAuthed } from "@/lib/api";
import type { Account } from "@/lib/ledger";
import { emptyAccountFormState, type AccountFormState } from "./form-state";


export async function createAccount(
  _previous: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const name = readField(formData, "name");
  const type = readField(formData, "type");

  const result = await apiFetchAuthed<Account>("/api/accounts", {
    method: "POST",
    body: JSON.stringify({ name, type: type || null }),
  });

  if (!result.success || !result.data) {
    return {
      message: result.message,
      errors: result.errors ?? [],
      name,
      type,
      created: "",
    };
  }


  revalidatePath("/dashboard/accounts");

  return { ...emptyAccountFormState, created: result.data.name };
}

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
