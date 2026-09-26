using backend.DTOs;

namespace backend.Interfaces
{
    // Contract for AuthService, registered scoped in Program.cs and consumed by
    // AuthController. Every method returns null on failure rather than throwing, so
    // the controller decides the status code and the wording the caller sees.
    public interface IAuthService
    {
        Task<UserReadDto?> RegisterUser(UserWriteDto request);
        Task<TokenResponseDto?> LoginUser(LoginRequestDto request);
        Task<TokenResponseDto?> RefreshToken(RefreshTokenRequestDto request);
        Task Logout(Guid userId);
    }
}
