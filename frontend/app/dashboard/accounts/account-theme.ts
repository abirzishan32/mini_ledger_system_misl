import {
  Landmark,
  PieChart,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { AccountType } from "@/lib/account-types";


export type AccountTheme = {
  icon: LucideIcon;
  /** Group header: the 4px left edge and a faint wash behind it. */
  header: string;
  /** The header icon, and the same icon in the type picker. */
  iconColor: string;
  /** The count beside the group heading. */
  badge: string;
  /** The marker beside an account name. */
  dot: string;
  /** The balance figure. Muted enough to stay comfortable to read down a column. */
  balance: string;
  /** Row hover, kept very light so the name stays the thing you notice. */
  row: string;
};

export const ACCOUNT_THEMES: Record<AccountType, AccountTheme> = {
  Asset: {
    icon: Wallet,
    header:
      "border-l-emerald-500 bg-emerald-500/5 dark:border-l-emerald-400 dark:bg-emerald-400/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    balance: "text-emerald-700 dark:text-emerald-300",
    row: "hover:bg-emerald-500/5 dark:hover:bg-emerald-400/10",
  },
  Liability: {
    icon: Landmark,
    header:
      "border-l-amber-500 bg-amber-500/5 dark:border-l-amber-400 dark:bg-amber-400/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    badge:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300",
    dot: "bg-amber-500 dark:bg-amber-400",
    balance: "text-amber-700 dark:text-amber-300",
    row: "hover:bg-amber-500/5 dark:hover:bg-amber-400/10",
  },
  Income: {
    icon: TrendingUp,
    header:
      "border-l-sky-500 bg-sky-500/5 dark:border-l-sky-400 dark:bg-sky-400/10",
    iconColor: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-300",
    dot: "bg-sky-500 dark:bg-sky-400",
    balance: "text-sky-700 dark:text-sky-300",
    row: "hover:bg-sky-500/5 dark:hover:bg-sky-400/10",
  },
  Expense: {
    icon: TrendingDown,
    header:
      "border-l-rose-500 bg-rose-500/5 dark:border-l-rose-400 dark:bg-rose-400/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    badge:
      "bg-rose-500/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300",
    dot: "bg-rose-500 dark:bg-rose-400",
    balance: "text-rose-700 dark:text-rose-300",
    row: "hover:bg-rose-500/5 dark:hover:bg-rose-400/10",
  },
  Equity: {
    icon: PieChart,
    header:
      "border-l-violet-500 bg-violet-500/5 dark:border-l-violet-400 dark:bg-violet-400/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    badge:
      "bg-violet-500/15 text-violet-700 dark:bg-violet-400/20 dark:text-violet-300",
    dot: "bg-violet-500 dark:bg-violet-400",
    balance: "text-violet-700 dark:text-violet-300",
    row: "hover:bg-violet-500/5 dark:hover:bg-violet-400/10",
  },
};
