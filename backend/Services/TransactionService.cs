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

        public async Task<PaginatedResult<TransactionReadDto>> GetTransactions(Guid ownerId, int page, int pageSize)
        {
            var owned = OwnedBy(ownerId);

            // Counted before the page is taken, so the total describes the whole result
            // rather than the slice. Both statements run against the same owner filter,
            // so a client can never learn how many rows exist beyond its own.
            var totalCount = await owned.CountAsync();

            var data = await owned
                .OrderByDescending(transaction => transaction.OccurredAt)
                .ThenByDescending(transaction => transaction.CreatedAt)
                .Skip((page - 1) * pageSize)
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

        public async Task<TransactionReadDto?> GetTransaction(Guid ownerId, Guid transactionId)
        {
            return await OwnedBy(ownerId)
                .Where(transaction => transaction.Id == transactionId)
                .ProjectTo<TransactionReadDto>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync();
        }

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

        private Task<TransactionReadDto?> FindByIdempotencyKey(Guid ownerId, string key) =>
            OwnedBy(ownerId)
                .Where(transaction => transaction.IdempotencyKey == key)
                .ProjectTo<TransactionReadDto>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync();
        private static DateTime AsUtc(DateTime value) => value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };


        private IQueryable<Transaction> OwnedBy(Guid ownerId) =>
            _appDbContext.Transactions.Where(transaction => transaction.OwnerId == ownerId);
    }
}
