/**
 * Every field is echoed back so a rejected posting does not make the user
 * retype six values. Kept out of actions.ts because a "use server" module may
 * only export async functions.
 */
export type TransactionFormState = {
  message: string;
  errors: string[];
  occurredAt: string;
  description: string;
  reference: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: string;
  /**
   * Id of the transaction just posted, or "". The form watches it to mint a
   * fresh idempotency key, so it must be unique per posting — the description
   * would not be, and two identical postings on one day are legitimate.
   */
  postedId: string;
  /** Description of that transaction, for the confirmation notice. */
  postedDescription: string;
};

export const emptyTransactionFormState: TransactionFormState = {
  message: "",
  errors: [],
  occurredAt: "",
  description: "",
  reference: "",
  debitAccountId: "",
  creditAccountId: "",
  amount: "",
  postedId: "",
  postedDescription: "",
};
