using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Extensions;
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

        // Resolves the JWT signing key, issuer and audience through
        // ConfigurationExtensions.Require, so a missing secret stops the app at
        // startup rather than silently making every token it issues invalid.
        public AuthService(AppDbContext appDbContext, IMapper mapper, IConfiguration configuration)
        {
            _appDbContext = appDbContext;
            _mapper = mapper;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration.Require("AppSettings:Token")));
            _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);
            _issuer = configuration.Require("AppSettings:Issuer");
            _audience = configuration.Require("AppSettings:Audience");
        }

        // Creates a user, storing only a BCrypt hash of the password.
        // The AnyAsync check gives a clean conflict, but the unique indexes on
        // Username and Email are what actually stop two simultaneous signups: a
        // 23505 is caught and returned as null. Maps out via UserProfile, which
        // drops the hash and refresh token fields.
        public async Task<UserReadDto?> RegisterUser(UserWriteDto request)
        {
            // Both comparisons are case-insensitive because the columns are citext.
            if (await _appDbContext.Users.AnyAsync(u =>
                    u.Username == request.Username || u.Email == request.Email))
            {
                return null;
            }

            var newUser = new User
            {
                Username = request.Username,
                Email = request.Email,
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
                return null;
            }

            return _mapper.Map<UserReadDto>(newUser);
        }

        // Verifies a password and issues tokens through IssueTokens.
        // When the username does not exist it still runs a full BCrypt comparison,
        // against a hash nothing can match, so a wrong username costs the same time
        // as a wrong password and the two cannot be told apart by timing.
        public async Task<TokenResponseDto?> LoginUser(LoginRequestDto request)
        {
            var user = await _appDbContext.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

            var passwordMatches = BCrypt.Net.BCrypt.Verify(request.Password, user?.PasswordHash ?? UnmatchableHash);

            if (user == null || !passwordMatches)
            {
                return null;
            }

            return await IssueTokens(user);
        }

        // Trades a refresh token for a fresh pair after ValidateRefreshToken checks it
        // against the stored hash and expiry. Returns null for any failure, so the
        // caller cannot learn which of the checks rejected it.
        public async Task<TokenResponseDto?> RefreshToken(RefreshTokenRequestDto request)
        {
            var user = await ValidateRefreshToken(request.UserId!.Value, request.RefreshToken);
            if (user == null)
            {
                return null;
            }

            return await IssueTokens(user);
        }

        
        // Clears the stored refresh token hash and expiry for the user.
        // This is what makes signing out real: renewal compares an incoming token
        // against this value, so with it gone every copy of that token is dead, not
        // just the one in the caller's browser.
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

        // Mints an access token via CreateToken and a refresh token, storing only a
        // hash of the latter on the user row. Rotates the refresh token on every
        // issue, so a used one cannot be replayed once the real user renews.
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

        // Checks a refresh token against the hash and expiry stored on the user.
        // FixedTimeEquals rather than an ordinary comparison, which stops at the first
        // differing byte and would let the correct value be found one byte at a time
        // by measuring how long each attempt takes.
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

        // 32 bytes from the cryptographic RNG, not the ordinary one, whose output is
        // predictable from its seed. This value alone lets a holder obtain new access
        // tokens for seven days, so it has to be genuinely unguessable.
        private static string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        }


        // SHA256 rather than BCrypt, unlike passwords. A refresh token is 256 random
        // bits with no likely values to try, so a deliberately slow hash would buy
        // nothing and would cost time on every renewal.
        private static string HashRefreshToken(string refreshToken)
        {
            return Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
        }

        // Builds the signed access token AuthController hands back. Carries the user
        // id, username and a unique token id, and expires after AccessTokenLifetime.
        // Program.cs verifies the signature, issuer, audience and expiry on the way
        // back in, and ClaimsPrincipalExtensions.GetUserId reads the subject out.
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
    }
}
