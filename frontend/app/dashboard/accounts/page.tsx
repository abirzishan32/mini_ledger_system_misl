import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Wallet } from "lucide-react";

import { AccountForm } from "./account-form";
import { EmptyState } from "@/components/empty-state";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { cn } from "cn";

import { ACCOUNT_THEMES } from "./account-theme";
import { ACCOUNT_TYPE_LABELS, groupByType } from "@/lib/account-types";
import { balanceSide, formatAmount } from "@/lib/format";
import { getAccounts } from "@/lib/ledger";

export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  // Read on the server. The browser never learns the backend's address and
  // never holds a token: it receives finished HTML for the rows this user owns.
  const result = await getAccounts();
  const accounts = result.data ?? [];

  // Grouped here rather than asked for grouped: the list is already ordered by
  // type, and one pass over at most a few dozen rows is cheaper than a second
  // endpoint. ACCOUNT_TYPES drives the order, so accounting order holds even if
  // the API returns rows in another.
  const groups = groupByType(accounts, (account) => account.type);

  return (
    <div className="space-y-6">
      {/* The form used to hold a fixed rail beside the list. Adding an account
          is a setup-time action, so it now lives behind a button and the list
          gets the page to itself. */}
      <PageHeader title="Accounts" action={<AccountForm />}>
        Your chart of accounts. Every balance is summed from posted entries,
        never stored on the account itself.
      </PageHeader>

      {/* Held to a readable column rather than the full page. A name on the far
          left and a figure on the far right of 1024px is harder to pair up than
          the two-column layout this replaced. */}
      <div className="max-w-3xl">
        {/* min-w-0: a grid track is floored at its content's min-width, so a
            long account name would widen the column and push the balances off
            a narrow screen instead of being truncated. */}
        <div className="min-w-0 space-y-4">
          <FormAlert
            message={result.success ? "" : result.message}
            errors={result.errors ?? []}
          />

          {accounts.length === 0 ? (
            <EmptyState icon={Wallet} title="No accounts yet">
              Add Cash, Sales, or an expense account to start recording entries
              against them.
            </EmptyState>
          ) : (
            groups.map((group) => {
              const theme = ACCOUNT_THEMES[group.type];
              const TypeIcon = theme.icon;

              return (
                <section
                  key={group.type}
                  className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
                >
                  {/* The 4px left edge is the group's colour. It reads as a tab
                    down the side of the card once several are stacked, which is
                    what makes the five groups tellable apart at a glance. */}
                  <h2
                    className={cn(
                      "flex items-center gap-2.5 border-b border-l-4 px-4 py-2.5 text-sm font-medium",
                      theme.header,
                    )}
                  >
                    <TypeIcon
                      className={cn("size-4 shrink-0", theme.iconColor)}
                      aria-hidden="true"
                    />
                    {ACCOUNT_TYPE_LABELS[group.type]}
                    <span
                      className={cn(
                        "ml-auto rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                        theme.badge,
                      )}
                    >
                      {group.items.length}
                    </span>
                  </h2>

                  {/* A flex row rather than a table: two fields need no columns,
                    and this stays readable down to a 320px screen without a
                    second mobile-only markup tree to keep in step. */}
                  <ul className="divide-y">
                    {group.items.map((account) => (
                      <li key={account.id}>
                        {/* The whole row is the link, so the tap target is the
                          row rather than the few characters of its name. */}
                        <Link
                          href={`/dashboard/accounts/${account.id}`}
                          className={cn(
                            "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
                            theme.row,
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                theme.dot,
                              )}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 truncate text-sm">
                              {account.name}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            {/* The figure carries the group's colour; the Dr/Cr
                              stays grey, so the eye lands on the number. */}
                            <span
                              className={cn(
                                "font-mono text-sm tabular-nums",
                                theme.balance,
                              )}
                            >
                              {formatAmount(account.balance)}
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                {balanceSide(account.balance)}
                              </span>
                            </span>
                            <ChevronRight
                              className="size-3.5 text-muted-foreground"
                              aria-hidden="true"
                            />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
