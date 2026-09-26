using backend.DTOs;

namespace backend.Interfaces
{
    // Contract for AccountService, registered scoped in Program.cs and consumed by
    // AccountsController. Every method takes ownerId first: nothing here can be
    // called without naming whose books are being read or written.
    public interface IAccountService
    {
        Task<IReadOnlyList<AccountReadDto>> GetAccounts(Guid ownerId);

        // Null when the account does not exist or belongs to someone else.
        Task<AccountReadDto?> GetAccount(Guid ownerId, Guid accountId);

        // Null when the owner already has an account with that name.
        Task<AccountReadDto?> CreateAccount(Guid ownerId, AccountWriteDto request);

        // Null for both "no such account" and "name taken"; the caller must
        // distinguish them itself if the difference matters.
        Task<AccountReadDto?> RenameAccount(Guid ownerId, Guid accountId, AccountUpdateDto request);

        // Null for no such account; an empty list for one with no entries yet.
        Task<IReadOnlyList<AccountLedgerEntryDto>?> GetAccountLedger(Guid ownerId, Guid accountId);

        Task<TrialBalanceDto> GetTrialBalance(Guid ownerId);
    }
}
