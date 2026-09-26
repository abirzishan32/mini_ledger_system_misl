"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";

import { createAccount } from "./actions";
import { useDialogClosedOnSuccess } from "@/lib/use-dialog";
import { emptyAccountFormState } from "./form-state";
import { FormAlert } from "@/components/form-alert";
import { ACCOUNT_THEMES } from "./account-theme";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/account-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "cn";

export function AccountForm() {
  const [state, formAction, pending] = useActionState(
    createAccount,
    emptyAccountFormState,
  );
  // Keyed on the created name, which changes only on success.
  const [open, setOpen] = useDialogClosedOnSuccess(state.created);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="lg">
            <Plus aria-hidden="true" />
            New account
          </Button>
        }
      />

      <DialogContent>
        <div className="space-y-1 pr-6">
          <DialogTitle>New account</DialogTitle>
          <DialogDescription>
            Add a line to your chart of accounts.
          </DialogDescription>
        </div>

        {/* noValidate: AccountWriteDto owns every rule, so the browser must not
          reject a value the server would have accepted, or accept one it would
          not. One set of rules, in one place. */}
        <form action={formAction} noValidate>
          <div className="mt-5 space-y-4">
            <FormAlert message={state.message} errors={state.errors} />

            {/* Stays mounted while empty so the confirmation is announced when it
              appears, rather than being inserted silently. */}
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
              {/* The one field in the app that is not a native <select>. A
                browser renders nothing but text inside an <option>, so an icon
                and a colour per choice are unreachable there. Base UI's
                listbox handles the keyboard and screen-reader behaviour the
                native element gave us for free. */}
              <Select
                // A listbox holds its own state, so a native form reset does not
                // clear it the way it clears the text field. Keying on both the
                // echoed type and the created name remounts it in exactly the two
                // cases that matter: a rejection, so the choice is handed back,
                // and a successful add, so the next one starts blank.
                key={`${state.created}-${state.type}`}
                name="type"
                defaultValue={state.type}
                disabled={pending}
              >
                <SelectTrigger id="type">
                  {/* A children function overrides `placeholder` entirely, so
                    the empty case is handled here rather than there. */}
                  <SelectValue>
                    {(value) => {
                      const theme = ACCOUNT_THEMES[value as AccountType];

                      if (!theme) {
                        return (
                          <span className="text-muted-foreground">
                            Select a type
                          </span>
                        );
                      }

                      const Icon = theme.icon;

                      return (
                        <span className="flex items-center gap-2.5">
                          <Icon
                            className={cn("size-4", theme.iconColor)}
                            aria-hidden="true"
                          />
                          {value}
                        </span>
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => {
                    const theme = ACCOUNT_THEMES[type];
                    const Icon = theme.icon;

                    return (
                      <SelectItem key={type} value={type}>
                        <Icon
                          className={cn("size-4 shrink-0", theme.iconColor)}
                          aria-hidden="true"
                        />
                        <SelectItemText>{type}</SelectItemText>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="h-10 w-full" disabled={pending}>
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              {pending ? "Adding" : "Add account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
