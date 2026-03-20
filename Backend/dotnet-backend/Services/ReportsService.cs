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

    private sealed record ReportFilters(string? OrganizerId, string? Status)
    {
        public bool HasEventFilter => !string.IsNullOrWhiteSpace(OrganizerId) || !string.IsNullOrWhiteSpace(Status);
    }

    private sealed record EventMetadata(string Title, string Category);

    private sealed record OrderSnapshot(string EventId, string Status, decimal Amount);

    public async Task<ReportSummaryDto> GetSummaryAsync(
        DateTimeOffset? from,
        DateTimeOffset? to,
        string? organizerId,
        string? status,
        CancellationToken cancellationToken)
    {
        ValidateDateRange(from, to);
        var filters = NormalizeFilters(organizerId, status);

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
            var notificationsSent = await CountAsync(connection, "notifications", from, to, cancellationToken);

            var filteredEvents = await LoadFilteredEventsAsync(connection, filters, from, to, cancellationToken);
            var eventsCount = filters.HasEventFilter
                ? filteredEvents.Count
                : await CountAsync(connection, "events", from, to, cancellationToken);

            long orders;
            long confirmedOrders;
            long cancelledOrders;
            decimal grossRevenue;

            if (filters.HasEventFilter)
            {
                var filteredEventIds = new HashSet<string>(filteredEvents.Keys, StringComparer.OrdinalIgnoreCase);
                var orderRows = await LoadOrderSnapshotsAsync(connection, from, to, cancellationToken);

                var scopedOrders = orderRows
                    .Where(row => !string.IsNullOrWhiteSpace(row.EventId) && filteredEventIds.Contains(row.EventId))
                    .ToList();

                orders = scopedOrders.Count;
                confirmedOrders = scopedOrders.Count(row => string.Equals(row.Status, "CONFIRMED", StringComparison.OrdinalIgnoreCase));
                cancelledOrders = scopedOrders.Count(row => string.Equals(row.Status, "CANCELLED", StringComparison.OrdinalIgnoreCase));
                grossRevenue = scopedOrders
                    .Where(row => string.Equals(row.Status, "CONFIRMED", StringComparison.OrdinalIgnoreCase))
                    .Sum(row => row.Amount);
            }
            else
            {
                orders = await CountAsync(connection, "orders", from, to, cancellationToken);
                confirmedOrders = await CountByStatusAsync(connection, "orders", "CONFIRMED", from, to, cancellationToken);
                cancelledOrders = await CountByStatusAsync(connection, "orders", "CANCELLED", from, to, cancellationToken);
                grossRevenue = await SumAsync(connection, "orders", ["totalAmount", "total_amount", "amount"], "CONFIRMED", from, to, cancellationToken);
            }

            decimal totalExpenses;
            if (filters.HasEventFilter)
            {
                var filteredEventIds = new HashSet<string>(filteredEvents.Keys, StringComparer.OrdinalIgnoreCase);
                var expenseTotalsByEvent = await LoadExpenseTotalsAsync(connection, from, to, cancellationToken);

                totalExpenses = expenseTotalsByEvent
                    .Where(entry => filteredEventIds.Contains(entry.Key))
                    .Sum(entry => entry.Value);
            }
            else
            {
                totalExpenses = await SumAsync(connection, "expenses", ["amount", "actualAmount", "actual_amount"], null, from, to, cancellationToken);
            }

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

    public async Task<IReadOnlyList<BudgetVarianceRowDto>> GetBudgetVarianceAsync(
        DateTimeOffset? from,
        DateTimeOffset? to,
        string? organizerId,
        string? status,
        CancellationToken cancellationToken)
    {
        ValidateDateRange(from, to);
        var filters = NormalizeFilters(organizerId, status);

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
            var filteredEvents = await LoadFilteredEventsAsync(connection, filters, null, null, cancellationToken);
            var filteredEventIds = new HashSet<string>(filteredEvents.Keys, StringComparer.OrdinalIgnoreCase);

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

            if (filters.HasEventFilter)
            {
                budgets = budgets
                    .Where(budget => filteredEventIds.Contains(budget.EventId))
                    .ToList();

                if (budgets.Count == 0)
                {
                    return [];
                }
            }

            var eventTitles = await LoadEventTitlesAsync(connection, cancellationToken);
            var expenseTotals = await LoadExpenseTotalsAsync(connection, from, to, cancellationToken);

            var rows = budgets
                .Select(budget =>
                {
                    expenseTotals.TryGetValue(budget.EventId, out var actualAmount);

                    string eventTitle = "Unknown event";
                    if (filteredEvents.TryGetValue(budget.EventId, out var filteredEventTitle))
                    {
                        eventTitle = filteredEventTitle.Title;
                    }
                    else
                    {
                        eventTitles.TryGetValue(budget.EventId, out var mappedTitle);
                        if (!string.IsNullOrWhiteSpace(mappedTitle))
                        {
                            eventTitle = mappedTitle;
                        }
                    }

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

    public async Task<IReadOnlyList<OrderCategoryCountDto>> GetOrderCountsByCategoryAsync(
        DateTimeOffset? from,
        DateTimeOffset? to,
        string? organizerId,
        string? status,
        CancellationToken cancellationToken)
    {
        ValidateDateRange(from, to);
        var filters = NormalizeFilters(organizerId, status);

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
            var filteredEvents = await LoadFilteredEventsAsync(connection, filters, null, null, cancellationToken);
            var filteredEventIds = new HashSet<string>(filteredEvents.Keys, StringComparer.OrdinalIgnoreCase);

            if (filters.HasEventFilter && filteredEvents.Count == 0)
            {
                return [];
            }

            var countsByEventId = await LoadConfirmedOrderCountsByEventIdAsync(connection, from, to, cancellationToken);
            if (countsByEventId.Count == 0)
            {
                return [];
            }

            var scopedCounts = filters.HasEventFilter
                ? countsByEventId.Where(entry => filteredEventIds.Contains(entry.Key))
                : countsByEventId;

            return scopedCounts
                .GroupBy(
                    entry => filteredEvents.TryGetValue(entry.Key, out var eventInfo)
                        ? eventInfo.Category
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

    public async Task<long> CreateBudgetAsync(CreateBudgetRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);

        await EnsureBudgetsTableAsync(connection, cancellationToken);

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

        await EnsureExpensesTableAsync(connection, cancellationToken);

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

    public async Task<string> ExportSummaryCsvAsync(
        DateTimeOffset? from,
        DateTimeOffset? to,
        string? organizerId,
        string? status,
        CancellationToken cancellationToken)
    {
        var summary = await GetSummaryAsync(from, to, organizerId, status, cancellationToken);

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

    private static void ValidateDateRange(DateTimeOffset? from, DateTimeOffset? to)
    {
        if (from.HasValue && to.HasValue && from.Value > to.Value)
        {
            throw new ReportDataException("Query parameter 'from' must be less than or equal to 'to'.", StatusCodes.Status400BadRequest);
        }
    }

    private static ReportFilters NormalizeFilters(string? organizerId, string? status)
    {
        var normalizedOrganizerId = string.IsNullOrWhiteSpace(organizerId)
            ? null
            : organizerId.Trim();

        var normalizedStatus = string.IsNullOrWhiteSpace(status)
            ? null
            : status.Trim().ToUpperInvariant();

        if (string.Equals(normalizedStatus, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            normalizedStatus = null;
        }

        return new ReportFilters(normalizedOrganizerId, normalizedStatus);
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

    private async Task<Dictionary<string, EventMetadata>> LoadFilteredEventsAsync(
        MySqlConnection connection,
        ReportFilters filters,
        DateTimeOffset? from,
        DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, "events", cancellationToken))
        {
            return new Dictionary<string, EventMetadata>(StringComparer.OrdinalIgnoreCase);
        }

        var eventIdColumn = await ResolveColumnAsync(connection, "events", ["id", "eventId", "event_id"], cancellationToken);
        if (string.IsNullOrWhiteSpace(eventIdColumn))
        {
            return new Dictionary<string, EventMetadata>(StringComparer.OrdinalIgnoreCase);
        }

        var titleColumn = await ResolveColumnAsync(connection, "events", ["title", "eventTitle", "name"], cancellationToken);
        var categoryColumn = await ResolveColumnAsync(connection, "events", ["category", "eventCategory", "event_category"], cancellationToken);
        var organizerColumn = await ResolveColumnAsync(connection, "events", ["organizerId", "organizer_id"], cancellationToken);
        var statusColumn = await ResolveColumnAsync(connection, "events", ["status", "Status"], cancellationToken);
        var dateColumn = await ResolveColumnAsync(connection, "events", DateColumnCandidates, cancellationToken);

        if (!string.IsNullOrWhiteSpace(filters.OrganizerId) && string.IsNullOrWhiteSpace(organizerColumn))
        {
            return new Dictionary<string, EventMetadata>(StringComparer.OrdinalIgnoreCase);
        }

        if (!string.IsNullOrWhiteSpace(filters.Status) && string.IsNullOrWhiteSpace(statusColumn))
        {
            return new Dictionary<string, EventMetadata>(StringComparer.OrdinalIgnoreCase);
        }

        var selectParts = new List<string> { $"`{eventIdColumn}`" };
        if (!string.IsNullOrWhiteSpace(titleColumn))
        {
            selectParts.Add($"`{titleColumn}`");
        }

        if (!string.IsNullOrWhiteSpace(categoryColumn))
        {
            selectParts.Add($"`{categoryColumn}`");
        }

        if (!string.IsNullOrWhiteSpace(organizerColumn))
        {
            selectParts.Add($"`{organizerColumn}`");
        }

        if (!string.IsNullOrWhiteSpace(statusColumn))
        {
            selectParts.Add($"`{statusColumn}`");
        }

        if (!string.IsNullOrWhiteSpace(dateColumn))
        {
            selectParts.Add($"`{dateColumn}`");
        }

        var sql = new StringBuilder($"SELECT {string.Join(",", selectParts)} FROM `events`");
        await using var command = connection.CreateCommand();
        AppendDateClause(sql, command, dateColumn, from, to);
        command.CommandText = sql.ToString();

        var events = new Dictionary<string, EventMetadata>(StringComparer.OrdinalIgnoreCase);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var index = 0;

            var eventId = reader.IsDBNull(index) ? string.Empty : reader.GetValue(index).ToString() ?? string.Empty;
            index++;

            if (string.IsNullOrWhiteSpace(eventId))
            {
                continue;
            }

            string title = "Unknown event";
            if (!string.IsNullOrWhiteSpace(titleColumn))
            {
                title = reader.IsDBNull(index) ? "Unknown event" : reader.GetValue(index).ToString() ?? "Unknown event";
                index++;
            }

            string category = "Uncategorized";
            if (!string.IsNullOrWhiteSpace(categoryColumn))
            {
                category = reader.IsDBNull(index) ? "Uncategorized" : reader.GetValue(index).ToString() ?? "Uncategorized";
                index++;
            }

            string organizer = string.Empty;
            if (!string.IsNullOrWhiteSpace(organizerColumn))
            {
                organizer = reader.IsDBNull(index) ? string.Empty : reader.GetValue(index).ToString() ?? string.Empty;
                index++;
            }

            string eventStatus = string.Empty;
            if (!string.IsNullOrWhiteSpace(statusColumn))
            {
                eventStatus = reader.IsDBNull(index) ? string.Empty : reader.GetValue(index).ToString() ?? string.Empty;
                index++;
            }

            if (!string.IsNullOrWhiteSpace(dateColumn))
            {
                // Date value has already been filtered in SQL when the column exists.
                index++;
            }

            if (!string.IsNullOrWhiteSpace(filters.OrganizerId) && !string.Equals(organizer, filters.OrganizerId, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(filters.Status) && !string.Equals(eventStatus, filters.Status, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            events[eventId] = new EventMetadata(
                string.IsNullOrWhiteSpace(title) ? "Unknown event" : title,
                string.IsNullOrWhiteSpace(category) ? "Uncategorized" : category);
        }

        return events;
    }

    private async Task<List<OrderSnapshot>> LoadOrderSnapshotsAsync(
        MySqlConnection connection,
        DateTimeOffset? from,
        DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, "orders", cancellationToken))
        {
            return [];
        }

        var eventIdColumn = await ResolveColumnAsync(connection, "orders", ["eventId", "event_id"], cancellationToken);
        if (string.IsNullOrWhiteSpace(eventIdColumn))
        {
            return [];
        }

        var statusColumn = await ResolveColumnAsync(connection, "orders", ["status", "Status"], cancellationToken);
        var amountColumn = await ResolveColumnAsync(connection, "orders", ["totalAmount", "total_amount", "amount"], cancellationToken);
        var dateColumn = await ResolveColumnAsync(connection, "orders", DateColumnCandidates, cancellationToken);

        var sql = new StringBuilder();
        sql.Append($"SELECT `{eventIdColumn}`");

        if (!string.IsNullOrWhiteSpace(statusColumn))
        {
            sql.Append($", `{statusColumn}`");
        }
        else
        {
            sql.Append(", ''");
        }

        if (!string.IsNullOrWhiteSpace(amountColumn))
        {
            sql.Append($", CAST(`{amountColumn}` AS DECIMAL(18,2))");
        }
        else
        {
            sql.Append(", 0");
        }

        sql.Append(" FROM `orders`");

        await using var command = connection.CreateCommand();
        AppendDateClause(sql, command, dateColumn, from, to);
        command.CommandText = sql.ToString();

        var rows = new List<OrderSnapshot>();

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var eventId = reader.IsDBNull(0) ? string.Empty : reader.GetValue(0).ToString() ?? string.Empty;
            var orderStatus = reader.IsDBNull(1) ? string.Empty : reader.GetValue(1).ToString() ?? string.Empty;
            var amount = reader.IsDBNull(2)
                ? 0m
                : Convert.ToDecimal(reader.GetValue(2), CultureInfo.InvariantCulture);

            rows.Add(new OrderSnapshot(eventId, orderStatus, amount));
        }

        return rows;
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

        if (from.HasValue)
        {
            sql.Append(separator).Append($"`{dateColumn}` >= @fromDate");
            command.Parameters.AddWithValue("@fromDate", from.Value.UtcDateTime);
            separator = " AND ";
        }

        if (to.HasValue)
        {
            sql.Append(separator).Append($"`{dateColumn}` <= @toDate");
            command.Parameters.AddWithValue("@toDate", to.Value.UtcDateTime);
        }
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

    private static async Task EnsureBudgetsTableAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS `budgets` (
                `id` BIGINT NOT NULL AUTO_INCREMENT,
                `eventId` VARCHAR(64) NOT NULL,
                `plannedAmount` DECIMAL(18,2) NOT NULL,
                `note` TEXT NULL,
                `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_budgets_event` (`eventId`)
            );
            """;

        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task EnsureExpensesTableAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS `expenses` (
                `id` BIGINT NOT NULL AUTO_INCREMENT,
                `eventId` VARCHAR(64) NOT NULL,
                `category` VARCHAR(120) NOT NULL,
                `amount` DECIMAL(18,2) NOT NULL,
                `note` TEXT NULL,
                `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_expenses_event` (`eventId`)
            );
            """;

        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(cancellationToken);
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
