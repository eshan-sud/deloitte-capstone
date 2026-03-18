# OpenAPI Spec Bundle

This folder contains service-level OpenAPI specs for the capstone backend services.

## Files

- `spring-api.openapi.yaml` - Spring auth, users, events, venues, orders
- `node-notifications.openapi.yaml` - Node notification and logs endpoints
- `dotnet-reports.openapi.yaml` - ASP.NET reporting endpoints

## Notes

- Spring and Node specs are maintained as source-controlled YAML snapshots.
- ASP.NET spec aligns with the OpenAPI surface exposed by `MapOpenApi()` in development.
- Route/security details match current implementation as of March 2026.
