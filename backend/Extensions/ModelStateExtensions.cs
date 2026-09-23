using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace backend.Extensions
{
    public static class ModelStateExtensions
    {
        /// <summary>
        /// Flattens validation failures into the list ApiResponse carries. Each
        /// message names its own field, because the client renders a flat list and
        /// restates none of the rules itself.
        /// </summary>
        public static List<string> ToErrorMessages(this ModelStateDictionary modelState) =>
            modelState.Values
                .SelectMany(entry => entry.Errors)
                .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage)
                    ? "Invalid request body"
                    : error.ErrorMessage)
                .ToList();
    }
}
