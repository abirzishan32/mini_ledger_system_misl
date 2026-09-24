import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";

/**
 * Rendered inside the dashboard layout, so a missing account still leaves the
 * navigation in place instead of dropping the user on a bare error screen.
 *
 * The wording is deliberately the same whether the account does not exist or
 * belongs to somebody else: telling the two apart would turn this page into a
 * way to test which ids are real.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-16 text-center ring-1 ring-foreground/10">
      <FileQuestion className="size-6 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This page does not exist, or it belongs to another ledger.
        </p>
      </div>
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        Back to the dashboard
      </Link>
    </div>
  );
}
