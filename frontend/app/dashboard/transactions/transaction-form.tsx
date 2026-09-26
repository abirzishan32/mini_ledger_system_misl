"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { postTransaction } from "./actions";
import { useDialogClosedOnSuccess } from "@/lib/use-dialog";
import { emptyTransactionFormState } from "./form-state";
import { FormAlert } from "@/components/form-alert";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/account-types";
import type { Account } from "@/lib/ledger";
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
import { NativeSelect } from "@/components/ui/native-select";

export function TransactionForm({
  accounts,
  today,
}: {
  accounts: Account[];
  /** Resolved on the server so the first render matches the hydration. */
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    postTransaction,
    emptyTransactionFormState,
  );


  const [idempotencyKey, setIdempotencyKey] = useState("");


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration
    setIdempotencyKey(crypto.randomUUID());
  }, [state.postedId]);

  // Keyed on the posted id, which changes only on success.
  const [open, setOpen] = useDialogClosedOnSuccess(state.postedId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="lg">
            <Plus aria-hidden="true" />
            Post transaction
          </Button>
        }
      />

      <DialogContent className="max-w-[34rem]">
        <div className="space-y-1 pr-6">
          <DialogTitle>Post a transaction</DialogTitle>
          <DialogDescription>
            Value moves from the credit account to the debit account. Buying
            supplies with cash debits Office Expense and credits Cash.
          </DialogDescription>
        </div>


        <form action={formAction} noValidate>
          <div className="mt-5 space-y-4">
            <FormAlert message={state.message} errors={state.errors} />

            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="occurredAt" label="Date">
                <Input
                  key={`date-${state.occurredAt}`}
                  id="occurredAt"
                  name="occurredAt"
                  type="date"
                  className="h-10"
                  defaultValue={state.occurredAt || today}
                  disabled={pending}
                />
              </Field>

              <Field
                id="description"
                label="Description"
                className="sm:col-span-2"
              >
                <Input
                  key={`description-${state.description}`}
                  id="description"
                  name="description"
                  className="h-10"
                  defaultValue={state.description}
                  placeholder="Consulting fee"
                  autoComplete="off"
                  disabled={pending}
                />
              </Field>

              <Field id="debitAccountId" label="Debit account">
                <AccountOptions
                  id="debitAccountId"
                  accounts={accounts}
                  defaultValue={state.debitAccountId}
                  disabled={pending}
                />
              </Field>

              <Field id="creditAccountId" label="Credit account">
                <AccountOptions
                  id="creditAccountId"
                  accounts={accounts}
                  defaultValue={state.creditAccountId}
                  disabled={pending}
                />
              </Field>

              <Field id="amount" label="Amount">
                <Input
                  key={`amount-${state.amount}`}
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  inputMode="decimal"
                  className="h-10 font-mono tabular-nums"
                  defaultValue={state.amount}
                  placeholder="0.00"
                  autoComplete="off"
                  disabled={pending}
                />
              </Field>

              <Field id="reference" label="Reference" optional>
                <Input
                  key={`reference-${state.reference}`}
                  id="reference"
                  name="reference"
                  className="h-10"
                  defaultValue={state.reference}
                  placeholder="INV-001"
                  autoComplete="off"
                  disabled={pending}
                />
              </Field>
            </div>

            <Button
              type="submit"
              className="h-10 w-full sm:w-auto"
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              {pending ? "Posting" : "Post transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  optional,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={id}>
        {label}
        {optional && (
          // The leading space is for the accessible name, which concatenates
          // the label's text nodes: without it a screen reader announces
          // "Referenceoptional".
          <span className="font-normal text-muted-foreground"> optional</span>
        )}
      </Label>
      {children}
    </div>
  );
}

/**
 * Grouped by type, because a chart of accounts is read that way and an
 * unsorted list of a dozen names is where a posting goes to the wrong side.
 * optgroup is native, so the grouping survives into the platform's own picker.
 */
function AccountOptions({
  id,
  accounts,
  defaultValue,
  disabled,
}: {
  id: string;
  accounts: Account[];
  defaultValue: string;
  disabled: boolean;
}) {
  return (
    <NativeSelect
      key={`${id}-${defaultValue}`}
      id={id}
      name={id}
      defaultValue={defaultValue}
      disabled={disabled}
    >
      <option value="">Select an account</option>
      {ACCOUNT_TYPES.map((type) => {
        const inType = accounts.filter((account) => account.type === type);

        return inType.length === 0 ? null : (
          <optgroup key={type} label={ACCOUNT_TYPE_LABELS[type]}>
            {inType.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </NativeSelect>
  );
}
