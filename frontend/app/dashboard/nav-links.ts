import {
  ArrowLeftRight,
  LayoutDashboard,
  Scale,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// The four sections, in the order they appear in the sidebar. Read by
// sidebar.tsx, which renders one link per entry.
export const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/trial-balance", label: "Trial balance", icon: Scale },
];

// Decides which sidebar link is highlighted for the current path.
// Overview matches exactly; the rest match their subtree, so a statement at
// /dashboard/accounts/<id> still highlights Accounts rather than nothing.
export function isActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}
