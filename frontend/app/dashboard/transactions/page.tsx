import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, NotebookPen } from "lucide-react";
import { cn } from "cn";

import { TransactionForm } from "./transaction-form";
import { ACCOUNT_THEMES } from "../accounts/account-theme";
import { EmptyState } from "@/components/empty-state";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { formatAmount, formatDate, todayIso } from "@/lib/format";
import type { AccountType } from "@/lib/account-types";
import {
  getAccounts,
  getTransactions,
  type Transaction,
  type TransactionEntry,
} from "@/lib/ledger";
import { Button, buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Transactions" };

/** Smaller than the backend's default of 50: a page should fit on a screen. */
const PAGE_SIZE = 20;

export default async function TransactionsPage({
  searchParams,
}: PageProps<"/dashboard/transactions">) {
  const { page: requested } = await searchParams;

  // Clamped here only so the label cannot read "Page 0". Which rows that page
  // contains is decided entirely by the backend: it counts, orders, skips and
  // takes. Nothing is sliced in the browser, so no row the user does not own
  // is ever sent in the first place.
  const page = Math.max(1, Number(requested) || 1);

  const [transactions, accounts] = await Promise.all([
    getTransactions(page, PAGE_SIZE),
    getAccounts(),
  ]);

  const result = transactions.data;
  const rows = result?.data ?? [];
  const totalPages = result?.totalPages ?? 0;
  const accountList = accounts.data ?? [];

  // The accounts are already fetched for the form's pickers, so colouring each
  // side of a transaction by its account type costs one Map rather than a
  // second request.
  const typeById = new Map(accountList.map((a) => [a.id, a.type]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        action={
          accountList.length >= 2 ? (
            <TransactionForm accounts={accountList} today={todayIso()} />
          ) : undefined
        }
      >
        Each one records both sides at once, so the ledger balances by
        construction rather than by checking afterwards.
      </PageHeader>

      {accountList.length < 2 ? (
        <EmptyState
          icon={NotebookPen}
          title="Two accounts are needed first"
          action={
            <Link
              href="/dashboard/accounts"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Add accounts
            </Link>
          }
        >
          Every transaction moves value between two of them — one to debit and
          one to credit.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          <FormAlert
            message={transactions.success ? "" : transactions.message}
            errors={transactions.errors ?? []}
          />

          {rows.length === 0 ? (
            <EmptyState
              title={page > 1 ? "Nothing on this page" : "No transactions yet"}
            >
              {page > 1
                ? undefined
                : "Post one with the button above and both sides appear here."}
            </EmptyState>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              {rows.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  typeById={typeById}
                />
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <nav
              className="flex flex-wrap items-center justify-between gap-3"
              aria-label="Pagination"
            >
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ·{" "}
                <span className="tabular-nums">{result?.totalCount ?? 0}</span>{" "}
                transactions
              </p>
              <div className="flex gap-2">
                <PagerLink page={page - 1} disabled={page <= 1}>
                  <ArrowLeft aria-hidden="true" />
                  Previous
                </PagerLink>
                <PagerLink page={page + 1} disabled={page >= totalPages}>
                  Next
                  <ArrowRight aria-hidden="true" />
                </PagerLink>
              </div>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

function TransactionRow({
  transaction,
  typeById,
}: {
  transaction: Transaction;
  typeById: Map<string, AccountType>;
}) {
  // Split by sign rather than by position. The API writes exactly two entries
  // today, but the schema allows a split transaction with more, and this reads
  // those correctly instead of silently showing the first two.
  const debits = transaction.entries.filter((entry) => entry.amount > 0);
  const credits = transaction.entries.filter((entry) => entry.amount < 0);
  const total = debits.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <li className="transition-colors hover:bg-muted/50">
      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{transaction.description}</p>

          {/* Wraps rather than truncates: on a phone this is the line that says
              which accounts moved, and losing it to an ellipsis would leave the
              row meaningless. Dr and Cr are named rather than implied by an
              arrow, so the direction does not depend on knowing a convention. */}
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
            <time dateTime={transaction.occurredAt}>
              {formatDate(transaction.occurredAt)}
            </time>
            <Side label="Dr" entries={debits} typeById={typeById} />
            <Side label="Cr" entries={credits} typeById={typeById} />
            {transaction.reference !== null && (
              <span className="min-w-0 truncate">{transaction.reference}</span>
            )}
          </p>
        </div>

        <span className="shrink-0 font-mono text-sm tabular-nums">
          {formatAmount(total)}
        </span>
      </div>
    </li>
  );
}

/** One side of a transaction: its label, then each account with its type colour. */
function Side({
  label,
  entries,
  typeById,
}: {
  label: "Dr" | "Cr";
  entries: TransactionEntry[];
  typeById: Map<string, AccountType>;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="font-mono text-[0.6875rem] text-muted-foreground/70">
        {label}
      </span>
      {entries.map((entry) => {
        const type = typeById.get(entry.accountId);

        return (
          <span
            key={entry.accountId}
            className="flex min-w-0 items-center gap-1"
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                type ? ACCOUNT_THEMES[type].dot : "bg-muted-foreground/40",
              )}
              aria-hidden="true"
            />
            <span className="truncate text-foreground/80">
              {entry.accountName}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * A link, not a button with an onClick: the page number lives in the URL, so
 * a page is shareable, survives a reload, and needs no JavaScript to change.
 * The inert ends are real disabled buttons, which is the one case here that
 * genuinely is not a navigation.
 */
function PagerLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled>
        {children}
      </Button>
    );
  }

  return (
    <Link
      href={`/dashboard/transactions?page=${page}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      {children}
    </Link>
  );
}
