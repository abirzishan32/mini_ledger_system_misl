using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Services
{
    public class AccountService : IAccountService
    {
        private readonly AppDbContext _appDbContext;
        private readonly IMapper _mapper;

        public AccountService(AppDbContext appDbContext, IMapper mapper)
        {
            _appDbContext = appDbContext;
            _mapper = mapper;
        }

        // Lists the owner's accounts in chart order: by type, then by name.
        // Balances come from WithBalance as a correlated subquery, so the whole
        // list costs one statement rather than one per account.
        public async Task<IReadOnlyList<AccountReadDto>> GetAccounts(Guid ownerId)
        {
            return await WithBalance(OwnedBy(ownerId)
                    .OrderBy(account => account.Type)
                    .ThenBy(account => account.Name))
                .ToListAsync();
        }

        // Fetches one account with its balance, scoped to the owner by OwnedBy.
        // Returns null when the account is missing or belongs to someone else, which
        // AccountsController reports as 404 either way.
        public async Task<AccountReadDto?> GetAccount(Guid ownerId, Guid accountId)
        {
            return await WithBalance(OwnedBy(ownerId).Where(account => account.Id == accountId))
                .FirstOrDefaultAsync();
        }

        // Creates an account, mapping the DTO through AutoMapper's AccountProfile and
        // stamping owner and creation time on the server so the client cannot set them.
        // A 23505 from the unique index on (OwnerId, Name) is a duplicate name and
        // returns null. The balance is built as 0 rather than re-read: a new account
        // has no entries, so a round trip would only confirm what is already known.
        public async Task<AccountReadDto?> CreateAccount(Guid ownerId, AccountWriteDto request)
        {
            var account = _mapper.Map<Account>(request);
            account.OwnerId = ownerId;
            account.CreatedAt = DateTime.UtcNow;

            _appDbContext.Accounts.Add(account);

            try
            {
                await _appDbContext.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
            {

                return null;
            }

            return new AccountReadDto
            {
                Id = account.Id,
                Name = account.Name,
                Type = account.Type,
                CreatedAt = account.CreatedAt,
                Balance = 0m
            };
        }

        // Renames an owned account, then re-reads it through GetAccount so the reply
        // carries the current balance. Returns null both when the account does not
        // exist and when the new name collides; AccountsController checks existence
        // beforehand so it can tell the caller which of the two happened.
        public async Task<AccountReadDto?> RenameAccount(Guid ownerId, Guid accountId, AccountUpdateDto request)
        {
            var account = await OwnedBy(ownerId)
                .FirstOrDefaultAsync(candidate => candidate.Id == accountId);

            if (account == null)
            {
                return null;
            }

            account.Name = request.Name;

            try
            {
                await _appDbContext.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
            {
                return null;
            }

            return await GetAccount(ownerId, accountId);
        }

       
        // Builds an account's statement, oldest first, accumulating a running balance
        // over the ordered rows. Ownership is checked separately so "no such account"
        // stays distinguishable from "account with no entries" — both would otherwise
        // be an empty list. Rows are projected by AutoMapper's AccountProfile.
        public async Task<IReadOnlyList<AccountLedgerEntryDto>?> GetAccountLedger(Guid ownerId, Guid accountId)
        {
            if (!await OwnedBy(ownerId).AnyAsync(account => account.Id == accountId))
            {
                return null;
            }

            var ledger = await _appDbContext.Entries
                .Where(entry => entry.AccountId == accountId && entry.Account.OwnerId == ownerId)
                .OrderBy(entry => entry.Transaction.OccurredAt)
                .ThenBy(entry => entry.Transaction.CreatedAt)
                .ProjectTo<AccountLedgerEntryDto>(_mapper.ConfigurationProvider)
                .ToListAsync();

            var runningBalance = 0m;

            foreach (var line in ledger)
            {
                runningBalance += line.Amount;
                line.RunningBalance = runningBalance;
            }

            return ledger;
        }

        // Splits every balance into the debit or credit column by its sign and totals
        // both sides. Reuses GetAccounts instead of aggregating again, so the system
        // holds one definition of "balance" and the two pages cannot disagree.
        public async Task<TrialBalanceDto> GetTrialBalance(Guid ownerId)
        {
            var accounts = await GetAccounts(ownerId);

            var lines = accounts
                .Select(account => new TrialBalanceLineDto
                {
                    AccountId = account.Id,
                    AccountName = account.Name,
                    Type = account.Type,
                    Debit = account.Balance > 0 ? account.Balance : 0m,
                    Credit = account.Balance < 0 ? -account.Balance : 0m
                })
                .ToList();

            var totalDebits = lines.Sum(line => line.Debit);
            var totalCredits = lines.Sum(line => line.Credit);

            return new TrialBalanceDto
            {
                Lines = lines,
                TotalDebits = totalDebits,
                TotalCredits = totalCredits,
                IsBalanced = totalDebits == totalCredits
            };
        }

        // Projects accounts with their balance as a correlated subquery, keeping any
        // listing to a single statement. The decimal? cast is load-bearing: SQL SUM
        // over no rows is NULL, so an account with no entries would otherwise fail to
        // materialise instead of reading 0.
        private IQueryable<AccountReadDto> WithBalance(IQueryable<Account> accounts) =>
            accounts.Select(account => new AccountReadDto
            {
                Id = account.Id,
                Name = account.Name,
                Type = account.Type,
                CreatedAt = account.CreatedAt,
                Balance = _appDbContext.Entries
                    .Where(entry => entry.AccountId == account.Id)
                    .Sum(entry => (decimal?)entry.Amount) ?? 0m
            });

        // Scopes a query to one owner. Every read in this service starts here, so
        // there is no path that can reach another user's accounts.
        private IQueryable<Account> OwnedBy(Guid ownerId) =>
            _appDbContext.Accounts.Where(account => account.OwnerId == ownerId);
    }
}
