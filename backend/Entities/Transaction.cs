namespace backend.Entities
{
    public class Transaction
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid OwnerId { get; set; }


        public DateTime OccurredAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public string Description { get; set; } = string.Empty;


        public string? Reference { get; set; }

    
        public string? IdempotencyKey { get; set; }

        public ICollection<Entry> Entries { get; set; } = new List<Entry>();
    }
}
