using AutoMapper;
using backend.DTOs;
using backend.Entities;

namespace backend.Profiles
{
    public class TransactionProfile : Profile
    {
        public TransactionProfile()
        {
            CreateMap<Transaction, TransactionReadDto>()
                .ForMember(dto => dto.Entries,
                    options => options.MapFrom(transaction =>
                        transaction.Entries.OrderByDescending(entry => entry.Amount)));

            CreateMap<Entry, EntryReadDto>()
                .ForMember(dto => dto.AccountName,
                    options => options.MapFrom(entry => entry.Account.Name));
        }
    }
}
