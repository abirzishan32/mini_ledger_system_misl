
// Shape passed between TransactionForm and postTransaction by useActionState.
// Every field is echoed back so a rejected posting does not make the user retype
// six values. Kept out of actions.ts because a "use server" module may only
// export async functions.
export type TransactionFormState = {
  message: string;
  errors: string[];
  occurredAt: string;
  description: string;
  reference: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: string;

  // Id of the transaction just posted, or "". Changing only on success is what
  // tells the form to mint a fresh idempotency key and close the dialog, so it
  // must be unique per posting — the description would not be, and two identical
  // postings in one day are both legitimate.
  postedId: string;
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
