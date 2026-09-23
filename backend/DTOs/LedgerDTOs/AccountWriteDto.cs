using System.ComponentModel.DataAnnotations;
using backend.Entities;

namespace backend.DTOs
{
    public class AccountWriteDto
    {
        private string _name = string.Empty;

        [Required(ErrorMessage = "Account name is required")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Account name must be between 1 and 100 characters")]
        public string Name
        {
            get => _name;
            set => _name = value?.Trim() ?? string.Empty;
        }

        [Required(ErrorMessage = "Account type is required")]
        public AccountType? Type { get; set; }
    }
}
