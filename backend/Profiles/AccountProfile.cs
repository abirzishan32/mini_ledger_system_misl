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

            CreateMap<AccountWriteDto, Account>()
                .ForMember(account => account.Id, options => options.Ignore())
                .ForMember(account => account.OwnerId, options => options.Ignore())
                .ForMember(account => account.CreatedAt, options => options.Ignore())
                .ForMember(account => account.Entries, options => options.Ignore());
        }
    }
}
