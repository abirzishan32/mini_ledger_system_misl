import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, NotebookPen } from "lucide-react";
import { cn } from "cn";

import { TransactionForm } from "./transaction-form";
import { FormAlert } from "@/components/form-alert";
import { formatAmount, formatDate, todayIso } from "@/lib/format";
import { getAccounts, getTransactions, type Transaction } from "@/lib/ledger";
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Each one records both sides at once, so the ledger balances by
          construction rather than by checking afterwards.
        </p>
      </div>

      {(accounts.data ?? []).length < 2 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
          <NotebookPen
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">Two accounts are needed first</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Every transaction moves value between two of them — one to debit
              and one to credit.
            </p>
          </div>
          <Link
            href="/dashboard/accounts"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Add accounts
          </Link>
        </div>
      ) : (
        <TransactionForm accounts={accounts.data ?? []} today={todayIso()} />
      )}

      <div className="space-y-3">
        <FormAlert
          message={transactions.success ? "" : transactions.message}
          errors={transactions.errors ?? []}
        />

        {rows.length === 0 ? (
          <p className="rounded-xl bg-card px-6 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
            {page > 1 ? "Nothing on this page." : "No transactions yet."}
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            {rows.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
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
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  // Split by sign rather than by position. The API writes exactly two entries
  // today, but the schema allows a split transaction with more, and this reads
  // those correctly instead of silently showing the first two.
  const debits = transaction.entries.filter((entry) => entry.amount > 0);
  const credits = transaction.entries.filter((entry) => entry.amount < 0);
  const total = debits.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <li className="flex items-baseline justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{transaction.description}</p>

        {/* Wraps rather than truncates: on a phone this is the line that says
            which accounts moved, and losing it to an ellipsis would leave the
            row meaningless. */}
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <time dateTime={transaction.occurredAt}>
            {formatDate(transaction.occurredAt)}
          </time>
          <span aria-hidden="true">·</span>
          <span className="min-w-0">
            {credits.map((entry) => entry.accountName).join(" + ")}
            <span aria-hidden="true"> → </span>
            <span className="sr-only"> to </span>
            {debits.map((entry) => entry.accountName).join(" + ")}
          </span>
          {transaction.reference !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span className="min-w-0 truncate">{transaction.reference}</span>
            </>
          )}
        </p>
      </div>

      <span className="shrink-0 font-mono text-sm tabular-nums">
        {formatAmount(total)}
      </span>
    </li>
  );
}

/**
 * A link, not a button with an onClick: the page number lives in the URL, so
 * a page is shareable, survives a reload, and needs no JavaScript to change.
 *
 * Styled with buttonVariants rather than wrapped in <Button>, because it is a
 * link and should stay one. The inert ends are real disabled buttons, which is
 * the one case here that genuinely is not a navigation.
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
