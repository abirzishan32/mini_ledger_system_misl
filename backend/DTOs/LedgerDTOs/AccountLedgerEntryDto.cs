namespace backend.DTOs
{
    public class AccountLedgerEntryDto
    {
        public Guid TransactionId { get; set; }
        public DateTime OccurredAt { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Reference { get; set; }


        public decimal Amount { get; set; }

        public decimal RunningBalance { get; set; }
    }
}
