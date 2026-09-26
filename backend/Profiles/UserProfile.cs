using AutoMapper;
using backend.DTOs;
using backend.Entities;

namespace backend.Profiles
{
    public class UserProfile : Profile
    {
        // Maps User onto UserReadDto for AuthService.RegisterUser. The DTO has no
        // PasswordHash or refresh token members, so those cannot leave by this route.
        public UserProfile()
        {
            CreateMap<User, UserReadDto>();
        }
    }
}
