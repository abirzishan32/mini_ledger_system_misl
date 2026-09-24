/**
 * Built once and reused: constructing an Intl.NumberFormat is the expensive
 * part, formatting with it is not.
 *
 * No currency symbol. The backend stores a bare decimal and records no
 * currency, so printing one would be inventing information the ledger does
 * not hold.
 */
const amountFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Magnitude only — the sign is carried by the Dr/Cr side, as on paper. */
export const formatAmount = (value: number): string =>
  amountFormat.format(Math.abs(value));

/**
 * Balances are stored signed and debit-positive, so the sign alone says which
 * side of the ledger an account sits on. Printing income as "-550.00" would
 * read as a bug; "550.00 Cr" is what a ledger actually shows.
 */
export const balanceSide = (value: number): "Dr" | "Cr" =>
  value < 0 ? "Cr" : "Dr";
