
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
