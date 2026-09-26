import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { apiFetchAuthed } from "@/lib/api";
import { formatAmount } from "@/lib/format";
import { getTransactions, getTrialBalance } from "@/lib/ledger";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [me, transactions, trialBalance] = await Promise.all([
    apiFetchAuthed<string>("/api/auth/me"),
    getTransactions(1, 1),
    getTrialBalance(),
  ]);

  const accountCount = trialBalance.data?.lines.length ?? 0;
  const transactionCount = transactions.data?.totalCount ?? 0;
  const balanced = trialBalance.data?.isBalanced ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title={me.success ? `Welcome back, ${me.data}` : "Dashboard"}>
        Accounts, entries and running balances live here.
      </PageHeader>

      <FormAlert
        message={trialBalance.success ? "" : trialBalance.message}
        errors={trialBalance.errors ?? []}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile
          href="/dashboard/accounts"
          label="Accounts"
          value={String(accountCount)}
          hint={accountCount === 0 ? "Add your first" : "Chart of accounts"}
        />
        <Tile
          href="/dashboard/transactions"
          label="Transactions"
          value={String(transactionCount)}
          hint={
            transactionCount === 0
              ? "Nothing posted yet"
              : "Both sides recorded"
          }
        />
        <Tile
          href="/dashboard/trial-balance"
          label="Ledger"
          value={balanced ? "In balance" : "Out of balance"}
          hint={
            trialBalance.data
              ? `${formatAmount(trialBalance.data.totalDebits)} each side`
              : "Unavailable"
          }
        />
      </div>
    </div>
  );
}

function Tile({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group/tile flex flex-col gap-1 rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/60"
    >
      <span className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight tabular-nums">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </Link>
  );
}
