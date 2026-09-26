// The values of the backend's AccountType enum, in the order a chart of accounts
// is conventionally read. Deliberately not in lib/ledger.ts, which is
// server-only: the create form runs in the browser and needs these five names.
// They are not secret and carry no data, so sharing them costs nothing, while
// everything that decides access or touches the database stays server-side.
export const ACCOUNT_TYPES = [
  "Asset",
  "Liability",
  "Income",
  "Expense",
  "Equity",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

// Plural headings, so a section holding three assets does not read "Asset".
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  Asset: "Assets",
  Liability: "Liabilities",
  Income: "Income",
  Expense: "Expenses",
  Equity: "Equity",
};

// Groups anything carrying an account type into the five buckets, in chart
// order, dropping empty ones. ACCOUNT_TYPES drives the order, so the grouping
// holds even if the API returns rows in another. Used by both the accounts page
// and the trial balance, which had the same map-filter pair written out twice.
export function groupByType<T>(
  items: readonly T[],
  typeOf: (item: T) => AccountType,
): { type: AccountType; items: T[] }[] {
  return ACCOUNT_TYPES.map((type) => ({
    type,
    items: items.filter((item) => typeOf(item) === type),
  })).filter((group) => group.items.length > 0);
}
