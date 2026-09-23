using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Entities;
using BCrypt.Net;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace backend.Controllers
{
    [ApiController] // This attribute indicates that this class is an API controller, which means it will handle HTTP requests and return responses in a web API context.
    [Route("api/[controller]")] // Define the common path for all endpoints in this controller
    public class AuthController(IConfiguration configuration) : ControllerBase
    {
        public static User user = new User(); 


        [HttpPost("register")]
        public ActionResult<User> Register(UserDto request)
        {
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

            user.Username = request.Username;
            user.PasswordHash = hashedPassword;

            return Created($"/api/auth/register", ApiResponse<UserDto>.SuccessResponse(user, 201, "User registered successfully"));

        }

        [HttpPost("login")]
        public ActionResult<User> Login(UserDto request)
        {
            if(user.Username != request.Username)
            {
                return NotFound(ApiResponse<UserDto>.ErrorResponse("User not found", 404));
            }

            if(!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(ApiResponse<UserDto>.ErrorResponse("Invalid password", 401));
            }

            string token = CreateToken(user);
            return Ok(ApiResponse<string>.SuccessResponse(token, 200, "Login successful"));
        }


        private string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Username)
            };


            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration.GetValue<string>("AppSettings:Token")!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new JwtSecurityToken(
                issuer: configuration.GetValue<string>("AppSettings:Issuer"),
                audience: configuration.GetValue<string>("AppSettings:Audience"),
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds
            );


            return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
        }
    }
}