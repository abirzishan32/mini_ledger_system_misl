using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class UserWriteDto
    {
        private string _username = string.Empty;
        private string _email = string.Empty;

        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        [RegularExpression("^[a-zA-Z0-9_.-]+$", ErrorMessage = "Username may only contain letters, digits, underscore, dot or hyphen")]
        public string Username
        {
            get => _username;
            set => _username = value?.Trim() ?? string.Empty;
        }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Email must be a valid email address")]

        [StringLength(254, ErrorMessage = "Email must be 254 characters or fewer")]
        public string Email
        {
            get => _email;
            set => _email = value?.Trim() ?? string.Empty;
        }

        [Required(ErrorMessage = "Password is required")]
        [StringLength(72, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 72 characters")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password confirmation is required")]
        [Compare(nameof(Password), ErrorMessage = "The two passwords do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
