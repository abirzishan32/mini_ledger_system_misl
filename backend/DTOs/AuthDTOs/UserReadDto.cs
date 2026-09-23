namespace backend.DTOs
{
    // Outbound DTO: never carries PasswordHash or the refresh token.
    public class UserReadDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
