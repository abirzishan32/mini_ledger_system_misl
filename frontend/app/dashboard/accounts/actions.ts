"use server";

import { revalidatePath } from "next/cache";

import { apiFetchAuthed } from "@/lib/api";
import type { Account } from "@/lib/ledger";
import { emptyAccountFormState, type AccountFormState } from "./form-state";


// Creates an account for the signed-in user via apiFetchAuthed, which attaches
// this request's own token — there is no owner field to name anyone else.
// Nothing is validated here: AccountWriteDto and the unique index behind it
// decide what is acceptable, and their messages are passed through untouched.
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

// Pulls one field out of a FormData as a string; anything missing reads as "".
function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
