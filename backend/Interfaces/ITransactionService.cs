using backend.Controllers;
using backend.DTOs;

namespace backend.Interfaces
{
    // Contract for TransactionService, registered scoped in Program.cs and consumed
    // by TransactionsController.
    public interface ITransactionService
    {
        Task<PaginatedResult<TransactionReadDto>> GetTransactions(Guid ownerId, int page, int pageSize);

        Task<TransactionReadDto?> GetTransaction(Guid ownerId, Guid transactionId);

        // Returns the transaction, or an Error explaining the refusal. Exactly one of
        // the two is set, which lets the service report a business failure such as
        // insufficient funds without knowing anything about HTTP status codes.
        Task<(TransactionReadDto? Transaction, string? Error)> CreateTransaction(
            Guid ownerId, TransactionWriteDto request, string? idempotencyKey);
    }
}
