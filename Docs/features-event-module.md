# Event Module Features

## Scope
The Event module covers event lifecycle management for organizers/admins and event discovery for public users and attendees.

## Service Ownership
- Primary service: Spring Boot (`Backend/spring-backend`)
- Supporting service: ASP.NET reporting (`Backend/dotnet-backend`) for event budget data
- Supporting service: Node notifications (`Backend/node-backend`) for order and reminder events
- Frontend pages: `Events`, `EventDetails`, `CreateEvent`, `Checkout`, `MyOrders`

## Core Capabilities
- Create event (`POST /api/events`) for `ADMIN` and `ORGANIZER`
- Update event (`PUT /api/events/{id}`) with ownership checks
- Delete event (`DELETE /api/events/{id}`) with ownership checks
- List/search events (`GET /api/events`) with query/category/status filtering
- Get event details (`GET /api/events/{id}`)
- Check venue availability (`GET /api/venues/availability`)

## Validation Rules
- Title: required, 3-140 chars, unique per organizer
- Category: required, 2-80 chars
- Description: required, 10-4000 chars
- Venue: required and active
- Schedule: `endAt` must be greater than `startAt`
- Schedule conflict: selected venue cannot overlap with non-cancelled events
- Capacity: minimum 1 and cannot be reduced below already-booked seats
- Price: minimum 0
- Status: `DRAFT`, `PUBLISHED`, `CLOSED`, `CANCELLED`

## Access Control
- Public users: can list and view published events
- Authenticated attendees: can book published events through orders module
- Organizer: can manage only own events
- Admin: can manage all events

## Cross-Module Integration
- Order flow references event capacity and seat availability (`/api/orders`)
- Notification flow is triggered after successful booking (`/api/v1/notifications/event-order-created`)
- Budget entry can be created for events (`POST /api/reports/budget`)

## Frontend Behavior
- `CreateEvent` performs pre-submit venue availability checks
- `Events` supports search/filter and role-aware draft visibility
- `EventDetails` supports organizer/admin edit/delete controls
- `Checkout` places ticket orders and triggers notification pipeline
