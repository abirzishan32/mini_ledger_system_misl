using backend.Controllers;
using backend.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Filters
{
    public class ValidateModelAttribute : ActionFilterAttribute
    {
        // Rejects an invalid request before the action runs, so no controller repeats
        // the check and none can forget it. Uses ModelStateExtensions.ToErrorMessages
        // and returns the same ApiResponse shape as every other endpoint. Registered
        // globally in Program.cs, which also suppresses the framework's own version
        // because that one answers with a ProblemDetails document instead.
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (context.ModelState.IsValid)
            {
                return;
            }

            context.Result = new BadRequestObjectResult(
                ApiResponse<string>.ErrorResponse(
                    "Validation failed",
                    StatusCodes.Status400BadRequest,
                    context.ModelState.ToErrorMessages()));
        }
    }
}
