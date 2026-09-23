using backend.DTOs;
using backend.Extensions;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Every account belongs to someone; none of this is public.
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountsController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<AccountReadDto>>>> GetAccounts()
        {
            var accounts = await _accountService.GetAccounts(User.GetUserId());

            return Ok(ApiResponse<IReadOnlyList<AccountReadDto>>.SuccessResponse(
                accounts, StatusCodes.Status200OK, "Accounts retrieved"));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ApiResponse<AccountReadDto>>> GetAccount(Guid id)
        {
            var account = await _accountService.GetAccount(User.GetUserId(), id);

            // Someone else's account is reported as missing rather than forbidden, so
            // the response cannot be used to discover which ids exist.
            if (account == null)
            {
                return NotFound(ApiResponse<AccountReadDto>.ErrorResponse(
                    "Account not found", StatusCodes.Status404NotFound));
            }

            return Ok(ApiResponse<AccountReadDto>.SuccessResponse(
                account, StatusCodes.Status200OK, "Account retrieved"));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<AccountReadDto>>> CreateAccount([FromBody] AccountWriteDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<AccountReadDto>.ErrorResponse(
                    "Validation failed", StatusCodes.Status400BadRequest, ModelState.ToErrorMessages()));
            }

            var account = await _accountService.CreateAccount(User.GetUserId(), request);

            if (account == null)
            {
                return Conflict(ApiResponse<AccountReadDto>.ErrorResponse(
                    "An account with that name already exists", StatusCodes.Status409Conflict));
            }

            return CreatedAtAction(nameof(GetAccount), new { id = account.Id },
                ApiResponse<AccountReadDto>.SuccessResponse(
                    account, StatusCodes.Status201Created, "Account created"));
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ApiResponse<AccountReadDto>>> RenameAccount(Guid id, [FromBody] AccountUpdateDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<AccountReadDto>.ErrorResponse(
                    "Validation failed", StatusCodes.Status400BadRequest, ModelState.ToErrorMessages()));
            }

            var ownerId = User.GetUserId();

            // Checked separately so the two failures stay distinguishable: without it
            // a null return would mean either "no such account" or "name taken", and
            // the client could not tell the user what to do. Renaming is rare, so the
            // extra read costs nothing worth saving.
            if (await _accountService.GetAccount(ownerId, id) == null)
            {
                return NotFound(ApiResponse<AccountReadDto>.ErrorResponse(
                    "Account not found", StatusCodes.Status404NotFound));
            }

            var account = await _accountService.RenameAccount(ownerId, id, request);

            if (account == null)
            {
                return Conflict(ApiResponse<AccountReadDto>.ErrorResponse(
                    "An account with that name already exists", StatusCodes.Status409Conflict));
            }

            return Ok(ApiResponse<AccountReadDto>.SuccessResponse(
                account, StatusCodes.Status200OK, "Account renamed"));
        }
    }
}
