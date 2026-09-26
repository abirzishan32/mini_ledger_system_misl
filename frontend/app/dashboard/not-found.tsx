import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { cn } from "cn";

import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

// Shown when notFound() is called inside the dashboard, which the account
// statement page does on a 404. Rendered inside the dashboard layout, so the
// sidebar stays in place rather than dropping the user on a bare error screen.
// The wording is the same whether the account is missing or belongs to someone
// else: telling the two apart would make this a way to test which ids are real.
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
