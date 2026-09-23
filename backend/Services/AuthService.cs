using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace backend.Services
{
    public class AuthService : IAuthService
    {
        private static readonly JsonWebTokenHandler TokenHandler = new();

        private static readonly string UnmatchableHash =
            BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString());

        private static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(15);
        private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);

        private readonly AppDbContext _appDbContext;
        private readonly IMapper _mapper;
        private readonly SigningCredentials _signingCredentials;
        private readonly string _issuer;
        private readonly string _audience;

        public AuthService(AppDbContext appDbContext, IMapper mapper, IConfiguration configuration)
        {
            _appDbContext = appDbContext;
            _mapper = mapper;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Required(configuration, "AppSettings:Token")));
            _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);
            _issuer = Required(configuration, "AppSettings:Issuer");
            _audience = Required(configuration, "AppSettings:Audience");
        }

        public async Task<UserReadDto?> RegisterUser(UserWriteDto request)
        {
            if (await _appDbContext.Users.AnyAsync(u => u.Username == request.Username))
            {
                return null;
            }

            var newUser = new User
            {
                Username = request.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                CreatedAt = DateTime.UtcNow
            };

            await _appDbContext.Users.AddAsync(newUser);

            try
            {
                await _appDbContext.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
            {
                // Two concurrent registrations passed the AnyAsync check above; the
                // unique index on Username is what actually decides the winner.
                return null;
            }

            return _mapper.Map<UserReadDto>(newUser);
        }

        public async Task<TokenResponseDto?> LoginUser(UserWriteDto request)
        {
            var user = await _appDbContext.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

            var passwordMatches = BCrypt.Net.BCrypt.Verify(request.Password, user?.PasswordHash ?? UnmatchableHash);

            if (user == null || !passwordMatches)
            {
                return null;
            }

            return await IssueTokens(user);
        }

        public async Task<TokenResponseDto?> RefreshToken(RefreshTokenRequestDto request)
        {
            var user = await ValidateRefreshToken(request.UserId!.Value, request.RefreshToken);
            if (user == null)
            {
                return null;
            }

            return await IssueTokens(user);
        }

        
        public async Task Logout(Guid userId)
        {
            var user = await _appDbContext.Users.FindAsync(userId);

            if (user == null)
            {
                return;
            }

            user.RefreshTokenHash = null;
            user.RefreshTokenExpiryTime = null;
            await _appDbContext.SaveChangesAsync();
        }

        // Rotates the refresh token on every issue, so a used token cannot be replayed.
        private async Task<TokenResponseDto> IssueTokens(User user)
        {
            var accessToken = CreateToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshTokenHash = HashRefreshToken(refreshToken);
            user.RefreshTokenExpiryTime = DateTime.UtcNow.Add(RefreshTokenLifetime);
            await _appDbContext.SaveChangesAsync();

            // The raw token leaves here once and is never stored.
            return new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }

        private async Task<User?> ValidateRefreshToken(Guid userId, string refreshToken)
        {
            var user = await _appDbContext.Users.FindAsync(userId);
            if (user == null
                || user.RefreshTokenHash == null
                || user.RefreshTokenExpiryTime == null
                || user.RefreshTokenExpiryTime <= DateTime.UtcNow
                || !CryptographicOperations.FixedTimeEquals(
                        Encoding.UTF8.GetBytes(user.RefreshTokenHash),
                        Encoding.UTF8.GetBytes(HashRefreshToken(refreshToken))))
            {
                return null;
            }

            return user;
        }

        private static string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        }


        private static string HashRefreshToken(string refreshToken)
        {
            return Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
        }

        private string CreateToken(User user)
        {
            var descriptor = new SecurityTokenDescriptor
            {
                Issuer = _issuer,
                Audience = _audience,
                Expires = DateTime.UtcNow.Add(AccessTokenLifetime),
                SigningCredentials = _signingCredentials,
                Claims = new Dictionary<string, object>
                {
                    [JwtRegisteredClaimNames.Sub] = user.Id.ToString(),
                    [JwtRegisteredClaimNames.UniqueName] = user.Username,
                    [JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString()
                }
            };

            return TokenHandler.CreateToken(descriptor);
        }

        private static string Required(IConfiguration configuration, string key)
        {
            var value = configuration[key];
            return string.IsNullOrWhiteSpace(value)
                ? throw new InvalidOperationException($"Missing configuration value '{key}'.")
                : value;
        }
    }
}
