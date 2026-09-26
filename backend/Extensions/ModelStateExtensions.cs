using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace backend.Extensions
{
    public static class ModelStateExtensions
    {

        // Flattens validation failures into the flat list ApiResponse carries.
        // Distinct matters: a cross-field rule names every field it concerns, so
        // ModelState holds one copy of its message per field. Called by
        // ValidateModelAttribute, which is the only place validation is reported.
        public static List<string> ToErrorMessages(this ModelStateDictionary modelState) =>
            modelState.Values
                .SelectMany(entry => entry.Errors)
                .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage)
                    ? "Invalid request body"
                    : error.ErrorMessage)
                .Distinct()
                .ToList();
    }
}
