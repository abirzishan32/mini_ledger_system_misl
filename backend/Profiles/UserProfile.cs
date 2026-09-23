using AutoMapper;
using backend.DTOs;
using backend.Entities;

namespace backend.Profiles
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            // Only the outbound projection: it is what keeps PasswordHash and
            // RefreshTokenHash off the wire. Building a User from UserWriteDto is one
            // assignment plus a hash, which the service does directly.
            CreateMap<User, UserReadDto>();
        }
    }
}
