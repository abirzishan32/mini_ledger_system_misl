"use server";

import { revalidatePath } from "next/cache";

import { apiFetchAuthed } from "@/lib/api";
import type { Account } from "@/lib/ledger";
import { emptyAccountFormState, type AccountFormState } from "./form-state";

/**
 * Creates an account for the signed-in user.
 *
 * The owner is never part of the payload. apiFetchAuthed attaches this
 * request's own bearer token and the backend takes the id from its `sub`
 * claim, so a caller cannot name a different owner: there is no field to name
 * one in.
 *
 * Nothing here validates. Required fields, name length and the duplicate-name
 * conflict are all decided by AccountWriteDto and the unique index behind it,
 * and their messages are passed through untouched. The browser and the server
 * therefore cannot disagree about what is acceptable.
 */
export async function createAccount(
  _previous: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const name = readField(formData, "name");
  const type = readField(formData, "type");

  const result = await apiFetchAuthed<Account>("/api/accounts", {
    method: "POST",
    // An unpicked type is sent as null so the DTO's [Required] rule answers it.
    // "" would fail enum deserialisation first, with a framework message the
    // user cannot act on.
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

  // The list is rendered on the server, so it only shows the new row once its
  // cache is dropped.
  revalidatePath("/dashboard/accounts");

  return { ...emptyAccountFormState, created: result.data.name };
}

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
