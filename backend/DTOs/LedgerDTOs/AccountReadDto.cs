using backend.Entities;

namespace backend.DTOs
{
    public class AccountReadDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public AccountType Type { get; set; }
        public DateTime CreatedAt { get; set; }

        public decimal Balance { get; set; }
    }
}
