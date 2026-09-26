namespace backend.Controllers
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public String Message { get; set; } = string.Empty;
        public T? Data { get; set; } // T means generic


        public List<String>? Errors { get; set; }


        public int StatusCode { get; set; }
        public DateTime TimeStamp { get; set; }

        // Shared by both factories below and stamps TimeStamp, so every response
        // carries when it was built. Private, so the two named factories are the
        // only way to construct one and the shape stays consistent.
        private ApiResponse(bool success, string message, T? data, int statusCode, List<String>? errors)
        {
            Success = success;
            Message = message;
            Data = data;
            StatusCode = statusCode;
            Errors = errors;
            TimeStamp = DateTime.UtcNow;
        }

        // Builds the success envelope every controller returns. Errors is left null,
        // so a caller can branch on Success alone without inspecting the rest.
        public static ApiResponse<T> SuccessResponse(T data, int statusCode, string message = "")
        {
            return new ApiResponse<T>(true, message, data, statusCode, null);
        }

        // Builds the failure envelope. Used by the controllers, by
        // ValidateModelAttribute for validation errors, and by the exception handler
        // in Program.cs, so an unhandled fault looks like every other response.
        public static ApiResponse<T> ErrorResponse(string message, int statusCode, List<String>? errors = null)
        {
            return new ApiResponse<T>(false, message, default, statusCode, errors);
        }
    }
}