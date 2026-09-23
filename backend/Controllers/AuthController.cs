using System.Security.Claims;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController] // This attribute indicates that this class is an API controller, which means it will handle HTTP requests and return responses in a web API context.
    [Route("api/[controller]")] // Define the common path for all endpoints in this controller
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<UserReadDto>>> Register([FromBody] UserWriteDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<UserReadDto>.ErrorResponse("Validation failed", StatusCodes.Status400BadRequest, GetModelStateErrors()));
            }

            var user = await _authService.RegisterUser(request);
            if (user == null)
            {
                return Conflict(ApiResponse<UserReadDto>.ErrorResponse("Username or email is already registered", StatusCodes.Status409Conflict));
            }

            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponse<UserReadDto>.SuccessResponse(user, StatusCodes.Status201Created, "User registered successfully"));
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<TokenResponseDto>>> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<TokenResponseDto>.ErrorResponse("Validation failed", StatusCodes.Status400BadRequest, GetModelStateErrors()));
            }

            var response = await _authService.LoginUser(request);
            if (response == null)
            {
                // Same message for unknown user and wrong password: do not leak which usernames exist.
                return Unauthorized(ApiResponse<TokenResponseDto>.ErrorResponse("Invalid username or password", StatusCodes.Status401Unauthorized));
            }

            return Ok(ApiResponse<TokenResponseDto>.SuccessResponse(response, StatusCodes.Status200OK, "Login successful"));
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<ApiResponse<TokenResponseDto>>> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<TokenResponseDto>.ErrorResponse("Validation failed", StatusCodes.Status400BadRequest, GetModelStateErrors()));
            }

            var result = await _authService.RefreshToken(request);
            if (result == null)
            {
                return Unauthorized(ApiResponse<TokenResponseDto>.ErrorResponse("Invalid or expired refresh token", StatusCodes.Status401Unauthorized));
            }

            return Ok(ApiResponse<TokenResponseDto>.SuccessResponse(result, StatusCodes.Status200OK, "Token refreshed successfully"));
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<string>>> Logout()
        {
            // The access token already proved who the caller is, so nothing is read
            // from the body: a caller can only ever revoke their own session.
            if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            {
                return Unauthorized(ApiResponse<string>.ErrorResponse("Invalid access token", StatusCodes.Status401Unauthorized));
            }

            await _authService.Logout(userId);

            return Ok(ApiResponse<string>.SuccessResponse(string.Empty, StatusCodes.Status200OK, "Signed out successfully"));
        }

        [HttpGet("me")]
        [Authorize]
        public ActionResult<ApiResponse<string>> Me()
        {
            var username = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
            return Ok(ApiResponse<string>.SuccessResponse(username, StatusCodes.Status200OK, "You are authenticated"));
        }

        private List<string> GetModelStateErrors() =>
            ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Invalid request body" : e.ErrorMessage)
                .ToList();
    }
}
