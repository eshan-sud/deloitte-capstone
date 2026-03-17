using System.ComponentModel.DataAnnotations;

namespace aspnet_backend.Contracts;

public sealed class CreateBudgetRequest
{
    [Required]
    [MinLength(1)]
    [MaxLength(64)]
    public string EventId { get; init; } = string.Empty;

    [Range(typeof(decimal), "0.01", "999999999")]
    public decimal PlannedAmount { get; init; }

    [MaxLength(500)]
    public string? Note { get; init; }
}

public sealed class CreateExpenseRequest
{
    [Required]
    [MinLength(1)]
    [MaxLength(64)]
    public string EventId { get; init; } = string.Empty;

    [Required]
    [MinLength(2)]
    [MaxLength(100)]
    public string Category { get; init; } = string.Empty;

    [Range(typeof(decimal), "0.01", "999999999")]
    public decimal Amount { get; init; }

    [MaxLength(500)]
    public string? Note { get; init; }
}
