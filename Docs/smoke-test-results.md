# Smoke Test Results

Date: 2026-03-17

## Environment Notes

- Docker Desktop was unavailable (`dockerDesktopLinuxEngine` pipe not found), so smoke tests were executed against locally started services where possible.
- MongoDB was reachable on `localhost:27017`.

## Executed Smoke Checks

### Spring backend journeys

Command:

- `mvn -q test -DskipITs`

Coverage from `IntegrationFlowTest`:

- Register -> Forgot Password -> Reset Password -> Login with updated password
- Venue availability conflict detection

Result:

- `SPRING_TEST_EXIT=0`

### ASP.NET reporting guard

Local run + probes:

- `GET /api/reports/health`
- `GET /api/reports/summary` without key
- `GET /api/reports/summary` with `X-Admin-Key: dev-admin-key-change-me`

Result:

- `HEALTH=200`
- `SUMMARY_NO_KEY=401`
- `SUMMARY_WITH_KEY=200`

### Node notification journey

Local run + probes:

- `GET /api/health`
- `POST /api/v1/notifications/test`
- `POST /api/v1/notifications/reminder` (in-app flow)
- `GET /api/v1/notifications/my?recipientUserId=smoke-user`

Result:

- `NODE_HEALTH_SUCCESS=True`
- `NODE_TEST_SUCCESS=True`
- `NODE_REMINDER_SUCCESS=True`
- `NODE_MY_COUNT=1`

## Additional Build/Config Checks

- `docker compose config` (pass)
- Frontend production build: `npm run build` (pass)
- ASP.NET build: `dotnet build` (pass)

## Conclusion

Core user journeys for auth/event flow, notification flow, and admin reporting access guard were smoke-tested successfully in local execution mode.
