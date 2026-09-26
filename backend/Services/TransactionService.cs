using System.Globalization;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using backend.Controllers;
using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly AppDbContext _appDbContext;
        private readonly IMapper _mapper;

        public TransactionService(AppDbContext appDbContext, IMapper mapper)
        {
            _appDbContext = appDbContext;
            _mapper = mapper;
        }

        // Returns one page of the owner's transactions, newest first.
        // Counts before slicing so the total describes the whole result, not the page.
        // The offset is computed as long because (page - 1) * pageSize overflows int
        // inside the range the controller advertises, and a negative OFFSET is
        // rejected by PostgreSQL; a page past the end answers empty without querying.
        public async Task<PaginatedResult<TransactionReadDto>> GetTransactions(Guid ownerId, int page, int pageSize)
        {
            var owned = OwnedBy(ownerId);

            var totalCount = await owned.CountAsync();

            var skip = (long)(page - 1) * pageSize;

            if (skip >= totalCount)
            {
                return new PaginatedResult<TransactionReadDto>
                {
                    TotalCount = totalCount,
                    PageNumber = page,
                    PageSize = pageSize
                };
            }

            var data = await owned
                .OrderByDescending(transaction => transaction.OccurredAt)
                .ThenByDescending(transaction => transaction.CreatedAt)
                .Skip((int)skip)
                .Take(pageSize)
                .ProjectTo<TransactionReadDto>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return new PaginatedResult<TransactionReadDto>
            {
                Data = data,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };
        }

        // Fetches one transaction with both its entries, scoped to the owner.
        // Projected by AutoMapper's TransactionProfile. Also called at the end of
        // CreateTransaction to read back what was actually stored.
        public async Task<TransactionReadDto?> GetTransaction(Guid ownerId, Guid transactionId)
        {
            return await OwnedBy(ownerId)
                .Where(transaction => transaction.Id == transactionId)
                .ProjectTo<TransactionReadDto>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync();
        }

        // Posts one double-entry transaction, or refuses it with a reason.
        // Order matters: settle the idempotency key first, then open a database
        // transaction, confirm both accounts belong to the caller, and when spending
        // from an Asset lock that account's row before reading its balance. The
        // transaction and both entries are then written in one SaveChanges, so the
        // ledger can never hold a debit without its credit.
        // Returns the transaction, or an error message for the caller to show.
        public async Task<(TransactionReadDto? Transaction, string? Error)> CreateTransaction(
            Guid ownerId, TransactionWriteDto request, string? idempotencyKey)
        {
            var key = string.IsNullOrWhiteSpace(idempotencyKey) ? null : idempotencyKey.Trim();

            // Settled before any lock is taken: a replay should cost nothing and
            // must not queue behind a live posting for the same account.
            if (key != null && await FindByIdempotencyKey(ownerId, key) is { } alreadyPosted)
            {
                return (alreadyPosted, null);
            }

            var debitAccountId = request.DebitAccountId!.Value;
            var creditAccountId = request.CreditAccountId!.Value;
            var amount = request.Amount!.Value;

            
            await using var dbTransaction = await _appDbContext.Database.BeginTransactionAsync();

            var accounts = await _appDbContext.Accounts
                .Where(account => account.OwnerId == ownerId
                    && (account.Id == debitAccountId || account.Id == creditAccountId))
                .Select(account => new { account.Id, account.Type })
                .ToListAsync();

            if (accounts.Count != 2)
            {
                return (null, "Both accounts must exist and belong to you");
            }

           
            if (accounts.Single(account => account.Id == creditAccountId).Type == AccountType.Asset)
            {
               
                // NO KEY UPDATE, not plain FOR UPDATE. Inserting an Entry takes an
                // implicit FOR KEY SHARE lock on the account its foreign key points
                // at, so every posting touches both account rows. FOR UPDATE
                // conflicts with FOR KEY SHARE, which deadlocked A->B against B->A.
                // NO KEY UPDATE still conflicts with itself, so two postings out of
                // one account queue as intended, but lets the other posting's entry
                // inserts through.
                await _appDbContext.Database.ExecuteSqlAsync(
                    $@"SELECT 1 FROM ""Accounts"" WHERE ""Id"" = {creditAccountId} FOR NO KEY UPDATE");

                var available = await _appDbContext.Entries
                    .Where(entry => entry.AccountId == creditAccountId)
                    .SumAsync(entry => (decimal?)entry.Amount) ?? 0m;

                if (available < amount)
                {
                    return (null, $"Insufficient funds: {available.ToString("N2", CultureInfo.InvariantCulture)} available, "
                        + $"{amount.ToString("N2", CultureInfo.InvariantCulture)} requested");
                }
            }

            var transaction = new Transaction
            {
                OwnerId = ownerId,
                OccurredAt = AsUtc(request.OccurredAt!.Value),
                CreatedAt = DateTime.UtcNow,
                Description = request.Description,
                Reference = request.Reference,
                IdempotencyKey = key,
                Entries =
                {
                    new Entry { AccountId = debitAccountId, Amount = amount },
                    new Entry { AccountId = creditAccountId, Amount = -amount }
                }
            };

            _appDbContext.Transactions.Add(transaction);

            try
            {
                await _appDbContext.SaveChangesAsync();
                await dbTransaction.CommitAsync();
            }
            catch (DbUpdateException ex) when (key != null && ex.InnerException is PostgresException { SqlState: "23505" })
            {
                // Two requests carrying one key raced past the pre-check. The unique
                // index settled it; roll back before querying, because a failed
                // statement leaves the transaction unusable.
                await dbTransaction.RollbackAsync();
                return (await FindByIdempotencyKey(ownerId, key), null);
            }

            return (await GetTransaction(ownerId, transaction.Id), null);
        }

        // Looks up a transaction already recorded under this key for this owner.
        // Used twice: as the cheap pre-check that settles an ordinary retry, and to
        // read back the winner's row after the unique index rejects a racing insert.
        private Task<TransactionReadDto?> FindByIdempotencyKey(Guid ownerId, string key) =>
            OwnedBy(ownerId)
                .Where(transaction => transaction.IdempotencyKey == key)
                .ProjectTo<TransactionReadDto>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync();
        // Normalises an incoming date to UTC before it is stored.
        // An unspecified kind is labelled UTC rather than converted, because the form
        // sends midnight UTC for a calendar day and shifting it would move the day.
        private static DateTime AsUtc(DateTime value) => value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };


        // Scopes a query to one owner. Every read in this service starts here, so
        // there is no path that can reach another user's transactions.
        private IQueryable<Transaction> OwnedBy(Guid ownerId) =>
            _appDbContext.Transactions.Where(transaction => transaction.OwnerId == ownerId);
    }
}
