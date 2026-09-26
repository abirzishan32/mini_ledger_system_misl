using backend.Controllers;
using backend.DTOs;

namespace backend.Interfaces
{
    public interface ITransactionService
    {
        Task<PaginatedResult<TransactionReadDto>> GetTransactions(Guid ownerId, int page, int pageSize);

        Task<TransactionReadDto?> GetTransaction(Guid ownerId, Guid transactionId);

        Task<(TransactionReadDto? Transaction, string? Error)> CreateTransaction(
            Guid ownerId, TransactionWriteDto request, string? idempotencyKey);
    }
}
