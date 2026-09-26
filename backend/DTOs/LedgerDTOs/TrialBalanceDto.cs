namespace backend.DTOs
{
    public class TrialBalanceDto
    {
        public IReadOnlyList<TrialBalanceLineDto> Lines { get; set; } = new List<TrialBalanceLineDto>();
        public decimal TotalDebits { get; set; }
        public decimal TotalCredits { get; set; }
        public bool IsBalanced { get; set; }
    }
}
