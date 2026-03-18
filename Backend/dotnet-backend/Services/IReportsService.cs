using aspnet_backend.Contracts;

namespace aspnet_backend.Services;

public interface IReportsService
{
    Task<ReportSummaryDto> GetSummaryAsync(DateTimeOffset? from, DateTimeOffset? to, string? organizerId, string? status, CancellationToken cancellationToken);
    Task<IReadOnlyList<BudgetVarianceRowDto>> GetBudgetVarianceAsync(DateTimeOffset? from, DateTimeOffset? to, string? organizerId, string? status, CancellationToken cancellationToken);
    Task<IReadOnlyList<OrderCategoryCountDto>> GetOrderCountsByCategoryAsync(DateTimeOffset? from, DateTimeOffset? to, string? organizerId, string? status, CancellationToken cancellationToken);
    Task<long> CreateBudgetAsync(CreateBudgetRequest request, CancellationToken cancellationToken);
    Task<long> CreateExpenseAsync(CreateExpenseRequest request, CancellationToken cancellationToken);
    Task<string> ExportSummaryCsvAsync(DateTimeOffset? from, DateTimeOffset? to, string? organizerId, string? status, CancellationToken cancellationToken);
}

public sealed class ReportDataException : Exception
{
    public ReportDataException(string message, int statusCode = StatusCodes.Status500InternalServerError, Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = statusCode;
    }

    public int StatusCode { get; }
}
