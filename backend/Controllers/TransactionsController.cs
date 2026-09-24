using System.ComponentModel.DataAnnotations;
using backend.DTOs;
using backend.Extensions;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private const int DefaultPageSize = 50;
        private const int MaxPageSize = 100;

        private readonly ITransactionService _transactionService;

        public TransactionsController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<PaginatedResult<TransactionReadDto>>>> GetTransactions(
            [FromQuery][Range(1, int.MaxValue, ErrorMessage = "Page must be 1 or greater")] int page = 1,
            [FromQuery][Range(1, MaxPageSize, ErrorMessage = "Page size must be between 1 and 100")] int pageSize = DefaultPageSize)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<PaginatedResult<TransactionReadDto>>.ErrorResponse(
                    "Validation failed", StatusCodes.Status400BadRequest, ModelState.ToErrorMessages()));
            }

            var transactions = await _transactionService.GetTransactions(User.GetUserId(), page, pageSize);

            return Ok(ApiResponse<PaginatedResult<TransactionReadDto>>.SuccessResponse(
                transactions, StatusCodes.Status200OK, "Transactions retrieved"));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ApiResponse<TransactionReadDto>>> GetTransaction(Guid id)
        {
            var transaction = await _transactionService.GetTransaction(User.GetUserId(), id);

            if (transaction == null)
            {
                return NotFound(ApiResponse<TransactionReadDto>.ErrorResponse(
                    "Transaction not found", StatusCodes.Status404NotFound));
            }

            return Ok(ApiResponse<TransactionReadDto>.SuccessResponse(
                transaction, StatusCodes.Status200OK, "Transaction retrieved"));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<TransactionReadDto>>> CreateTransaction(
            [FromBody] TransactionWriteDto request,
            // Optional, and a header rather than a body field because it describes the
            // delivery of the request, not the accounting event being recorded.
            [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<TransactionReadDto>.ErrorResponse(
                    "Validation failed", StatusCodes.Status400BadRequest, ModelState.ToErrorMessages()));
            }

            var transaction = await _transactionService.CreateTransaction(
                User.GetUserId(), request, idempotencyKey);

            if (transaction == null)
            {
                // The ids are request data, so this is a malformed request rather than
                // a missing resource. Phrased without saying which account is at
                // fault, since one may exist but belong to somebody else.
                return BadRequest(ApiResponse<TransactionReadDto>.ErrorResponse(
                    "Both accounts must exist and belong to you", StatusCodes.Status400BadRequest));
            }

            return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id },
                ApiResponse<TransactionReadDto>.SuccessResponse(
                    transaction, StatusCodes.Status201Created, "Transaction posted"));
        }
    }
}
