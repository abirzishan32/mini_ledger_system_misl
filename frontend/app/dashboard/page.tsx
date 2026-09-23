import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";
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

  if (!session) {
    redirect("/login");
  }

  // Proves the full loop: the HttpOnly cookie set at sign-in is read on the
  // server and exchanged for a bearer call the backend accepts.
  const me = await apiFetch<string>("/api/auth/me", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {me.success ? `Welcome back, ${me.data}` : "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {me.success
            ? "Your session is active."
            : "Your session could not be verified. Please sign in again."}
        </p>
      </div>

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
