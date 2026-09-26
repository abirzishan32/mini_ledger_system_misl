// Built once and reused: constructing an Intl.NumberFormat is the expensive
// part, formatting with it is not. No currency symbol, because the backend
// stores a bare decimal and records no currency — printing one would invent
// information the ledger does not hold.
const amountFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Formats an amount to two decimal places, magnitude only: the sign is carried
// separately by balanceSide, the way a paper ledger uses two columns.
export const formatAmount = (value: number): string =>
  amountFormat.format(Math.abs(value));

// Turns a signed balance into the Dr or Cr label shown beside it. Balances are
// stored debit-positive, so the sign alone says which side an account sits on.
// Printing income as "-550.00" would read as a bug; "550.00 Cr" is what a
// ledger actually shows.
export const balanceSide = (value: number): "Dr" | "Cr" =>
  value < 0 ? "Cr" : "Dr";

// Formatted in UTC on purpose. Dates are stored as an instant but mean a
// calendar day, and the form sends midnight UTC, so rendering in the viewer's
// zone would show the previous day to anyone west of Greenwich. Day-month-year
// with a named month, so 05/01 is never misread as 1 May.
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

// Renders a backend ISO timestamp as the calendar day it represents.
export const formatDate = (iso: string): string => dateFormat.format(new Date(iso));

// Today as the yyyy-mm-dd value an <input type="date"> expects. Resolved on the
// server and passed into the transaction form, so the first render matches the
// hydration.
// ponytail: the server's clock, not the viewer's, so a user far enough east or
// west may be offered yesterday. The field is visible and editable, which is the
// cheap fix. Read the zone from the client if that stops being true.
export const todayIso = (): string => new Date().toISOString().slice(0, 10);
