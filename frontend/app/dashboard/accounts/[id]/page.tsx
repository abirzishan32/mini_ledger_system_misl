import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { FormAlert } from "@/components/form-alert";
import { Blank, TableFrame, Th } from "@/components/ui/table";
import { balanceSide, formatAmount, formatDate } from "@/lib/format";
import { getAccount, getAccountLedger } from "@/lib/ledger";

export const metadata: Metadata = { title: "Account statement" };

export default async function AccountStatementPage({
  params,
}: PageProps<"/dashboard/accounts/[id]">) {
  const { id } = await params;

  const [account, ledger] = await Promise.all([
    getAccount(id),
    getAccountLedger(id),
  ]);

  // The backend scopes both reads to the caller, so another user's account is
  // already a 404 there. Nothing is checked against the URL here, because an
  // id in a URL is a claim, not a credential.
  if (account.statusCode === 404 || ledger.statusCode === 404) {
    notFound();
  }

  const lines = ledger.data ?? [];
  const balance = account.data?.balance ?? 0;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/dashboard/accounts"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Accounts
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight break-words">
              {account.data?.name ?? "Account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {account.data?.type}
              {account.data && (
                <> · opened {formatDate(account.data.createdAt)}</>
              )}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="font-mono text-lg tabular-nums">
              {formatAmount(balance)}
              <span className="ml-1.5 text-sm text-muted-foreground">
                {balanceSide(balance)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <FormAlert
        message={ledger.success ? "" : ledger.message}
        errors={ledger.errors ?? []}
      />

      {lines.length === 0 ? (
        <EmptyState title="Nothing posted to this account yet">
          Entries appear here as soon as a transaction touches this account.
        </EmptyState>
      ) : (
        // A real table, because the debit and credit columns are the point:
        // which side a line landed on is what makes this a ledger rather than
        // a list of amounts. Five columns do not fit a phone, so the table
        // scrolls inside its frame instead of collapsing into a second layout
        // that would have to be kept in step with this one.
        <TableFrame>
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">
              Statement for {account.data?.name}, oldest entry first
            </caption>
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <Th>Date</Th>
                <Th>Description</Th>
                <Th align="right">Debit</Th>
                <Th align="right">Credit</Th>
                <Th align="right">Balance</Th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {lines.map((line, index) => (
                <tr
                  key={`${line.transactionId}-${index}`}
                  className="transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    <time dateTime={line.occurredAt}>
                      {formatDate(line.occurredAt)}
                    </time>
                  </td>
                  <td className="px-4 py-3">
                    {line.description}
                    {line.reference !== null && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {line.reference}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {line.amount > 0 ? formatAmount(line.amount) : <Blank />}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {line.amount < 0 ? formatAmount(line.amount) : <Blank />}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {formatAmount(line.runningBalance)}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {balanceSide(line.runningBalance)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      )}

      {lines.length > 0 && (
        <p className="text-xs text-muted-foreground">
          The balance column is accumulated over this order, oldest first. It is
          derived on every read, never stored against an entry.
        </p>
      )}
    </div>
  );
}
