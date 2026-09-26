namespace backend.Extensions
{
    public static class ConfigurationExtensions
    {
        // Reads a setting the application cannot run without, failing immediately and
        // by name instead of letting a null travel on and surface later as something
        // unrelated. Used by Program.cs and AuthService for the connection string,
        // JWT signing key, issuer and audience.
        public static string Require(this IConfiguration configuration, string key)
        {
            var value = configuration[key];

            return string.IsNullOrWhiteSpace(value)
                ? throw new InvalidOperationException(
                    $"Missing configuration value '{key}'. Set it with: dotnet user-secrets set \"{key}\" \"<value>\"")
                : value;
        }
    }
}
