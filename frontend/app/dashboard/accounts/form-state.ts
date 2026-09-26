
// Shape passed between AccountForm and createAccount by useActionState.
// Kept out of actions.ts for the same reason as the auth form's state: a
// "use server" module may only export async functions.
// created carries the new account's name, and changing only on success is what
// useDialogClosedOnSuccess watches to close the dialog.
export type AccountFormState = {
  message: string;
  errors: string[];
  name: string;
  type: string;
  created: string;
};

export const emptyAccountFormState: AccountFormState = {
  message: "",
  errors: [],
  name: "",
  type: "",
  created: "",
};
