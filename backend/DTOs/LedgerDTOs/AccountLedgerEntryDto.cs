namespace backend.DTOs
{
    /// <summary>
    /// One line of an account's statement: the entry, the transaction it came from,
    /// and the balance after it was applied.
    /// </summary>
    public class AccountLedgerEntryDto
    {
        public Guid TransactionId { get; set; }
        public DateTime OccurredAt { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Reference { get; set; }

        /// <summary>Signed: positive is a debit, negative a credit.</summary>
        public decimal Amount { get; set; }

        /// <summary>
        /// The account's balance once this entry is included. Meaningful only in the
        /// order the ledger returns, so it is computed over the ordered sequence
        /// rather than stored against the entry.
        /// </summary>
        public decimal RunningBalance { get; set; }
    }
}
