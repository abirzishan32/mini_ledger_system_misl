using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    /// <summary>
    /// The registration contract, and the single source of truth for what a valid
    /// new account looks like. Every message here is surfaced verbatim by the
    /// frontend, so each one names the field it is about: the client renders a flat
    /// list and does not restate any of these rules itself.
    /// </summary>
    public class UserWriteDto
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        [RegularExpression("^[a-zA-Z0-9_.-]+$", ErrorMessage = "Username may only contain letters, digits, underscore, dot or hyphen")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Email must be a valid email address")]
        // 254 is the longest address deliverable in practice under RFC 5321.
        [StringLength(254, ErrorMessage = "Email must be 254 characters or fewer")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        // 72, not 100: BCrypt silently ignores everything past 72 bytes, so a longer
        // limit would accept passwords whose tail does nothing.
        [StringLength(72, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 72 characters")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password confirmation is required")]
        [Compare(nameof(Password), ErrorMessage = "The two passwords do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
