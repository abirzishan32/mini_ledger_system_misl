using backend.DTOs;

namespace backend.Interfaces
{
    public interface ITransactionService
    {
        Task<IReadOnlyList<TransactionReadDto>> GetTransactions(Guid ownerId, int page, int pageSize);

        Task<TransactionReadDto?> GetTransaction(Guid ownerId, Guid transactionId);

    
        Task<TransactionReadDto?> CreateTransaction(Guid ownerId, TransactionWriteDto request, string? idempotencyKey);
    }
}
