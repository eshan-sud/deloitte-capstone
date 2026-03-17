namespace aspnet_backend.Contracts;

public sealed class ReportSummaryDto
{
    public long Users { get; init; }
    public long Events { get; init; }
    public long Orders { get; init; }
    public long ConfirmedOrders { get; init; }
    public long CancelledOrders { get; init; }
    public long NotificationsSent { get; init; }
    public decimal GrossRevenue { get; init; }
    public decimal TotalExpenses { get; init; }
    public decimal NetRevenue { get; init; }
    public DateTimeOffset? FromDate { get; init; }
    public DateTimeOffset? ToDate { get; init; }
    public DateTimeOffset GeneratedAt { get; init; }
}

public sealed class BudgetVarianceRowDto
{
    public string BudgetId { get; init; } = string.Empty;
    public string EventId { get; init; } = string.Empty;
    public string EventTitle { get; init; } = "Unknown event";
    public decimal PlannedAmount { get; init; }
    public decimal ActualAmount { get; init; }
    public decimal Variance => PlannedAmount - ActualAmount;
}

public sealed class OrderCategoryCountDto
{
    public string Category { get; init; } = "Uncategorized";
    public long Count { get; init; }
}
