import type { Metadata } from "next";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create account",
};

// Route for /register. Sets the page title and renders the client form.
export default function RegisterPage() {
  return <RegisterForm />;
}
