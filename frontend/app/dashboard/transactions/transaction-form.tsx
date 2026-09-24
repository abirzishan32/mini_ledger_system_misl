"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { postTransaction } from "./actions";
import { emptyTransactionFormState } from "./form-state";
import { FormAlert } from "@/components/form-alert";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/account-types";
import type { Account } from "@/lib/ledger";
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

  // A key that stays the same across retries of one posting but is fresh for
  // the next. Minted after mount, so the server and client agree on the first
  // render; without JavaScript it stays empty and the action omits the header.
  // It is replaced only once a posting succeeds, which is what makes a retry
  // after a lost response return the original transaction instead of a twin.
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, [state.postedId]);

  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>Post a transaction</CardTitle>
        <CardDescription>
          Value moves from the credit account to the debit account. Buying
          supplies with cash debits Office Expense and credits Cash.
        </CardDescription>
      </CardHeader>

      {/* noValidate: TransactionWriteDto owns every rule, including the two
          cross-field ones the browser could not express anyway — the accounts
          must differ, and the date cannot be in the future. */}
      <form action={formAction} noValidate>
        <CardContent className="space-y-4">
          <FormAlert message={state.message} errors={state.errors} />

          <div aria-live="polite" aria-atomic="true">
            {state.postedId !== "" && (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Posted{" "}
                <span className="font-medium text-foreground">
                  {state.postedDescription}
                </span>
                .
              </p>
            )}
          </div>

          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

            <Field id="description" label="Description" className="lg:col-span-2">
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
        </CardContent>
      </form>
    </Card>
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
