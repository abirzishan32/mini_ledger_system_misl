
// Shape passed between the auth forms and their actions by useActionState.
// Kept out of actions.ts because a "use server" module may only export async
// functions; a constant exported from there reaches the client as undefined.
// username and email are echoed back so a rejection does not clear the form.
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
