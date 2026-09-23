using AutoMapper;
using backend.DTOs;
using backend.Entities;

namespace backend.Profiles
{
    public class AccountProfile : Profile
    {
        public AccountProfile()
        {
            CreateMap<Account, AccountReadDto>()
                .ForMember(dto => dto.Balance,
                    options => options.MapFrom(account =>
                        account.Entries.Sum(entry => (decimal?)entry.Amount) ?? 0m));

            // The running balance is deliberately absent: it depends on the position
            // of a row within an ordered sequence, which a per-row mapping cannot see.
            // It is filled once the ordered page has materialised.
            CreateMap<Entry, AccountLedgerEntryDto>()
                .ForMember(dto => dto.OccurredAt,
                    options => options.MapFrom(entry => entry.Transaction.OccurredAt))
                .ForMember(dto => dto.Description,
                    options => options.MapFrom(entry => entry.Transaction.Description))
                .ForMember(dto => dto.Reference,
                    options => options.MapFrom(entry => entry.Transaction.Reference))
                .ForMember(dto => dto.RunningBalance, options => options.Ignore());

            CreateMap<AccountWriteDto, Account>()
                .ForMember(account => account.Id, options => options.Ignore())
                .ForMember(account => account.OwnerId, options => options.Ignore())
                .ForMember(account => account.CreatedAt, options => options.Ignore())
                .ForMember(account => account.Entries, options => options.Ignore());
        }
    }
}
