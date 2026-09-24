"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/accounts", label: "Accounts" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/trial-balance", label: "Trial balance" },
];

/**
 * The only client component in the dashboard, and it reads nothing but the
 * current path. It holds no session, no token and no data: which link is
 * highlighted is a presentation detail, so it is safe for it to run in the
 * browser. Anything that decides access stays on the server.
 */
export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1" aria-label="Sections">
      {LINKS.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === link.href
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
