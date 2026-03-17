using System.Globalization;
using System.Text;
using aspnet_backend.Contracts;
using MySqlConnector;

namespace aspnet_backend.Services;

public sealed class ReportsService(IConfiguration configuration, ILogger<ReportsService> logger) : IReportsService
{
    private static readonly string[] DateColumnCandidates = ["createdAt", "created_at", "CreatedAt", "timestamp", "Timestamp", "generatedAt", "GeneratedAt"];

    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

    private readonly ILogger<ReportsService> _logger = logger;

    public async Task<ReportSummaryDto> GetSummaryAsync(DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken)
    {
        ValidateDateRange(from, to);

        MySqlConnection connection;
        try
        {
            connection = await OpenConnectionAsync(cancellationToken);
        }
        catch (ReportDataException exception) when (exception.StatusCode == StatusCodes.Status503ServiceUnavailable)
        {
            _logger.LogWarning(exception, "Reporting database unavailable while generating summary. Returning empty summary response.");
            return BuildEmptySummary(from, to);
        }

        await using (connection)
        {
            var users = await CountAsync(connection, "users", from, to, cancellationToken);
            var eventsCount = await CountAsync(connection, "events", from, to, cancellationToken);
            var orders = await CountAsync(connection, "orders", from, to, cancellationToken);
            var confirmedOrders = await CountByStatusAsync(connection, "orders", "CONFIRMED", from, to, cancellationToken);
            var cancelledOrders = await CountByStatusAsync(connection, "orders", "CANCELLED", from, to, cancellationToken);
            var notificationsSent = await CountAsync(connection, "notifications", from, to, cancellationToken);

            var grossRevenue = await SumAsync(connection, "orders", ["totalAmount", "total_amount", "amount"], "CONFIRMED", from, to, cancellationToken);
            var totalExpenses = await SumAsync(connection, "expenses", ["amount", "actualAmount", "actual_amount"], null, from, to, cancellationToken);

            return new ReportSummaryDto
            {
                Users = users,
                Events = eventsCount,
                Orders = orders,
                ConfirmedOrders = confirmedOrders,
                CancelledOrders = cancelledOrders,
                NotificationsSent = notificationsSent,
                GrossRevenue = grossRevenue,
                TotalExpenses = totalExpenses,
                NetRevenue = grossRevenue - totalExpenses,
                FromDate = from,
                ToDate = to,
                GeneratedAt = DateTimeOffset.UtcNow
            };
        }
    }

    public async Task<IReadOnlyList<BudgetVarianceRowDto>> GetBudgetVarianceAsync(DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken)
    {
        ValidateDateRange(from, to);

        MySqlConnection connection;
        try
        {
            connection = await OpenConnectionAsync(cancellationToken);
        }
        catch (ReportDataException exception) when (exception.StatusCode == StatusCodes.Status503ServiceUnavailable)
        {
            _logger.LogWarning(exception, "Reporting database unavailable while generating budget variance. Returning empty response.");
            return [];
        }

        await using (connection)
        {
            if (!await TableExistsAsync(connection, "budgets", cancellationToken))
            {
                return [];
            }

            var budgetIdColumn = await ResolveColumnAsync(connection, "budgets", ["id", "budgetId", "budget_id"], cancellationToken)
                ?? throw new ReportDataException("Budgets table is missing a supported budget id column.");

            var budgetEventIdColumn = await ResolveColumnAsync(connection, "budgets", ["eventId", "event_id"], cancellationToken)
                ?? throw new ReportDataException("Budgets table is missing a supported event reference column.");

            var plannedAmountColumn = await ResolveColumnAsync(connection, "budgets", ["plannedAmount", "planned_amount", "amount"], cancellationToken)
                ?? throw new ReportDataException("Budgets table is missing a supported planned amount column.");

            var budgetDateColumn = await ResolveColumnAsync(connection, "budgets", DateColumnCandidates, cancellationToken);

            var budgetSql = new StringBuilder($"SELECT `{budgetIdColumn}`, `{budgetEventIdColumn}`, CAST(`{plannedAmountColumn}` AS DECIMAL(18,2)) FROM `budgets`");
            await using var budgetCommand = connection.CreateCommand();
            AppendDateClause(budgetSql, budgetCommand, budgetDateColumn, from, to);

            budgetCommand.CommandText = budgetSql.ToString();

            var budgets = new List<(string BudgetId, string EventId, decimal PlannedAmount)>();
            await using (var budgetReader = await budgetCommand.ExecuteReaderAsync(cancellationToken))
            {
                while (await budgetReader.ReadAsync(cancellationToken))
                {
                    var budgetId = budgetReader.IsDBNull(0) ? string.Empty : budgetReader.GetValue(0).ToString() ?? string.Empty;
                    var eventId = budgetReader.IsDBNull(1) ? string.Empty : budgetReader.GetValue(1).ToString() ?? string.Empty;
                    var plannedAmount = budgetReader.IsDBNull(2)
                        ? 0m
                        : Convert.ToDecimal(budgetReader.GetValue(2), CultureInfo.InvariantCulture);

                    budgets.Add((budgetId, eventId, plannedAmount));
                }
            }

            if (budgets.Count == 0)
            {
                return [];
            }

            var eventTitles = await LoadEventTitlesAsync(connection, cancellationToken);
            var expenseTotals = await LoadExpenseTotalsAsync(connection, from, to, cancellationToken);

            var rows = budgets
                .Select(budget =>
                {
                    expenseTotals.TryGetValue(budget.EventId, out var actualAmount);
                    eventTitles.TryGetValue(budget.EventId, out var eventTitle);

                    return new BudgetVarianceRowDto
                    {
                        BudgetId = budget.BudgetId,
                        EventId = budget.EventId,
                        EventTitle = string.IsNullOrWhiteSpace(eventTitle) ? "Unknown event" : eventTitle,
                        PlannedAmount = budget.PlannedAmount,
                        ActualAmount = actualAmount
                    };
                })
                .ToList();

            return rows;
        }
    }

    public async Task<IReadOnlyList<OrderCategoryCountDto>> GetOrderCountsByCategoryAsync(DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken)
    {
        ValidateDateRange(from, to);

        MySqlConnection connection;
        try
        {
            connection = await OpenConnectionAsync(cancellationToken);
        }
        catch (ReportDataException exception) when (exception.StatusCode == StatusCodes.Status503ServiceUnavailable)
        {
            _logger.LogWarning(exception, "Reporting database unavailable while generating order categories. Returning empty response.");
            return [];
        }

        await using (connection)
        {
            var eventCategories = await LoadEventCategoriesAsync(connection, cancellationToken);
            if (eventCategories.Count == 0)
            {
                return [];
            }

            var countsByEventId = await LoadConfirmedOrderCountsByEventIdAsync(connection, from, to, cancellationToken);
            if (countsByEventId.Count == 0)
            {
                return [];
            }

            return countsByEventId
                .GroupBy(
                    entry => eventCategories.TryGetValue(entry.Key, out var category) && !string.IsNullOrWhiteSpace(category)
                        ? category
                        : "Uncategorized",
                    StringComparer.OrdinalIgnoreCase)
                .Select(group => new OrderCategoryCountDto
                {
                    Category = group.Key,
                    Count = group.Sum(entry => entry.Value)
                })
                .OrderByDescending(entry => entry.Count)
                .ThenBy(entry => entry.Category)
                .ToList();
        }
    }

    private static ReportSummaryDto BuildEmptySummary(DateTimeOffset? from, DateTimeOffset? to)
    {
        return new ReportSummaryDto
        {
            Users = 0,
            Events = 0,
            Orders = 0,
            ConfirmedOrders = 0,
            CancelledOrders = 0,
            NotificationsSent = 0,
            GrossRevenue = 0m,
            TotalExpenses = 0m,
            NetRevenue = 0m,
            FromDate = from,
            ToDate = to,
            GeneratedAt = DateTimeOffset.UtcNow
        };
    }

    public async Task<long> CreateBudgetAsync(CreateBudgetRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);

        if (!await TableExistsAsync(connection, "budgets", cancellationToken))
        {
            throw new ReportDataException("Budgets table is not available in the current database.", StatusCodes.Status503ServiceUnavailable);
        }

        var eventIdColumn = await ResolveColumnAsync(connection, "budgets", ["eventId", "event_id"], cancellationToken)
            ?? throw new ReportDataException("Budgets table is missing event reference column.");

        var plannedAmountColumn = await ResolveColumnAsync(connection, "budgets", ["plannedAmount", "planned_amount", "amount"], cancellationToken)
            ?? throw new ReportDataException("Budgets table is missing planned amount column.");

        var noteColumn = await ResolveColumnAsync(connection, "budgets", ["note", "notes", "description"], cancellationToken);
        var dateColumn = await ResolveColumnAsync(connection, "budgets", DateColumnCandidates, cancellationToken);

        var columns = new List<string> { eventIdColumn, plannedAmountColumn };
        var parameterNames = new List<string> { "@eventId", "@plannedAmount" };

        await using var command = connection.CreateCommand();
        command.Parameters.AddWithValue("@eventId", request.EventId);
        command.Parameters.AddWithValue("@plannedAmount", request.PlannedAmount);

        if (!string.IsNullOrWhiteSpace(noteColumn))
        {
            columns.Add(noteColumn);
            parameterNames.Add("@note");
            command.Parameters.AddWithValue("@note", request.Note ?? string.Empty);
        }

        if (!string.IsNullOrWhiteSpace(dateColumn))
        {
            columns.Add(dateColumn);
            parameterNames.Add("@createdAt");
            command.Parameters.AddWithValue("@createdAt", DateTimeOffset.UtcNow.UtcDateTime);
        }

        command.CommandText = $"INSERT INTO `budgets` ({string.Join(",", columns.Select(column => $"`{column}`"))}) VALUES ({string.Join(",", parameterNames)}); SELECT LAST_INSERT_ID();";

        try
        {
            var scalar = await command.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt64(scalar, CultureInfo.InvariantCulture);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create budget row for event {EventId}", request.EventId);
            throw new ReportDataException("Failed to create budget entry.", StatusCodes.Status500InternalServerError, ex);
        }
    }

    public async Task<long> CreateExpenseAsync(CreateExpenseRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);

        if (!await TableExistsAsync(connection, "expenses", cancellationToken))
        {
            throw new ReportDataException("Expenses table is not available in the current database.", StatusCodes.Status503ServiceUnavailable);
        }

        var eventIdColumn = await ResolveColumnAsync(connection, "expenses", ["eventId", "event_id"], cancellationToken)
            ?? throw new ReportDataException("Expenses table is missing event reference column.");

        var categoryColumn = await ResolveColumnAsync(connection, "expenses", ["category", "expenseCategory", "expense_category"], cancellationToken)
            ?? throw new ReportDataException("Expenses table is missing category column.");

        var amountColumn = await ResolveColumnAsync(connection, "expenses", ["amount", "actualAmount", "actual_amount"], cancellationToken)
            ?? throw new ReportDataException("Expenses table is missing amount column.");

        var noteColumn = await ResolveColumnAsync(connection, "expenses", ["note", "notes", "description"], cancellationToken);
        var dateColumn = await ResolveColumnAsync(connection, "expenses", DateColumnCandidates, cancellationToken);

        var columns = new List<string> { eventIdColumn, categoryColumn, amountColumn };
        var parameterNames = new List<string> { "@eventId", "@category", "@amount" };

        await using var command = connection.CreateCommand();
        command.Parameters.AddWithValue("@eventId", request.EventId);
        command.Parameters.AddWithValue("@category", request.Category);
        command.Parameters.AddWithValue("@amount", request.Amount);

        if (!string.IsNullOrWhiteSpace(noteColumn))
        {
            columns.Add(noteColumn);
            parameterNames.Add("@note");
            command.Parameters.AddWithValue("@note", request.Note ?? string.Empty);
        }

        if (!string.IsNullOrWhiteSpace(dateColumn))
        {
            columns.Add(dateColumn);
            parameterNames.Add("@createdAt");
            command.Parameters.AddWithValue("@createdAt", DateTimeOffset.UtcNow.UtcDateTime);
        }

        command.CommandText = $"INSERT INTO `expenses` ({string.Join(",", columns.Select(column => $"`{column}`"))}) VALUES ({string.Join(",", parameterNames)}); SELECT LAST_INSERT_ID();";

        try
        {
            var scalar = await command.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt64(scalar, CultureInfo.InvariantCulture);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create expense row for event {EventId}", request.EventId);
            throw new ReportDataException("Failed to create expense entry.", StatusCodes.Status500InternalServerError, ex);
        }
    }

    public async Task<string> ExportSummaryCsvAsync(DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken)
    {
        var summary = await GetSummaryAsync(from, to, cancellationToken);

        var csvBuilder = new StringBuilder();
        csvBuilder.AppendLine("users,events,orders,confirmedOrders,cancelledOrders,notificationsSent,grossRevenue,totalExpenses,netRevenue,fromDate,toDate,generatedAt");
        csvBuilder.AppendLine(string.Join(",",
            summary.Users,
            summary.Events,
            summary.Orders,
            summary.ConfirmedOrders,
            summary.CancelledOrders,
            summary.NotificationsSent,
            summary.GrossRevenue.ToString(CultureInfo.InvariantCulture),
            summary.TotalExpenses.ToString(CultureInfo.InvariantCulture),
            summary.NetRevenue.ToString(CultureInfo.InvariantCulture),
            summary.FromDate?.ToString("O") ?? string.Empty,
            summary.ToDate?.ToString("O") ?? string.Empty,
            summary.GeneratedAt.ToString("O")));

        return csvBuilder.ToString();
    }

    private static void ValidateDateRange(DateTimeOffset? from, DateTimeOffset? to)
    {
        if (from.HasValue && to.HasValue && from.Value > to.Value)
        {
            throw new ReportDataException("Query parameter 'from' must be less than or equal to 'to'.", StatusCodes.Status400BadRequest);
        }
    }

    private async Task<long> CountAsync(MySqlConnection connection, string tableName, DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, tableName, cancellationToken))
        {
            return 0;
        }

        var dateColumn = await ResolveColumnAsync(connection, tableName, DateColumnCandidates, cancellationToken);

        var sql = new StringBuilder($"SELECT COUNT(*) FROM `{tableName}`");
        await using var command = connection.CreateCommand();
        AppendDateClause(sql, command, dateColumn, from, to);

        command.CommandText = sql.ToString();
        var scalar = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt64(scalar, CultureInfo.InvariantCulture);
    }

    private async Task<long> CountByStatusAsync(MySqlConnection connection, string tableName, string status, DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, tableName, cancellationToken))
        {
            return 0;
        }

        var statusColumn = await ResolveColumnAsync(connection, tableName, ["status", "Status"], cancellationToken);
        if (string.IsNullOrWhiteSpace(statusColumn))
        {
            return 0;
        }

        var dateColumn = await ResolveColumnAsync(connection, tableName, DateColumnCandidates, cancellationToken);

        var sql = new StringBuilder($"SELECT COUNT(*) FROM `{tableName}` WHERE LOWER(`{statusColumn}`) = LOWER(@status)");
        await using var command = connection.CreateCommand();
        command.Parameters.AddWithValue("@status", status);

        AppendDateClause(sql, command, dateColumn, from, to, hasWhereClause: true);

        command.CommandText = sql.ToString();
        var scalar = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt64(scalar, CultureInfo.InvariantCulture);
    }

    private async Task<decimal> SumAsync(
        MySqlConnection connection,
        string tableName,
        string[] amountColumnCandidates,
        string? statusFilter,
        DateTimeOffset? from,
        DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, tableName, cancellationToken))
        {
            return 0m;
        }

        var amountColumn = await ResolveColumnAsync(connection, tableName, amountColumnCandidates, cancellationToken);
        if (string.IsNullOrWhiteSpace(amountColumn))
        {
            return 0m;
        }

        var statusColumn = await ResolveColumnAsync(connection, tableName, ["status", "Status"], cancellationToken);
        var dateColumn = await ResolveColumnAsync(connection, tableName, DateColumnCandidates, cancellationToken);

        var sql = new StringBuilder($"SELECT COALESCE(SUM(CAST(`{amountColumn}` AS DECIMAL(18,2))), 0) FROM `{tableName}`");
        await using var command = connection.CreateCommand();

        var hasWhereClause = false;
        if (!string.IsNullOrWhiteSpace(statusFilter) && !string.IsNullOrWhiteSpace(statusColumn))
        {
            sql.Append($" WHERE LOWER(`{statusColumn}`) = LOWER(@status)");
            command.Parameters.AddWithValue("@status", statusFilter);
            hasWhereClause = true;
        }

        AppendDateClause(sql, command, dateColumn, from, to, hasWhereClause);

        command.CommandText = sql.ToString();
        var scalar = await command.ExecuteScalarAsync(cancellationToken);

        return Convert.ToDecimal(scalar, CultureInfo.InvariantCulture);
    }

    private async Task<Dictionary<string, string>> LoadEventTitlesAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, "events", cancellationToken))
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        var eventIdColumn = await ResolveColumnAsync(connection, "events", ["id", "eventId", "event_id"], cancellationToken);
        var eventTitleColumn = await ResolveColumnAsync(connection, "events", ["title", "eventTitle", "name"], cancellationToken);

        if (string.IsNullOrWhiteSpace(eventIdColumn) || string.IsNullOrWhiteSpace(eventTitleColumn))
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        var sql = $"SELECT `{eventIdColumn}`, `{eventTitleColumn}` FROM `events`";
        await using var command = connection.CreateCommand();
        command.CommandText = sql;

        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var eventId = reader.IsDBNull(0) ? string.Empty : reader.GetValue(0).ToString() ?? string.Empty;
            var title = reader.IsDBNull(1) ? string.Empty : reader.GetValue(1).ToString() ?? string.Empty;

            if (!string.IsNullOrWhiteSpace(eventId) && !map.ContainsKey(eventId))
            {
                map[eventId] = title;
            }
        }

        return map;
    }

    private async Task<Dictionary<string, string>> LoadEventCategoriesAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, "events", cancellationToken))
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        var eventIdColumn = await ResolveColumnAsync(connection, "events", ["id", "eventId", "event_id"], cancellationToken);
        var categoryColumn = await ResolveColumnAsync(connection, "events", ["category", "eventCategory", "event_category"], cancellationToken);

        if (string.IsNullOrWhiteSpace(eventIdColumn) || string.IsNullOrWhiteSpace(categoryColumn))
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        var sql = $"SELECT `{eventIdColumn}`, `{categoryColumn}` FROM `events`";
        await using var command = connection.CreateCommand();
        command.CommandText = sql;

        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var eventId = reader.IsDBNull(0) ? string.Empty : reader.GetValue(0).ToString() ?? string.Empty;
            var category = reader.IsDBNull(1) ? string.Empty : reader.GetValue(1).ToString() ?? string.Empty;

            if (!string.IsNullOrWhiteSpace(eventId) && !map.ContainsKey(eventId))
            {
                map[eventId] = string.IsNullOrWhiteSpace(category) ? "Uncategorized" : category;
            }
        }

        return map;
    }

    private async Task<Dictionary<string, long>> LoadConfirmedOrderCountsByEventIdAsync(
        MySqlConnection connection,
        DateTimeOffset? from,
        DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, "orders", cancellationToken))
        {
            return new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
        }

        var eventIdColumn = await ResolveColumnAsync(connection, "orders", ["eventId", "event_id"], cancellationToken);
        if (string.IsNullOrWhiteSpace(eventIdColumn))
        {
            return new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
        }

        var statusColumn = await ResolveColumnAsync(connection, "orders", ["status", "Status"], cancellationToken);
        var dateColumn = await ResolveColumnAsync(connection, "orders", DateColumnCandidates, cancellationToken);

        var sql = new StringBuilder($"SELECT `{eventIdColumn}`, COUNT(*) FROM `orders`");
        await using var command = connection.CreateCommand();

        var hasWhereClause = false;
        if (!string.IsNullOrWhiteSpace(statusColumn))
        {
            sql.Append($" WHERE LOWER(`{statusColumn}`) = LOWER(@status)");
            command.Parameters.AddWithValue("@status", "CONFIRMED");
            hasWhereClause = true;
        }

        AppendDateClause(sql, command, dateColumn, from, to, hasWhereClause);
        sql.Append($" GROUP BY `{eventIdColumn}`");

        command.CommandText = sql.ToString();

        var counts = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var eventId = reader.IsDBNull(0) ? string.Empty : reader.GetValue(0).ToString() ?? string.Empty;
            var count = reader.IsDBNull(1)
                ? 0L
                : Convert.ToInt64(reader.GetValue(1), CultureInfo.InvariantCulture);

            if (!string.IsNullOrWhiteSpace(eventId))
            {
                counts[eventId] = count;
            }
        }

        return counts;
    }

    private async Task<Dictionary<string, decimal>> LoadExpenseTotalsAsync(
        MySqlConnection connection,
        DateTimeOffset? from,
        DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, "expenses", cancellationToken))
        {
            return new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        }

        var eventIdColumn = await ResolveColumnAsync(connection, "expenses", ["eventId", "event_id"], cancellationToken);
        var amountColumn = await ResolveColumnAsync(connection, "expenses", ["amount", "actualAmount", "actual_amount"], cancellationToken);

        if (string.IsNullOrWhiteSpace(eventIdColumn) || string.IsNullOrWhiteSpace(amountColumn))
        {
            return new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        }

        var dateColumn = await ResolveColumnAsync(connection, "expenses", DateColumnCandidates, cancellationToken);

        var sql = new StringBuilder($"SELECT `{eventIdColumn}`, COALESCE(SUM(CAST(`{amountColumn}` AS DECIMAL(18,2))), 0) FROM `expenses`");
        await using var command = connection.CreateCommand();

        AppendDateClause(sql, command, dateColumn, from, to);
        sql.Append($" GROUP BY `{eventIdColumn}`");

        command.CommandText = sql.ToString();

        var totals = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var eventId = reader.IsDBNull(0) ? string.Empty : reader.GetValue(0).ToString() ?? string.Empty;
            var total = reader.IsDBNull(1)
                ? 0m
                : Convert.ToDecimal(reader.GetValue(1), CultureInfo.InvariantCulture);

            if (!string.IsNullOrWhiteSpace(eventId))
            {
                totals[eventId] = total;
            }
        }

        return totals;
    }

    private static void AppendDateClause(
        StringBuilder sql,
        MySqlCommand command,
        string? dateColumn,
        DateTimeOffset? from,
        DateTimeOffset? to,
        bool hasWhereClause = false)
    {
        if (string.IsNullOrWhiteSpace(dateColumn) || (!from.HasValue && !to.HasValue))
        {
            return;
        }

        var separator = hasWhereClause ? " AND " : " WHERE ";
        var appendedAnyClause = false;

        if (from.HasValue)
        {
            sql.Append(separator).Append($"`{dateColumn}` >= @fromDate");
            command.Parameters.AddWithValue("@fromDate", from.Value.UtcDateTime);
            separator = " AND ";
            appendedAnyClause = true;
        }

        if (to.HasValue)
        {
            sql.Append(separator).Append($"`{dateColumn}` <= @toDate");
            command.Parameters.AddWithValue("@toDate", to.Value.UtcDateTime);
            appendedAnyClause = true;
        }

        _ = appendedAnyClause;
    }

    private static async Task<bool> TableExistsAsync(MySqlConnection connection, string tableName, CancellationToken cancellationToken)
    {
        const string sql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = @tableName;";

        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.AddWithValue("@tableName", tableName);

        var scalar = await command.ExecuteScalarAsync(cancellationToken);
        var count = Convert.ToInt64(scalar, CultureInfo.InvariantCulture);
        return count > 0;
    }

    private static async Task<bool> ColumnExistsAsync(MySqlConnection connection, string tableName, string columnName, CancellationToken cancellationToken)
    {
        const string sql = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tableName AND column_name = @columnName;";

        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.AddWithValue("@tableName", tableName);
        command.Parameters.AddWithValue("@columnName", columnName);

        var scalar = await command.ExecuteScalarAsync(cancellationToken);
        var count = Convert.ToInt64(scalar, CultureInfo.InvariantCulture);
        return count > 0;
    }

    private static async Task<string?> ResolveColumnAsync(MySqlConnection connection, string tableName, string[] candidates, CancellationToken cancellationToken)
    {
        foreach (var candidate in candidates)
        {
            if (await ColumnExistsAsync(connection, tableName, candidate, cancellationToken))
            {
                return candidate;
            }
        }

        return null;
    }

    private async Task<MySqlConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connection = new MySqlConnection(_connectionString);

        try
        {
            await connection.OpenAsync(cancellationToken);
            return connection;
        }
        catch (Exception ex)
        {
            await connection.DisposeAsync();

            throw new ReportDataException(
                "Unable to connect to the reporting database.",
                StatusCodes.Status503ServiceUnavailable,
                ex);
        }
    }
}
