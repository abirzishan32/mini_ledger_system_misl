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

        // Returns the caller's chart of accounts, each with its derived balance.
        // Delegates to AccountService.GetAccounts, passing the id taken from the
        // verified token rather than from anything the client sent.
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<AccountReadDto>>>> GetAccounts()
        {
            var accounts = await _accountService.GetAccounts(User.GetUserId());

            return Ok(ApiResponse<IReadOnlyList<AccountReadDto>>.SuccessResponse(
                accounts, StatusCodes.Status200OK, "Accounts retrieved"));
        }

        // Returns one account with its balance. AccountService scopes the lookup to
        // the caller, so an account belonging to someone else comes back null.
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

        // Returns the trial balance for the caller's books.
        // The whole calculation lives in AccountService.GetTrialBalance; this only
        // wraps it. The literal route cannot collide with the {id:guid} ones above,
        // because "trial-balance" never matches that constraint.
        [HttpGet("trial-balance")]
        public async Task<ActionResult<ApiResponse<TrialBalanceDto>>> GetTrialBalance()
        {
            var trialBalance = await _accountService.GetTrialBalance(User.GetUserId());

            return Ok(ApiResponse<TrialBalanceDto>.SuccessResponse(
                trialBalance, StatusCodes.Status200OK, "Trial balance calculated"));
        }

        // Returns one account's statement: every entry against it, oldest first,
        // with a running balance. AccountService returns null when the account does
        // not exist or is not the caller's, which becomes a 404 here.
        [HttpGet("{id:guid}/entries")]
        public async Task<ActionResult<ApiResponse<IReadOnlyList<AccountLedgerEntryDto>>>> GetAccountLedger(Guid id)
        {
            var ledger = await _accountService.GetAccountLedger(User.GetUserId(), id);

            if (ledger == null)
            {
                return NotFound(ApiResponse<IReadOnlyList<AccountLedgerEntryDto>>.ErrorResponse(
                    "Account not found", StatusCodes.Status404NotFound));
            }

            return Ok(ApiResponse<IReadOnlyList<AccountLedgerEntryDto>>.SuccessResponse(
                ledger, StatusCodes.Status200OK, "Account ledger retrieved"));
        }

        // Creates an account for the caller. The request body has already been
        // validated by ValidateModelAttribute, so only the duplicate-name case is
        // handled: AccountService returns null when the unique index rejects it.
        [HttpPost]
        public async Task<ActionResult<ApiResponse<AccountReadDto>>> CreateAccount([FromBody] AccountWriteDto request)
        {
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

        // Renames an owned account. AccountService.RenameAccount returns null for
        // both "no such account" and "name already taken", so this reads the account
        // first to tell the two apart and answer 404 or 409 accordingly.
        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ApiResponse<AccountReadDto>>> RenameAccount(Guid id, [FromBody] AccountUpdateDto request)
        {
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
