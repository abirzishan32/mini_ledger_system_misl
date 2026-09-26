using AutoMapper;
using backend.DTOs;
using backend.Entities;

namespace backend.Profiles
{
    public class AccountProfile : Profile
    {
        // Mapping rules AccountService relies on.
        // Entry to statement line pulls date, description and reference from the
        // parent Transaction, and leaves RunningBalance alone: it depends on a row's
        // position in an ordered sequence, which a per-row mapping cannot see, so
        // GetAccountLedger fills it afterwards. AccountWriteDto to Account ignores
        // the fields the server owns, so a client cannot set an id or an owner.
        public AccountProfile()
        {

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
                .ForMember(account => account.CreatedAt, options => options.Ignore());
        }
    }
}
