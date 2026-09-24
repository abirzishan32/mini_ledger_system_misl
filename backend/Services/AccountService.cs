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

        public async Task<IReadOnlyList<AccountReadDto>> GetAccounts(Guid ownerId)
        {
            return await WithBalance(OwnedBy(ownerId)
                    .OrderBy(account => account.Type)
                    .ThenBy(account => account.Name))
                .ToListAsync();
        }

        public async Task<AccountReadDto?> GetAccount(Guid ownerId, Guid accountId)
        {
            return await WithBalance(OwnedBy(ownerId).Where(account => account.Id == accountId))
                .FirstOrDefaultAsync();
        }

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


            // Built directly rather than mapped. A new account has no entries, so its
            // balance is zero by definition and re-reading it would be a wasted trip.
            return new AccountReadDto
            {
                Id = account.Id,
                Name = account.Name,
                Type = account.Type,
                CreatedAt = account.CreatedAt,
                Balance = 0m
            };
        }

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

       
        public async Task<IReadOnlyList<AccountLedgerEntryDto>?> GetAccountLedger(Guid ownerId, Guid accountId)
        {
            // Checked separately so "account has no entries" stays distinguishable
            // from "no such account": both would otherwise be an empty list.
            if (!await OwnedBy(ownerId).AnyAsync(account => account.Id == accountId))
            {
                return null;
            }

            // ponytail: loads the whole history. A running balance depends on every
            // earlier row, so paging this needs the opening balance fetched as a
            // separate SUM. Do that if accounts ever get large.
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

        public async Task<TrialBalanceDto> GetTrialBalance(Guid ownerId)
        {
            // Reuses the listing, which already computes every balance in one query.
            // A second aggregation here would be a second definition of "balance".
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

        /// <summary>
        /// Projects accounts with their balance as a correlated subquery, so the whole
        /// list costs one statement. Expressed here rather than as a mapping rule
        /// because Account does not own its entries: they belong to Transaction's
        /// aggregate, and a navigation collection would say otherwise.
        ///
        /// The cast to decimal? is load-bearing: SQL SUM over no rows is NULL, so an
        /// account with no entries would otherwise fail to materialise.
        /// </summary>
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

        private IQueryable<Account> OwnedBy(Guid ownerId) =>
            _appDbContext.Accounts.Where(account => account.OwnerId == ownerId);
    }
}
