namespace backend.Controllers
{
    public class PaginatedResult<T>
    {
        public IEnumerable<T> Data { get; set; } = new List<T>();

        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }

        // Derived rather than stored, so it can never disagree with TotalCount and
        // PageSize. The guard avoids dividing by zero if a page size of 0 ever
        // reaches here, which the Range attribute on the controller already blocks.
        public int TotalPages => PageSize <= 0
            ? 0
            : (int)Math.Ceiling((double)TotalCount / PageSize);
    }
}
