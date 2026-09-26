using System.Security.Claims;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers
{
    [ApiController] // This attribute indicates that this class is an API controller, which means it will handle HTTP requests and return responses in a web API context.
    [Route("api/[controller]")] // Define the common path for all endpoints in this controller
    public class AuthController : ControllerBase
    {
        public const string BcryptPolicy = "bcrypt";

        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // Creates a login and returns the new user without any secret fields.
        // AuthService.RegisterUser returns null when the username or email is taken.
        // Rate limited because registration hashes a password, which is deliberately
        // slow and would otherwise let a flood of requests exhaust the server.
        [HttpPost("register")]
        [EnableRateLimiting(BcryptPolicy)]
        public async Task<ActionResult<ApiResponse<UserReadDto>>> Register([FromBody] UserWriteDto request)
        {
            var user = await _authService.RegisterUser(request);
            if (user == null)
            {
                return Conflict(ApiResponse<UserReadDto>.ErrorResponse("Username or email is already registered", StatusCodes.Status409Conflict));
            }

            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponse<UserReadDto>.SuccessResponse(user, StatusCodes.Status201Created, "User registered successfully"));
        }

        // Verifies credentials and returns an access and refresh token pair.
        // AuthService.LoginUser returns null for both an unknown user and a wrong
        // password, and one message covers both so the reply reveals neither.
        [HttpPost("login")]
        [EnableRateLimiting(BcryptPolicy)]
        public async Task<ActionResult<ApiResponse<TokenResponseDto>>> Login([FromBody] LoginRequestDto request)
        {
            var response = await _authService.LoginUser(request);
            if (response == null)
            {
                // Same message for unknown user and wrong password: do not leak which usernames exist.
                return Unauthorized(ApiResponse<TokenResponseDto>.ErrorResponse("Invalid username or password", StatusCodes.Status401Unauthorized));
            }

            return Ok(ApiResponse<TokenResponseDto>.SuccessResponse(response, StatusCodes.Status200OK, "Login successful"));
        }

        // Trades a refresh token for a fresh pair. AuthService.RefreshToken checks it
        // against the hash stored on the user and its expiry; null means the token is
        // spent, expired, or was revoked by signing out.
        [HttpPost("refresh-token")]
        public async Task<ActionResult<ApiResponse<TokenResponseDto>>> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            var result = await _authService.RefreshToken(request);
            if (result == null)
            {
                return Unauthorized(ApiResponse<TokenResponseDto>.ErrorResponse("Invalid or expired refresh token", StatusCodes.Status401Unauthorized));
            }

            return Ok(ApiResponse<TokenResponseDto>.SuccessResponse(result, StatusCodes.Status200OK, "Token refreshed successfully"));
        }

        // Ends the session. Reads the user id from the verified token, then
        // AuthService.Logout clears the stored refresh token hash, which is what
        // stops any copy of that token being used to renew.
        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<string>>> Logout()
        {
            if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            {
                return Unauthorized(ApiResponse<string>.ErrorResponse("Invalid access token", StatusCodes.Status401Unauthorized));
            }

            await _authService.Logout(userId);

            return Ok(ApiResponse<string>.SuccessResponse(string.Empty, StatusCodes.Status200OK, "Signed out successfully"));
        }

        // Returns the signed-in username, read from the token's name claim.
        // Nothing is fetched from the database: reaching this endpoint at all means
        // the JWT middleware in Program.cs already validated the token.
        [HttpGet("me")]
        [Authorize]
        public ActionResult<ApiResponse<string>> Me()
        {
            var username = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
            return Ok(ApiResponse<string>.SuccessResponse(username, StatusCodes.Status200OK, "You are authenticated"));
        }
    }
}
