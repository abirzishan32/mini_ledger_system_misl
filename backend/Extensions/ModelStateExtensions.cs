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
                // A cross-field rule names every field it concerns, so ModelState
                // holds one copy of its message per field. Distinct keeps the list
                // one line per broken rule, which is what the client renders.
                .Distinct()
                .ToList();
    }
}
