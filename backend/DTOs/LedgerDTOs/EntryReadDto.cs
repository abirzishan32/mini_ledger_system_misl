namespace backend.DTOs
{
    public class EntryReadDto
    {
        public Guid AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;

        /// <summary>Signed: positive is a debit, negative a credit.</summary>
        public decimal Amount { get; set; }
    }
}
