using System.Security.Claims;

namespace backend.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        // Reads the authenticated user's id from the token's subject claim.
        // Only valid behind [Authorize], where the JWT middleware has already
        // validated the token. Throws rather than returning a bad request: a subject
        // that will not parse means this server signed a malformed token.
        public static Guid GetUserId(this ClaimsPrincipal principal)
        {
            var subject = principal.FindFirstValue(ClaimTypes.NameIdentifier);

            return Guid.TryParse(subject, out var userId)
                ? userId
                : throw new InvalidOperationException(
                    "The authenticated principal carries no usable subject claim.");
        }
    }
}
