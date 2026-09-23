namespace backend.DTOs
{
    public class TransactionReadDto
    {
        public Guid Id { get; set; }
        public DateTime OccurredAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Reference { get; set; }

        /// <summary>
        /// Both sides, rather than a debit/credit pair of fields. It mirrors how the
        /// rows are actually stored, and a client that sums these gets zero, which is
        /// the invariant double entry exists to provide.
        /// </summary>
        public IReadOnlyList<EntryReadDto> Entries { get; set; } = new List<EntryReadDto>();
    }
}
