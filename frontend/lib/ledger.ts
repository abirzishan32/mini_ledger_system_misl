import "server-only";

import { apiFetchAuthed, type ApiResponse } from "@/lib/api";
import type { AccountType } from "@/lib/account-types";

// Re-exported so a caller has one import for the ledger's shapes, while the
// enum itself stays in a module the browser may also read.
export type { AccountType } from "@/lib/account-types";

// The shapes below mirror the backend's ledger DTOs. Hand-written rather than
// generated: five small types are cheaper to read than a codegen step, and a
// mismatch shows up immediately as a type error at the point of use.

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  createdAt: string;
  // Signed, debit-positive. Credit-normal types read negative here.
  balance: number;
};

export type TransactionEntry = {
  accountId: string;
  accountName: string;
  amount: number;
};

export type Transaction = {
  id: string;
  occurredAt: string;
  createdAt: string;
  description: string;
  reference: string | null;
  entries: TransactionEntry[];
};

export type LedgerLine = {
  transactionId: string;
  occurredAt: string;
  description: string;
  reference: string | null;
  amount: number;
  runningBalance: number;
};

export type TrialBalanceLine = {
  accountId: string;
  accountName: string;
  type: AccountType;
  debit: number;
  credit: number;
};

// Mirrors PaginatedResult<T>. The page is chosen and sliced by the backend; the
// frontend only asks for one and reads the totals back. Slicing a full list here
// would mean the server had already sent every row, which is both slower and the
// disclosure the pager exists to prevent.
export type Paginated<T> = {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type TrialBalance = {
  lines: TrialBalanceLine[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
};

// Every read goes through apiFetchAuthed, so none of them can reach the backend
// without the caller's own token. There is no variant that takes a user id.

// Every read below goes through apiFetchAuthed, so none can reach the backend
// without the caller's own token, and none takes a user id to ask on behalf of
// someone else. Each returns the backend's envelope for the page to unwrap.
export const getAccounts = (): Promise<ApiResponse<Account[]>> =>
  apiFetchAuthed<Account[]>("/api/accounts");

// GET /api/accounts/{id} — one account with its balance. A 404 comes back in
// the envelope, which the statement page turns into notFound().
export const getAccount = (id: string): Promise<ApiResponse<Account>> =>
  apiFetchAuthed<Account>(`/api/accounts/${id}`);

// GET /api/accounts/{id}/entries — that account's statement, oldest first,
// with the running balance the backend accumulated over that order.
export const getAccountLedger = (id: string): Promise<ApiResponse<LedgerLine[]>> =>
  apiFetchAuthed<LedgerLine[]>(`/api/accounts/${id}/entries`);

// GET /api/accounts/trial-balance — every account split into a debit or credit
// column, with both totals and whether they agree. Used by the trial balance
// page and by the overview tile, which reads the account count from its lines.
export const getTrialBalance = (): Promise<ApiResponse<TrialBalance>> =>
  apiFetchAuthed<TrialBalance>("/api/accounts/trial-balance");

// GET /api/transactions — one page of history, newest first. Page and size go
// to the backend, which does the counting and slicing; nothing is sliced here.
export const getTransactions = (
  page = 1,
  pageSize = 20,
): Promise<ApiResponse<Paginated<Transaction>>> =>
  apiFetchAuthed<Paginated<Transaction>>(
    `/api/transactions?page=${page}&pageSize=${pageSize}`,
  );
