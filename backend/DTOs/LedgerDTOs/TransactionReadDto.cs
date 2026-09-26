namespace backend.DTOs
{
    public class TransactionReadDto
    {
        public Guid Id { get; set; }
        public DateTime OccurredAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Reference { get; set; }

        public IReadOnlyList<EntryReadDto> Entries { get; set; } = new List<EntryReadDto>();
    }
}
