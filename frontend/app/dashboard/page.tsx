import type { Metadata } from "next";
import { CircleAlert } from "lucide-react";

import { apiFetchAuthed } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // apiFetchAuthed reads the session itself and redirects if it is missing or
  // rejected, so this page cannot render with an unauthenticated caller.
  const me = await apiFetchAuthed<string>("/api/auth/me");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {me.success ? `Welcome back, ${me.data}` : "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Accounts, entries and running balances live here.
        </p>
      </div>

      {!me.success && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{me.message}</AlertTitle>
          <AlertDescription>
            Your session is still valid. Retry once the server is reachable.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
          <CardDescription>
            Accounts, entries and running balances will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nothing recorded yet.
        </CardContent>
      </Card>
    </div>
  );
}
