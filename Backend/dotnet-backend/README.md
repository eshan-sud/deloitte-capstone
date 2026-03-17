# ASP.NET Backend - Reporting Service

Production-grade ASP.NET Core Web API service for Event Management reporting & budget/expense administration.

## Tech

- .NET 10
- ASP.NET Core Web API
- OpenAPI (`/openapi/v1.json` in development)

## Endpoints

- `GET /api/reports/health`
- `GET /api/reports/health/live`
- `GET /api/reports/summary?from=<iso>&to=<iso>`
- `GET /api/reports/budget-vs-actual?from=<iso>&to=<iso>`
- `POST /api/reports/budget`
- `POST /api/reports/expenses`
- `GET /api/reports/export?format=csv&from=<iso>&to=<iso>`

## Run

```bash
cd Backend/dotnet-backend
dotnet restore
dotnet build
dotnet run
```

Default local URLs are printed by `dotnet run`.

## Notes

- MySQL-backed aggregation is implemented via `MySqlConnector`.
- `ConnectionStrings:DefaultConnection` in `appsettings.json` must point to your MySQL instance.
- CORS is configured for `http://localhost:3000` & `http://localhost:5173`.
- Date filters are optional & accepted in ISO-8601 format.
- API responses use a consistent envelope with `success`, `message`, `data`, & `timestamp`.
- Export currently supports CSV format.

## Expected Tables

The reporting service reads from (and writes to) the following tables when present:

- `users`
- `events`
- `orders`
- `notifications`
- `budgets`
- `expenses`

If a table is missing, read endpoints degrade gracefully where possible, while write endpoints return a clear error response.
