using aspnet_backend.Contracts;
using aspnet_backend.Controllers;
using aspnet_backend.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace aspnet_backend.Tests;

public sealed class ReportsControllerTests
{
    private readonly Mock<IReportsService> _reportsService = new();
    private readonly Mock<ILogger<ReportsController>> _logger = new();

    private ReportsController CreateController() =>
        new(_reportsService.Object, _logger.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

    [Fact]
    public void GetHealth_ReturnsOkEnvelope()
    {
        var controller = CreateController();

        var result = controller.GetHealth();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
    }

    [Fact]
    public async Task GetSummary_ReturnsOkAndCallsService()
    {
        _reportsService
            .Setup(service => service.GetSummaryAsync(null, null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReportSummaryDto
            {
                Users = 10,
                Events = 4,
                Orders = 8,
                GeneratedAt = DateTimeOffset.UtcNow
            });

        var controller = CreateController();

        var result = await controller.GetSummary(null, null, null, null, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        _reportsService.Verify(
            service => service.GetSummaryAsync(null, null, null, null, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateBudget_ReturnsCreatedWithBudgetId()
    {
        _reportsService
            .Setup(service => service.CreateBudgetAsync(It.IsAny<CreateBudgetRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(42);

        var controller = CreateController();

        var request = new CreateBudgetRequest
        {
            EventId = "event-1",
            PlannedAmount = 5000m,
            Note = "Venue and logistics"
        };

        var result = await controller.CreateBudget(request, CancellationToken.None);

        var created = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
    }

    [Fact]
    public async Task Export_WithUnsupportedFormat_ReturnsBadRequest()
    {
        var controller = CreateController();

        var result = await controller.Export("json", null, null, null, null, CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, badRequest.StatusCode);
    }
}
