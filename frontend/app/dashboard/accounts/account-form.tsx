"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";

import { createAccount } from "./actions";
import { emptyAccountFormState } from "./form-state";
import { FormAlert } from "@/components/form-alert";
import { ACCOUNT_TYPES } from "@/lib/account-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountForm() {
  const [state, formAction, pending] = useActionState(
    createAccount,
    emptyAccountFormState,
  );

  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>New account</CardTitle>
        <CardDescription>Add a line to your chart of accounts.</CardDescription>
      </CardHeader>

      {/* noValidate: AccountWriteDto owns every rule, so the browser must not
          reject a value the server would have accepted, or accept one it would
          not. One set of rules, in one place. */}
      <form action={formAction} noValidate>
        <CardContent className="space-y-4">
          <FormAlert message={state.message} errors={state.errors} />

          {/* Stays mounted while empty so the confirmation is announced when it
              appears, rather than being inserted silently. */}
          <div aria-live="polite" aria-atomic="true">
            {state.created !== "" && (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Added{" "}
                <span className="font-medium text-foreground">
                  {state.created}
                </span>
                .
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              // Remount when the server echoes a value back, so the field picks
              // up the new default. Base UI warns if defaultValue changes on a
              // mounted uncontrolled field.
              key={state.name}
              id="name"
              name="name"
              className="h-10"
              defaultValue={state.name}
              placeholder="Cash"
              autoComplete="off"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            {/* A native select: it is keyboard accessible, opens as the
                platform's own picker on a phone, and works before any
                JavaScript has loaded. A custom listbox would add a dependency
                to reach the same place. */}
            <select
              key={state.type}
              id="type"
              name="type"
              defaultValue={state.type}
              disabled={pending}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
            >
              <option value="">Select a type</option>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="h-10 w-full" disabled={pending}>
            {pending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
            {pending ? "Adding" : "Add account"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
