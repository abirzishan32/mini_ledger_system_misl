using System.Security.Claims;

namespace backend.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        /// <summary>
        /// The authenticated user's id, from the token's subject claim.
        ///
        /// Only valid behind [Authorize]: the claim is present because the bearer
        /// handler validated the token, and parses because this application minted
        /// it from a Guid. A failure here means a token this server signed is
        /// malformed, which is a fault rather than a bad request.
        /// </summary>
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
