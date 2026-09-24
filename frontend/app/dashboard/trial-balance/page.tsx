import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";

import { FormAlert } from "@/components/form-alert";
import { formatAmount } from "@/lib/format";
import { getTrialBalance } from "@/lib/ledger";

export const metadata: Metadata = { title: "Trial balance" };

export default async function TrialBalancePage() {
  const result = await getTrialBalance();
  const trialBalance = result.data;
  const lines = trialBalance?.lines ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Trial balance</h1>
        <p className="text-sm text-muted-foreground">
          Every account&apos;s balance in the column its side belongs to. Since
          each transaction posts equal debits and credits, the two totals must
          agree — which is the ledger checking itself.
        </p>
      </div>

      <FormAlert
        message={result.success ? "" : result.message}
        errors={result.errors ?? []}
      />

      {trialBalance && (
        <div
          className={
            trialBalance.isBalanced
              ? "flex items-center gap-2.5 rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10"
              : "flex items-center gap-2.5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/20"
          }
        >
          {trialBalance.isBalanced ? (
            <>
              <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
              <span>
                In balance — debits and credits both total{" "}
                <span className="font-mono tabular-nums">
                  {formatAmount(trialBalance.totalDebits)}
                </span>
                .
              </span>
            </>
          ) : (
            <>
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              <span>
                Out of balance by{" "}
                <span className="font-mono tabular-nums">
                  {formatAmount(
                    trialBalance.totalDebits - trialBalance.totalCredits,
                  )}
                </span>
                . Entries have been written outside the normal path.
              </span>
            </>
          )}
        </div>
      )}

      {lines.length === 0 ? (
        <p className="rounded-xl bg-card px-6 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          No accounts to report on yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[30rem] text-sm">
            <caption className="sr-only">
              Trial balance, one row per account
            </caption>
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th scope="col" className="px-4 py-2.5 text-left font-medium">
                  Account
                </th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">
                  Type
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Debit
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Credit
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {lines.map((line) => (
                <tr key={line.accountId}>
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <Link
                      href={`/dashboard/accounts/${line.accountId}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {line.accountName}
                    </Link>
                  </th>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {line.type}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {line.debit > 0 ? formatAmount(line.debit) : <Blank />}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {line.credit > 0 ? formatAmount(line.credit) : <Blank />}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* In a tfoot rather than a last row, so the totals are announced as
                a summary and stay attached to the columns they add up. */}
            <tfoot>
              <tr className="border-t font-medium">
                <th scope="row" colSpan={2} className="px-4 py-3 text-left">
                  Totals
                </th>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {formatAmount(trialBalance?.totalDebits ?? 0)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {formatAmount(trialBalance?.totalCredits ?? 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

/** An em dash for the column an account does not sit in, read as empty, not zero. */
function Blank() {
  return (
    <span className="text-muted-foreground" aria-hidden="true">
      —
    </span>
  );
}
