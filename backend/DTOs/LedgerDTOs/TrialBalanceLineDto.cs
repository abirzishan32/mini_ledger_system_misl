using backend.Entities;

namespace backend.DTOs
{
    public class TrialBalanceLineDto
    {
        public Guid AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public AccountType Type { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
    }
}
