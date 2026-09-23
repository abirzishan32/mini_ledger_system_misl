import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleAlert } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";
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
  const session = await getSession();

  // Checked here as well as in proxy.ts: proxy is routing convenience, this is
  // the boundary that actually guards the data.
  if (!session) {
    redirect("/login");
  }

  const me = await apiFetch<string>("/api/auth/me", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  // Proxy already tried to refresh before this rendered, so a rejection here
  // means the session is genuinely dead rather than merely stale.
  if (me.statusCode === 401) {
    redirect("/login");
  }

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
