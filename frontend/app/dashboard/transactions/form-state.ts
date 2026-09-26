
export type TransactionFormState = {
  message: string;
  errors: string[];
  occurredAt: string;
  description: string;
  reference: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: string;

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
