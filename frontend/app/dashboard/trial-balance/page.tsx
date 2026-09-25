import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, CircleCheck, Scale } from "lucide-react";
import { cn } from "cn";

import { ACCOUNT_THEMES } from "../accounts/account-theme";
import { EmptyState } from "@/components/empty-state";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { Blank, TableFrame, Th } from "@/components/ui/table";
import { ACCOUNT_TYPE_LABELS, groupByType } from "@/lib/account-types";
import { formatAmount } from "@/lib/format";
import { getTrialBalance } from "@/lib/ledger";

export const metadata: Metadata = { title: "Trial balance" };

export default async function TrialBalancePage() {
  const result = await getTrialBalance();
  const trialBalance = result.data;
  const lines = trialBalance?.lines ?? [];

  // Grouped the way the accounts page groups, so the two pages read as the
  // same chart of accounts rather than two unrelated lists.
  const groups = groupByType(lines, (line) => line.type);

  return (
    <div className="space-y-6">
      <PageHeader title="Trial balance">
        Every account&apos;s balance in the column its side belongs to. Since
        each transaction posts equal debits and credits, the two totals must
        agree — which is the ledger checking itself.
      </PageHeader>

      <FormAlert
        message={result.success ? "" : result.message}
        errors={result.errors ?? []}
      />

      {trialBalance && (
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm",
            trialBalance.isBalanced
              ? "bg-card ring-1 ring-foreground/10"
              : "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
          )}
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
        <EmptyState icon={Scale} title="No accounts to report on yet">
          Add accounts and post a transaction; both sides will appear here.
        </EmptyState>
      ) : (
        <TableFrame>
          <table className="w-full min-w-[30rem] text-sm">
            <caption className="sr-only">
              Trial balance, grouped by account type with a subtotal per group
            </caption>
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <Th>Account</Th>
                <Th align="right">Debit</Th>
                <Th align="right">Credit</Th>
              </tr>
            </thead>

            {/* One tbody per group, so a group header and its rows stay
                together and each subtotal is scoped to what precedes it. */}
            {groups.map((group) => {
              const theme = ACCOUNT_THEMES[group.type];
              const TypeIcon = theme.icon;
              const debit = group.items.reduce((sum, l) => sum + l.debit, 0);
              const credit = group.items.reduce((sum, l) => sum + l.credit, 0);

              return (
                <tbody key={group.type} className="border-b last:border-b-0">
                  <tr className={cn("border-l-4", theme.header)}>
                    <th
                      scope="colgroup"
                      colSpan={3}
                      className="px-4 py-2 text-left"
                    >
                      <span className="flex items-center gap-2 text-xs font-medium">
                        <TypeIcon
                          className={cn("size-3.5 shrink-0", theme.iconColor)}
                          aria-hidden="true"
                        />
                        {ACCOUNT_TYPE_LABELS[group.type]}
                      </span>
                    </th>
                  </tr>

                  {group.items.map((line) => (
                    <tr
                      key={line.accountId}
                      className={cn("transition-colors", theme.row)}
                    >
                      <th
                        scope="row"
                        className="px-4 py-2.5 text-left font-normal"
                      >
                        <Link
                          href={`/dashboard/accounts/${line.accountId}`}
                          className="flex min-w-0 items-center gap-2 underline-offset-4 hover:underline"
                        >
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              theme.dot,
                            )}
                            aria-hidden="true"
                          />
                          <span className="truncate">{line.accountName}</span>
                        </Link>
                      </th>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right font-mono tabular-nums",
                          line.debit > 0 && theme.balance,
                        )}
                      >
                        {line.debit > 0 ? formatAmount(line.debit) : <Blank />}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right font-mono tabular-nums",
                          line.credit > 0 && theme.balance,
                        )}
                      >
                        {line.credit > 0 ? (
                          formatAmount(line.credit)
                        ) : (
                          <Blank />
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Only worth printing when it sums more than one account. */}
                  {group.items.length > 1 && (
                    <tr className="text-xs text-muted-foreground">
                      <th
                        scope="row"
                        className="px-4 pb-2.5 text-left font-normal"
                      >
                        Subtotal
                      </th>
                      <td className="px-4 pb-2.5 text-right font-mono tabular-nums">
                        {debit > 0 ? formatAmount(debit) : <Blank />}
                      </td>
                      <td className="px-4 pb-2.5 text-right font-mono tabular-nums">
                        {credit > 0 ? formatAmount(credit) : <Blank />}
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}

            {/* In a tfoot rather than a last row, so the totals are announced as
                a summary and stay attached to the columns they add up. */}
            <tfoot>
              <tr className="border-t-2 font-medium">
                <th scope="row" className="px-4 py-3 text-left">
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
        </TableFrame>
      )}
    </div>
  );
}
