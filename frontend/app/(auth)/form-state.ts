
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
