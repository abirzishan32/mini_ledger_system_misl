using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class RefreshTokenRequestDto
    {
        [Required(ErrorMessage = "UserId is required")]
        public Guid? UserId { get; set; }

        [Required(ErrorMessage = "RefreshToken is required")]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
