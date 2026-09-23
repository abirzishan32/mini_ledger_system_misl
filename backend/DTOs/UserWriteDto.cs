using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    // Inbound DTO: what a client is allowed to send for register/login.
    public class UserWriteDto
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        [RegularExpression("^[a-zA-Z0-9_.-]+$", ErrorMessage = "Username may only contain letters, digits, underscore, dot or hyphen")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        // 72, not 100: BCrypt silently ignores everything past 72 bytes, so a longer
        // limit would accept passwords whose tail does nothing.
        [StringLength(72, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 72 characters")]
        public string Password { get; set; } = string.Empty;
    }
}
