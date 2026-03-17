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
        CancellationToken cancellationToken)
    {
        var summary = await reportsService.GetSummaryAsync(from, to, cancellationToken);

        logger.LogInformation("Reporting summary requested. from={From} to={To}", from, to);

        return Ok(ApiEnvelope<ReportSummaryDto>.Ok(summary, "Reporting summary generated."));
    }

    [HttpGet("budget-vs-actual")]
    public async Task<IActionResult> GetBudgetVsActual(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var rows = await reportsService.GetBudgetVarianceAsync(from, to, cancellationToken);
        return Ok(ApiEnvelope<IReadOnlyList<BudgetVarianceRowDto>>.Ok(rows, "Budget variance report generated."));
    }

    [HttpGet("orders-by-category")]
    public async Task<IActionResult> GetOrdersByCategory(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var rows = await reportsService.GetOrderCountsByCategoryAsync(from, to, cancellationToken);
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
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(ApiEnvelope<object>.Fail("Only csv export is supported currently."));
        }

        var csv = await reportsService.ExportSummaryCsvAsync(from, to, cancellationToken);
        var bytes = Encoding.UTF8.GetBytes(csv);
        var fileName = $"report-summary-{DateTime.UtcNow:yyyyMMddHHmmss}.csv";

        return File(bytes, "text/csv", fileName);
    }
}
