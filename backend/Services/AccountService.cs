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
            return await OwnedBy(ownerId)
                .OrderBy(account => account.Type)
                .ThenBy(account => account.Name)
                .ProjectTo<AccountReadDto>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

        public async Task<AccountReadDto?> GetAccount(Guid ownerId, Guid accountId)
        {
            return await OwnedBy(ownerId)
                .Where(account => account.Id == accountId)
                .ProjectTo<AccountReadDto>(_mapper.ConfigurationProvider)
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
                // The unique index on (OwnerId, Name) decides this, not a pre-insert
                // check, which two concurrent requests can both pass.
                return null;
            }

            // A freshly created account has no entries, so the balance is zero; going
            // back to the database to prove that would be a wasted round trip.
            return _mapper.Map<AccountReadDto>(account);
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

       
        private IQueryable<Account> OwnedBy(Guid ownerId) =>
            _appDbContext.Accounts.Where(account => account.OwnerId == ownerId);
    }
}
