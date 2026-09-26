using backend.Controllers;
using backend.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Filters
{
    /// <summary>
    /// Rejects an invalid request before the action runs, in the same ApiResponse
    /// shape every endpoint returns.
    ///
    /// SuppressModelStateInvalidFilter turns off the framework's own version,
    /// which answers with a ProblemDetails document instead and would be the one
    /// response in the API that did not match the rest. This restores that
    /// behaviour once, rather than each action repeating the same four lines and
    /// a new one being able to forget them.
    ///
    /// ApiResponse&lt;string&gt; rather than the action's own type: the two differ
    /// only in a Data that is null either way, so the JSON is identical.
    /// </summary>
    public class ValidateModelAttribute : ActionFilterAttribute
    {
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
