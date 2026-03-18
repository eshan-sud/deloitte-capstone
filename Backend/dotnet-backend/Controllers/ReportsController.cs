using System.Text;
using aspnet_backend.Contracts;
using aspnet_backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace aspnet_backend.Controllers;

[ApiController]
[Route("api/reports")]
public sealed class ReportsController(
    IReportsService reportsService,
    ILogger<ReportsController> logger) : ControllerBase
{
    [HttpGet("health")]
    public IActionResult GetHealth()
    {
        return Ok(ApiEnvelope<object>.Ok(new
        {
            service = "aspnet-reporting-service",
            message = "ASP.NET reporting API is running",
            timestamp = DateTime.UtcNow
        }, "Reporting service is healthy."));
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] string? organizerId,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var summary = await reportsService.GetSummaryAsync(from, to, organizerId, status, cancellationToken);

        logger.LogInformation(
            "Reporting summary requested. from={From} to={To} organizerId={OrganizerId} status={Status}",
            from,
            to,
            organizerId,
            status);

        return Ok(ApiEnvelope<ReportSummaryDto>.Ok(summary, "Reporting summary generated."));
    }

    [HttpGet("budget-vs-actual")]
    public async Task<IActionResult> GetBudgetVsActual(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] string? organizerId,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var rows = await reportsService.GetBudgetVarianceAsync(from, to, organizerId, status, cancellationToken);
        return Ok(ApiEnvelope<IReadOnlyList<BudgetVarianceRowDto>>.Ok(rows, "Budget variance report generated."));
    }

    [HttpGet("orders-by-category")]
    public async Task<IActionResult> GetOrdersByCategory(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] string? organizerId,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var rows = await reportsService.GetOrderCountsByCategoryAsync(from, to, organizerId, status, cancellationToken);
        return Ok(ApiEnvelope<IReadOnlyList<OrderCategoryCountDto>>.Ok(rows, "Order category report generated."));
    }

    [HttpPost("budget")]
    public async Task<IActionResult> CreateBudget(
        [FromBody] CreateBudgetRequest request,
        CancellationToken cancellationToken)
    {
        var budgetId = await reportsService.CreateBudgetAsync(request, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiEnvelope<object>.Ok(new { budgetId }, "Budget entry created."));
    }

    [HttpPost("expenses")]
    public async Task<IActionResult> CreateExpense(
        [FromBody] CreateExpenseRequest request,
        CancellationToken cancellationToken)
    {
        var expenseId = await reportsService.CreateExpenseAsync(request, cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiEnvelope<object>.Ok(new { expenseId }, "Expense entry created."));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string format = "csv",
        [FromQuery] DateTimeOffset? from = null,
        [FromQuery] DateTimeOffset? to = null,
        [FromQuery] string? organizerId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(ApiEnvelope<object>.Fail("Only csv export is supported currently."));
        }

        var csv = await reportsService.ExportSummaryCsvAsync(from, to, organizerId, status, cancellationToken);
        var bytes = Encoding.UTF8.GetBytes(csv);
        var fileName = $"report-summary-{DateTime.UtcNow:yyyyMMddHHmmss}.csv";

        return File(bytes, "text/csv", fileName);
    }
}
