namespace backend.DTOs
{
    public class EntryReadDto
    {
        public Guid AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;

        public decimal Amount { get; set; }
    }
}
