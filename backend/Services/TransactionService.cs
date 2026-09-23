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
    public class TransactionService : ITransactionService
    {
        private readonly AppDbContext _appDbContext;
        private readonly IMapper _mapper;

        public TransactionService(AppDbContext appDbContext, IMapper mapper)
        {
            _appDbContext = appDbContext;
            _mapper = mapper;
        }

        public async Task<IReadOnlyList<TransactionReadDto>> GetTransactions(Guid ownerId, int page, int pageSize)
        {
            return await OwnedBy(ownerId)
                .OrderByDescending(transaction => transaction.OccurredAt)
                .ThenByDescending(transaction => transaction.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<TransactionReadDto>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

        public async Task<TransactionReadDto?> GetTransaction(Guid ownerId, Guid transactionId)
        {
            return await OwnedBy(ownerId)
                .Where(transaction => transaction.Id == transactionId)
                .ProjectTo<TransactionReadDto>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync();
        }

        public async Task<TransactionReadDto?> CreateTransaction(
            Guid ownerId, TransactionWriteDto request, string? idempotencyKey)
        {
            var key = string.IsNullOrWhiteSpace(idempotencyKey) ? null : idempotencyKey.Trim();

            if (key != null && await FindByIdempotencyKey(ownerId, key) is { } alreadyPosted)
            {
                return alreadyPosted;
            }

            var accountIds = new[] { request.DebitAccountId!.Value, request.CreditAccountId!.Value };

            var found = await _appDbContext.Accounts
                .Where(account => account.OwnerId == ownerId && accountIds.Contains(account.Id))
                .CountAsync();

            if (found != accountIds.Length)
            {
                return null;
            }

            var amount = request.Amount!.Value;

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
                    new Entry { AccountId = request.DebitAccountId.Value, Amount = amount },
                    new Entry { AccountId = request.CreditAccountId.Value, Amount = -amount }
                }
            };

            _appDbContext.Transactions.Add(transaction);

            try
            {
                await _appDbContext.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (key != null && ex.InnerException is PostgresException { SqlState: "23505" })
            {
                return await FindByIdempotencyKey(ownerId, key);
            }

            return await GetTransaction(ownerId, transaction.Id);
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
