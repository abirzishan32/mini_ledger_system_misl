using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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

        // Create constructor for success response
        private ApiResponse(bool success, string message, T? data, int statusCode, List<String>? errors)
        {
            Success = success;
            Message = message;
            Data = data;
            StatusCode = statusCode;
            Errors = errors;
            TimeStamp = DateTime.UtcNow;
        }

        // static method for creating successful response
        public static ApiResponse<T> SuccessResponse(T data, int statusCode, string message = "")
        {
            return new ApiResponse<T>(true, message, data, statusCode, null);
        }

        // static method for creating an error/failure response
        public static ApiResponse<T> ErrorResponse(string message, int statusCode, List<String>? errors = null)
        {
            return new ApiResponse<T>(false, message, default, statusCode, errors);
        }
    }
}