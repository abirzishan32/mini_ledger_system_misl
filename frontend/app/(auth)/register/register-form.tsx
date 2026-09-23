"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { register } from "../actions";
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

// Mirrors the backend's UserWriteDto rules, so the browser rejects what the API
// would reject anyway and the round trip is saved.
const USERNAME_PATTERN = "[a-zA-Z0-9_.\\-]+";

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
          Set up a username and password to start recording entries.
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
              minLength={3}
              maxLength={50}
              pattern={USERNAME_PATTERN}
              title="Letters, digits, underscore, dot or hyphen only."
              required
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              3 to 50 characters. Letters, digits, underscore, dot or hyphen.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
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
