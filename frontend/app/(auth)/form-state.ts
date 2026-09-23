/**
 * Kept out of actions.ts on purpose: a "use server" module may only export
 * async functions. A plain constant exported from there reaches the client as
 * undefined instead of failing loudly.
 *
 * `errors` carries the backend's per-rule validation messages; `username` is
 * echoed back so a failed submission does not clear what the user typed.
 */
export type AuthFormState = {
  message: string;
  errors: string[];
  username: string;
  email: string;
};

export const emptyAuthFormState: AuthFormState = {
  message: "",
  errors: [],
  username: "",
  email: "",
};
