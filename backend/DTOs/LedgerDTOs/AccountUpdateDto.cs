using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class AccountUpdateDto
    {
        private string _name = string.Empty;

        [Required(ErrorMessage = "Account name is required")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Account name must be between 1 and 100 characters")]
        public string Name
        {
            get => _name;
            set => _name = value?.Trim() ?? string.Empty;
        }
    }
}
