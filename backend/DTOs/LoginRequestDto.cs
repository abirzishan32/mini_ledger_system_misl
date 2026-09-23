using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    /// <summary>
    /// Deliberately separate from UserWriteDto, and deliberately thinner.
    ///
    /// Sign-in must not re-apply the registration rules. If those rules tighten
    /// later, an existing account whose password or username no longer satisfies
    /// them must still be able to sign in; validating length or character set here
    /// would lock those users out of their own accounts. Only presence is required.
    /// </summary>
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Username is required")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;
    }
}
