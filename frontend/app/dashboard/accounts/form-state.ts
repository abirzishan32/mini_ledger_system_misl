/**
 * Kept out of actions.ts for the same reason as the auth form's state: a
 * "use server" module may only export async functions, and a plain constant
 * exported from one reaches the client as undefined instead of failing loudly.
 *
 * `errors` carries the backend's per-rule messages verbatim. `name` and `type`
 * are echoed back so a rejected submission does not discard what was typed.
 */
export type AccountFormState = {
  message: string;
  errors: string[];
  name: string;
  type: string;
  /** Name of the account just created, or "" — drives the success notice. */
  created: string;
};

export const emptyAccountFormState: AccountFormState = {
  message: "",
  errors: [],
  name: "",
  type: "",
  created: "",
};
