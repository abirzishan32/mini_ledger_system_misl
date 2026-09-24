"use server";

import { revalidatePath } from "next/cache";

import { apiFetchAuthed } from "@/lib/api";
import type { Transaction } from "@/lib/ledger";
import {
  emptyTransactionFormState,
  type TransactionFormState,
} from "./form-state";

/**
 * Posts one double-entry transaction as the signed-in user.
 *
 * Both sides are committed by the backend inside a single SaveChanges, so the
 * ledger can never hold a debit without its credit. Nothing is validated here:
 * the date, the amount's range, the 200-character description and the rule
 * that the two accounts must differ all live in TransactionWriteDto, and its
 * messages are passed through untouched.
 *
 * The idempotency key rides as a header rather than a body field because it
 * describes this delivery attempt, not the accounting event. If the response
 * to a posting is lost and the user submits again, the backend recognises the
 * key and returns the transaction it already wrote instead of writing a
 * second one. An empty key — no JavaScript — simply omits the header.
 */
export async function postTransaction(
  _previous: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const occurredAt = readField(formData, "occurredAt");
  const description = readField(formData, "description");
  const reference = readField(formData, "reference");
  const debitAccountId = readField(formData, "debitAccountId");
  const creditAccountId = readField(formData, "creditAccountId");
  const amount = readField(formData, "amount");
  const idempotencyKey = readField(formData, "idempotencyKey");

  const result = await apiFetchAuthed<Transaction>("/api/transactions", {
    method: "POST",
    headers: idempotencyKey === "" ? {} : { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({
      // The date input yields a calendar day. Pinning it to midnight UTC makes
      // the instant explicit rather than leaving the kind to be inferred.
      occurredAt: occurredAt === "" ? null : `${occurredAt}T00:00:00Z`,
      description,
      reference,
      debitAccountId: debitAccountId || null,
      creditAccountId: creditAccountId || null,
      amount: amount === "" ? null : Number(amount),
    }),
  });

  if (!result.success || !result.data) {
    return {
      message: result.message,
      errors: result.errors ?? [],
      occurredAt,
      description,
      reference,
      debitAccountId,
      creditAccountId,
      amount,
      postedId: "",
      postedDescription: "",
    };
  }

  // A posting moves balances, so the accounts page and the trial balance are
  // stale too. One call for the whole dashboard subtree rather than three that
  // have to be kept in step with the routes.
  revalidatePath("/dashboard", "layout");

  return {
    ...emptyTransactionFormState,
    // Kept: entering a day's transactions means posting several with the same
    // date, and retyping it each time is the friction this removes.
    occurredAt,
    postedId: result.data.id,
    postedDescription: result.data.description,
  };
}

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
