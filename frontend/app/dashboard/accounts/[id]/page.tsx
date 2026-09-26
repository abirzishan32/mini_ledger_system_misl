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

// One account's statement: every entry against it, oldest first, with the
// running balance the backend accumulated over that order.
// Fetches the account and its ledger together through lib/ledger. Either can
// fail on its own, so both failures are surfaced and neither the balance nor the
// empty state is rendered from a read that did not arrive — showing 0.00 for an
// unknown balance would state a figure the ledger does not hold.
export default async function AccountStatementPage({
  params,
}: PageProps<"/dashboard/accounts/[id]">) {
  const { id } = await params;

  const [account, ledger] = await Promise.all([
    getAccount(id),
    getAccountLedger(id),
  ]);


  if (account.statusCode === 404 || ledger.statusCode === 404) {
    notFound();
  }

  const lines = ledger.data ?? [];

  // The two reads fail independently, so both are surfaced. Nothing below is
  // rendered from a result that did not arrive: showing 0.00 for a balance the
  // server never returned states a figure the ledger does not hold, which is
  // worse than showing no figure at all.
  const failures = [account, ledger].filter((result) => !result.success);

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

          {account.data && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="font-mono text-lg tabular-nums">
                {formatAmount(account.data.balance)}
                <span className="ml-1.5 text-sm text-muted-foreground">
                  {balanceSide(account.data.balance)}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      <FormAlert
        message={failures[0]?.message ?? ""}
        errors={failures.flatMap((result) => result.errors ?? [])}
      />

      {ledger.success &&
        (lines.length === 0 ? (
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
        ))}

      
    </div>
  );
}
