namespace backend.Extensions
{
    public static class ConfigurationExtensions
    {
        /// <summary>
        /// Reads a setting the application cannot run without, failing immediately and
        /// by name rather than letting a null travel onward and surface later as
        /// something unrelated, such as every token being rejected.
        /// </summary>
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
