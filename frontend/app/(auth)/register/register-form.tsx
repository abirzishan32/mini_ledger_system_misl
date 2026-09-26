"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { register } from "../actions";
import { emptyAuthFormState } from "../form-state";
import { FormAlert } from "@/components/form-alert";
import { PasswordInput } from "../password-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// The create-account form. Drives the register action, which creates the login
// and signs straight in, so a success ends in a redirect rather than a message.
// noValidate for the same reason as the sign-in form: UserWriteDto owns the
// rules. type="email" is kept for the mobile keyboard, not for its validation.
export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    register,
    emptyAuthFormState,
  );

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-lg">Create account</CardTitle>
        <CardDescription>
          Set up an account to start recording entries.
        </CardDescription>
      </CardHeader>

      <form action={formAction} noValidate>
        <CardContent className="space-y-5">
          <FormAlert message={state.message} errors={state.errors} />

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              key={state.username}
              id="username"
              name="username"
              className="h-10"
              defaultValue={state.username}
              autoComplete="username"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              key={state.email}
              id="email"
              name="email"
              type="email"
              className="h-10"
              defaultValue={state.email}
              autoComplete="email"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              disabled={pending}
            />
          </div>

          <Button type="submit" className="h-10 w-full" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {pending ? "Creating account" : "Create account"}
          </Button>
        </CardContent>
      </form>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
