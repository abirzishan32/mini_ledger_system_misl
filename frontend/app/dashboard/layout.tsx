import { LogOut, Wallet } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { Nav } from "./nav";
import { Button } from "@/components/ui/button";
import { getSession, readAccessTokenClaims } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const username = session
    ? readAccessTokenClaims(session.accessToken)?.unique_name
    : undefined;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2.5 px-3 sm:px-5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Mini Ledger
          </span>

          <div className="ml-4 hidden sm:block">
            <Nav />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {username && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {username}
              </span>
            )}
            {/* A plain form, so signing out still works without JavaScript. */}
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* The same links on a narrow screen, on their own row. Below sm the
          header has no space for them, and hiding them there would leave a
          phone with no way out of this page. A scrolling row costs five lines;
          a drawer would cost a dependency and a second focus trap. */}
      <div className="border-b sm:hidden">
        <div className="mx-auto w-full max-w-5xl overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Nav className="w-max py-1.5" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-8 sm:px-5">
        {children}
      </main>
    </div>
  );
}
