using backend.DTOs;

namespace backend.Interfaces
{
    public interface IAuthService
    {
        Task<UserReadDto?> RegisterUser(UserWriteDto request);
        Task<TokenResponseDto?> LoginUser(UserWriteDto request);
        Task<TokenResponseDto?> RefreshToken(RefreshTokenRequestDto request);
        Task Logout(Guid userId);
    }
}
