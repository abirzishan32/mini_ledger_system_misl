/**
 * The values of the backend's AccountType enum, in the order a chart of
 * accounts is conventionally read.
 *
 * Deliberately not in lib/ledger.ts: that module is server-only, and the create
 * form runs in the browser. These five names are not a secret and carry no
 * data, so sharing them costs nothing; everything that decides access or
 * touches the database stays behind lib/ledger.ts.
 */
export const ACCOUNT_TYPES = [
  "Asset",
  "Liability",
  "Income",
  "Expense",
  "Equity",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

/** Plural headings, so a section holding three assets does not read "Asset". */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  Asset: "Assets",
  Liability: "Liabilities",
  Income: "Income",
  Expense: "Expenses",
  Equity: "Equity",
};
