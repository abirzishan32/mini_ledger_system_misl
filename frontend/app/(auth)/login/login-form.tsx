"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { login } from "../actions";
import { emptyAuthFormState } from "../form-state";
import { FormAlert } from "../form-alert";
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

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    login,
    emptyAuthFormState,
  );

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-lg">Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to open your ledger.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-5">
          <FormAlert message={state.message} errors={state.errors} />

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              // Remount when the server echoes a username back, so the field
              // picks up the new default. Base UI warns if defaultValue changes
              // on a mounted uncontrolled field.
              key={state.username}
              id="username"
              name="username"
              className="h-10"
              defaultValue={state.username}
              autoComplete="username"
              autoFocus
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </div>

          <Button type="submit" className="h-10 w-full" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {pending ? "Signing in" : "Sign in"}
          </Button>
        </CardContent>
      </form>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
