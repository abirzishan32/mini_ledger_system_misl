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

/**
 * Dates are stored as an instant but mean a calendar day, and the form sends
 * midnight UTC. Formatting in UTC keeps the day the user picked: rendering in
 * the viewer's zone would show 4 January to anyone west of Greenwich.
 *
 * Day-month-year with a named month, so 05/01 is never read as 1 May.
 */
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDate = (iso: string): string => dateFormat.format(new Date(iso));

/**
 * Today as the value a <input type="date"> expects.
 *
 * ponytail: the server's clock, not the viewer's, so a user far enough east or
 * west may be offered yesterday or tomorrow. The field is visible and editable,
 * which is the cheap fix. Read the zone from the client if that stops being true.
 */
export const todayIso = (): string => new Date().toISOString().slice(0, 10);
