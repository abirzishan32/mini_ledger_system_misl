import "server-only";

import { apiFetchAuthed, type ApiResponse } from "@/lib/api";
import type { AccountType } from "@/lib/account-types";

// Re-exported so a caller has one import for the ledger's shapes, while the
// enum itself stays in a module the browser may also read.
export type { AccountType } from "@/lib/account-types";

/**
 * Mirrors the backend's ledger DTOs. Hand-written rather than generated: five
 * small shapes are cheaper to read than a codegen step, and a mismatch shows up
 * immediately as a type error at the point of use.
 */

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  createdAt: string;
  /** Signed, debit-positive. Credit-normal types read negative here. */
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

/**
 * Mirrors PaginatedResult<T>. The page is decided and sliced by the backend; the
 * frontend only asks for one and reads the totals back. Slicing a full list in
 * the browser would mean the server had already sent every row, which is both
 * slower and a disclosure the pager was supposed to prevent.
 */
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

export const getAccounts = (): Promise<ApiResponse<Account[]>> =>
  apiFetchAuthed<Account[]>("/api/accounts");

export const getAccount = (id: string): Promise<ApiResponse<Account>> =>
  apiFetchAuthed<Account>(`/api/accounts/${id}`);

export const getAccountLedger = (id: string): Promise<ApiResponse<LedgerLine[]>> =>
  apiFetchAuthed<LedgerLine[]>(`/api/accounts/${id}/entries`);

export const getTrialBalance = (): Promise<ApiResponse<TrialBalance>> =>
  apiFetchAuthed<TrialBalance>("/api/accounts/trial-balance");

export const getTransactions = (
  page = 1,
  pageSize = 20,
): Promise<ApiResponse<Paginated<Transaction>>> =>
  apiFetchAuthed<Paginated<Transaction>>(
    `/api/transactions?page=${page}&pageSize=${pageSize}`,
  );
