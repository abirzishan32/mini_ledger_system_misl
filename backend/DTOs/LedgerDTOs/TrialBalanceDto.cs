namespace backend.DTOs
{
    /// <summary>
    /// The ledger checking itself. Every transaction posts equal debits and credits,
    /// so these two totals must match; if they ever diverge, something has written
    /// entries outside the normal path and the ledger is no longer trustworthy.
    /// </summary>
    public class TrialBalanceDto
    {
        public IReadOnlyList<TrialBalanceLineDto> Lines { get; set; } = new List<TrialBalanceLineDto>();
        public decimal TotalDebits { get; set; }
        public decimal TotalCredits { get; set; }
        public bool IsBalanced { get; set; }
    }
}
