namespace backend.Entities
{
    public class Account
    {
        public Guid Id { get; set; } = Guid.NewGuid();


        public Guid OwnerId { get; set; }

        public string Name { get; set; } = string.Empty;

        public AccountType Type { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
