using backend.Controllers;
using backend.DTOs;

namespace backend.Interfaces
{
    public interface ITransactionService
    {
        Task<PaginatedResult<TransactionReadDto>> GetTransactions(Guid ownerId, int page, int pageSize);

        Task<TransactionReadDto?> GetTransaction(Guid ownerId, Guid transactionId);

    
        /// <summary>
        /// Posts a transfer. Returns the transaction, or an Error describing why it
        /// was refused — the two refusals differ, so the caller can say which.
        /// </summary>
        Task<(TransactionReadDto? Transaction, string? Error)> CreateTransaction(
            Guid ownerId, TransactionWriteDto request, string? idempotencyKey);
    }
}
