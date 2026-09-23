using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class RefreshTokenRequestDto
    {
        // Nullable so [Required] actually fires: on a non-nullable Guid a missing
        // field binds to Guid.Empty and Required can never fail.
        [Required(ErrorMessage = "UserId is required")]
        public Guid? UserId { get; set; }

        [Required(ErrorMessage = "RefreshToken is required")]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
