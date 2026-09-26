"use server";

import { revalidatePath } from "next/cache";

import { apiFetchAuthed } from "@/lib/api";
import type { Transaction } from "@/lib/ledger";
import {
  emptyTransactionFormState,
  type TransactionFormState,
} from "./form-state";


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


  revalidatePath("/dashboard", "layout");

  return {
    ...emptyTransactionFormState,
    occurredAt,
    postedId: result.data.id,
    postedDescription: result.data.description,
  };
}

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
