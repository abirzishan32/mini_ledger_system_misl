using backend.DTOs;

namespace backend.Interfaces
{
    public interface IAccountService
    {
        Task<IReadOnlyList<AccountReadDto>> GetAccounts(Guid ownerId);

        Task<AccountReadDto?> GetAccount(Guid ownerId, Guid accountId);

        Task<AccountReadDto?> CreateAccount(Guid ownerId, AccountWriteDto request);

        Task<AccountReadDto?> RenameAccount(Guid ownerId, Guid accountId, AccountUpdateDto request);

        Task<IReadOnlyList<AccountLedgerEntryDto>?> GetAccountLedger(Guid ownerId, Guid accountId);

        Task<TrialBalanceDto> GetTrialBalance(Guid ownerId);
    }
}
