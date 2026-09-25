import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { cn } from "cn";

import { EmptyState } from "@/components/empty-state";
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
    <EmptyState
      icon={FileQuestion}
      title="Not found"
      titleAs="h1"
      action={
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to the dashboard
        </Link>
      }
    >
      This page does not exist, or it belongs to another ledger.
    </EmptyState>
  );
}
