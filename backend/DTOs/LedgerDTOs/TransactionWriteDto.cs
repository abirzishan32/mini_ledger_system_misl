using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    /// <summary>
    /// One accounting event, expressed as the two accounts it moves value between.
    ///
    /// Direction is the thing to get right: the debit account is the one that
    /// receives, the credit account is the one that gives. Buying supplies with cash
    /// debits Office Expense and credits Cash.
    /// </summary>
    public class TransactionWriteDto : IValidatableObject
    {
        private string _description = string.Empty;
        private string? _reference;

        [Required(ErrorMessage = "Date is required")]
        public DateTime? OccurredAt { get; set; }

        [Required(ErrorMessage = "Description is required")]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Description must be between 1 and 200 characters")]
        public string Description
        {
            get => _description;
            set => _description = value?.Trim() ?? string.Empty;
        }

        [StringLength(100, ErrorMessage = "Reference must be 100 characters or fewer")]
        public string? Reference
        {
            get => _reference;
            // Empty after trimming means "not supplied", so the column stays null
            // rather than holding a blank string that sorts and filters oddly.
            set => _reference = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        [Required(ErrorMessage = "Debit account is required")]
        public Guid? DebitAccountId { get; set; }

        [Required(ErrorMessage = "Credit account is required")]
        public Guid? CreditAccountId { get; set; }

        // Nullable so a missing field fails Required rather than binding to 0, which
        // Range would then report as "out of range" instead of "missing".
        [Required(ErrorMessage = "Amount is required")]
        [Range(typeof(decimal), "0.01", "9999999999999999.99",
            ParseLimitsInInvariantCulture = true,
            ErrorMessage = "Amount must be greater than zero")]
        public decimal? Amount { get; set; }

        /// <summary>
        /// Cross-field rules, which no single attribute can express.
        /// </summary>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (DebitAccountId.HasValue && DebitAccountId == CreditAccountId)
            {
                // Permitting it would post +X and -X to one account: a transaction
                // that balances, changes nothing, and is pure noise in the ledger.
                yield return new ValidationResult(
                    "Debit and credit accounts must be different",
                    new[] { nameof(DebitAccountId), nameof(CreditAccountId) });
            }

            // A day of slack absorbs clock skew and time zones while still catching
            // the mistyped year that would otherwise sit at the top of every list.
            if (OccurredAt.HasValue && OccurredAt.Value.ToUniversalTime() > DateTime.UtcNow.AddDays(1))
            {
                yield return new ValidationResult(
                    "Date cannot be in the future",
                    new[] { nameof(OccurredAt) });
            }
        }
    }
}
