import { Wallet } from "lucide-react";

// Frame shared by the sign-in and create-account pages: the app mark and a
// centred column. Separate from the dashboard layout, which has the sidebar and
// would need a session these pages do not have.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[25rem] space-y-6">
          <header className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="size-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="text-base font-semibold tracking-tight">
                Mini Ledger
              </p>
              <p className="text-sm text-muted-foreground">
                Track accounts, entries and running balances.
              </p>
            </div>
          </header>

          {children}
        </div>
      </main>
    </div>
  );
}
