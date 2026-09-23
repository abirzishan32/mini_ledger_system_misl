using backend.Entities;

namespace backend.DTOs
{
    /// <summary>
    /// One account on the trial balance. A balance appears in exactly one column:
    /// debit when positive, credit when negative, always as a positive figure. That
    /// is what lets the two column totals be compared.
    /// </summary>
    public class TrialBalanceLineDto
    {
        public Guid AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public AccountType Type { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
    }
}
