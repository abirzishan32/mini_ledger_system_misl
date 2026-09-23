using AutoMapper;
using backend.DTOs;
using backend.Entities;

namespace backend.Profiles
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<User, UserReadDto>();
        }
    }
}
