namespace backend.Entities
{
    public class Entry
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TransactionId { get; set; }
        public Transaction Transaction { get; set; } = null!;

        public Guid AccountId { get; set; }
        public Account Account { get; set; } = null!;

        public decimal Amount { get; set; }
    }
}
