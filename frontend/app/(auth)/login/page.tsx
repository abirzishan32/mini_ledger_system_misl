import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

// Route for /login. The form is a client component, so this only sets the page
// title and renders it; proxy.ts has already sent signed-in visitors elsewhere.
export default function LoginPage() {
  return <LoginForm />;
}
