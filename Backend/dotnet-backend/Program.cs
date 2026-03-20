using System.Security.Cryptography;
using System.Text;
using aspnet_backend.Contracts;
using aspnet_backend.Services;

LoadLocalDotEnv();

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicyName = "FrontendOrigins";

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();
builder.Services.AddScoped<IReportsService, ReportsService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? ["http://localhost:3000", "http://localhost:5173"];

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var reportingAdminApiKey = builder.Configuration["Reporting:AdminApiKey"]?.Trim();

var app = builder.Build();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (ReportDataException reportException)
    {
        var logger = context.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("GlobalExceptionMiddleware");

        logger.LogWarning(reportException, "ReportDataException: {Message}", reportException.Message);

        context.Response.StatusCode = reportException.StatusCode;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(ApiEnvelope<object>.Fail(reportException.Message));
    }
    catch (Exception exception)
    {
        var logger = context.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("GlobalExceptionMiddleware");

        logger.LogError(exception, "Unhandled exception in ASP.NET reporting service.");

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(ApiEnvelope<object>.Fail("An unexpected error occurred."));
    }
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors(CorsPolicyName);

app.Use(async (context, next) =>
{
    var path = context.Request.Path;
    var isProtectedReportingPath =
        path.StartsWithSegments("/api/reports/summary") ||
        path.StartsWithSegments("/api/reports/budget-vs-actual") ||
        path.StartsWithSegments("/api/reports/orders-by-category") ||
        path.StartsWithSegments("/api/reports/export");

    if (!isProtectedReportingPath)
    {
        await next();
        return;
    }

    if (string.IsNullOrWhiteSpace(reportingAdminApiKey))
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(ApiEnvelope<object>.Fail("Reporting admin key is not configured."));
        return;
    }

    var suppliedAdminKey = context.Request.Headers["X-Admin-Key"].ToString().Trim();
    if (string.IsNullOrWhiteSpace(suppliedAdminKey))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(ApiEnvelope<object>.Fail("X-Admin-Key header is required for admin reporting routes."));
        return;
    }

    if (!FixedTimeEquals(suppliedAdminKey, reportingAdminApiKey))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(ApiEnvelope<object>.Fail("Invalid admin key for reporting routes."));
        return;
    }

    await next();
});

app.UseAuthorization();

app.MapHealthChecks("/api/reports/health/live");
app.MapControllers();

app.Run();

static void LoadLocalDotEnv()
{
    var candidatePaths = new[]
    {
        Path.Combine(Directory.GetCurrentDirectory(), ".env"),
        Path.Combine(Directory.GetCurrentDirectory(), "Backend", "dotnet-backend", ".env")
    };

    foreach (var filePath in candidatePaths)
    {
        if (!File.Exists(filePath))
        {
            continue;
        }

        foreach (var line in File.ReadLines(filePath))
        {
            var trimmedLine = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmedLine) || trimmedLine.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = trimmedLine.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = trimmedLine[..separatorIndex].Trim();
            if (key.StartsWith("export ", StringComparison.OrdinalIgnoreCase))
            {
                key = key["export ".Length..].Trim();
            }

            if (string.IsNullOrWhiteSpace(key) || !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
            {
                continue;
            }

            var rawValue = trimmedLine[(separatorIndex + 1)..].Trim();
            Environment.SetEnvironmentVariable(key, StripWrappingQuotes(rawValue));
        }

        return;
    }
}

static string StripWrappingQuotes(string value)
{
    if (value.Length >= 2)
    {
        var firstCharacter = value[0];
        var lastCharacter = value[^1];

        if ((firstCharacter == '"' && lastCharacter == '"') || (firstCharacter == '\'' && lastCharacter == '\''))
        {
            return value[1..^1];
        }
    }

    return value;
}

static bool FixedTimeEquals(string left, string right)
{
    var leftBytes = Encoding.UTF8.GetBytes(left);
    var rightBytes = Encoding.UTF8.GetBytes(right);
    return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
}
