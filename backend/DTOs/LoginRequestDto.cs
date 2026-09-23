using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class LoginRequestDto
    {
        private string _username = string.Empty;

        [Required(ErrorMessage = "Username is required")]
        public string Username
        {
            get => _username;
            set => _username = value?.Trim() ?? string.Empty;
        }

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;
    }
}
