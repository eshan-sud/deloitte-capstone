# Unified API Response Envelope

## Canonical Envelope

All services should return the same top-level contract for JSON responses.

```json
{
  "success": true,
  "message": "Human-readable summary",
  "data": {},
  "errors": null,
  "timestamp": "2026-03-17T12:00:00Z"
}
```

## Field Definitions

- `success` (`boolean`): request outcome
- `message` (`string`): summary for client UX/logging
- `data` (`object|null`): payload for successful responses
- `errors` (`object|array|string|null`): validation or business errors
- `timestamp` (`string`, ISO-8601): response generation time

## Status By Service

- Spring Boot: already matches canonical fields via `ApiResponse<T>`
- ASP.NET: already matches canonical fields via `ApiEnvelope<T>`
- Node: returns `success`, `message`, and optional `data` or `error`; should continue converging to include `errors` and `timestamp` for all responses

## Error Handling Guidance

- Validation errors: `400` with `errors` as field-level details
- Unauthorized/forbidden: `401/403` with clear `message`
- Not found: `404` with resource-specific `message`
- Unexpected failure: `500` with safe generic `message`

## Frontend Parsing Rules

- Prefer reading `data` when present
- Always surface `message` on failures
- Fall back to `errors` details if available
