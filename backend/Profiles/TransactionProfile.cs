using AutoMapper;
using backend.DTOs;
using backend.Entities;

namespace backend.Profiles
{
    public class TransactionProfile : Profile
    {
        // Mapping rules for the ProjectTo queries in TransactionService.
        // Entries are ordered by amount descending so the debit side reads first, the
        // order a transaction is written in on paper. Each entry carries its account's
        // name so a listing needs no second lookup per row.
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
