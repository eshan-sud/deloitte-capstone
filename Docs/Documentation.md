## Frontend URLs

Base frontend URL: http://localhost:5173

| URL                   | Access           | What this page does          |
| --------------------- | ---------------- | ---------------------------- |
| /                     | Public           | Home page                    |
| /events               | Public           | View and filter events       |
| /events/:eventId      | Public           | View event details           |
| /login                | Public           | Login page                   |
| /signup               | Public           | Signup page                  |
| /forgot-password      | Public           | Request password reset token |
| /reset-password       | Public           | Reset password using token   |
| /dashboard            | Logged-in user   | Role-based dashboard         |
| /create-event         | ADMIN, ORGANIZER | Create new event             |
| /events/:eventId/edit | ADMIN, ORGANIZER | Edit existing event          |
| /checkout/:eventId    | Logged-in user   | Book tickets for an event    |
| /my-orders            | Logged-in user   | View user orders             |
| /notifications        | Logged-in user   | View notifications           |
| /profile              | Logged-in user   | Update profile details       |
| /admin/reports        | ADMIN only       | View reports and KPIs        |
| /admin/users          | ADMIN only       | Manage users                 |
| /admin                | ADMIN only       | Redirects to /admin/reports  |
| \*                    | Public           | Not found page               |

## Backend Endpoints

### Spring Boot service

Base URL: http://localhost:8080/api

For protected routes, send Authorization header as Bearer token.

| Method | Endpoint                | Access                         | Purpose                   |
| ------ | ----------------------- | ------------------------------ | ------------------------- |
| POST   | /auth/register          | Public                         | Register user             |
| POST   | /auth/login             | Public                         | Login user                |
| POST   | /auth/forgot-password   | Public                         | Generate demo reset token |
| POST   | /auth/reset-password    | Public                         | Reset password            |
| GET    | /auth/me                | Bearer                         | Get current user          |
| GET    | /auth/health            | Public                         | Health check              |
| GET    | /auth/users             | Bearer (ADMIN)                 | List users                |
| PATCH  | /auth/users/{id}/status | Bearer (ADMIN)                 | Activate/deactivate user  |
| PATCH  | /auth/users/{id}/role   | Bearer (ADMIN)                 | Update user role          |
| PUT    | /users/me               | Bearer                         | Update profile            |
| GET    | /users/{id}             | Bearer (ADMIN)                 | Get user by id            |
| GET    | /venues                 | Public                         | List venues               |
| GET    | /venues/availability    | Public                         | Check venue availability  |
| GET    | /events                 | Public                         | List/search events        |
| GET    | /events/{id}            | Public                         | Get event details         |
| POST   | /events                 | Bearer (ADMIN/ORGANIZER)       | Create event              |
| PUT    | /events/{id}            | Bearer (ADMIN/ORGANIZER owner) | Update event              |
| DELETE | /events/{id}            | Bearer (ADMIN/ORGANIZER owner) | Delete event              |
| POST   | /orders                 | Bearer                         | Place order               |
| GET    | /orders/my              | Bearer                         | Get my orders             |
| GET    | /orders/{id}            | Bearer (owner/ADMIN)           | Get order by id           |
| PATCH  | /orders/{id}/cancel     | Bearer (owner/ADMIN)           | Cancel order              |

### Node notification service

Base URL: http://localhost:4000/api

| Method | Endpoint                              | Access                       | Purpose                        |
| ------ | ------------------------------------- | ---------------------------- | ------------------------------ |
| GET    | /health                               | Public                       | Health check                   |
| POST   | /v1/notifications/test                | Public                       | Test notification endpoint     |
| POST   | /v1/notifications/send                | Public (service use)         | Send notification              |
| POST   | /v1/notifications/event-order-created | Public (service use)         | Send booking notifications     |
| POST   | /v1/notifications/reminder            | Public (service use)         | Send reminder notification     |
| GET    | /v1/notifications/my                  | Public with recipient params | List user notifications        |
| PATCH  | /v1/notifications/{id}/read           | Public with identity payload | Mark one notification as read  |
| PATCH  | /v1/notifications/read-all            | Public with identity payload | Mark all notifications as read |
| GET    | /v1/notifications/logs                | Public                       | List notification logs         |

### ASP.NET reporting service

Base URL: http://localhost:5107/api

For protected report read routes, send X-Admin-Key header.

| Method | Endpoint                    | Access          | Purpose                |
| ------ | --------------------------- | --------------- | ---------------------- |
| GET    | /reports/health             | Public          | Health check           |
| GET    | /reports/health/live        | Public          | Liveness check         |
| GET    | /reports/summary            | X-Admin-Key     | KPI summary            |
| GET    | /reports/budget-vs-actual   | X-Admin-Key     | Budget variance report |
| GET    | /reports/orders-by-category | X-Admin-Key     | Orders by category     |
| GET    | /reports/export?format=csv  | X-Admin-Key     | Export report as CSV   |
| POST   | /reports/budget             | Public/internal | Create budget entry    |
| POST   | /reports/expenses           | Public/internal | Create expense entry   |

## Database Schema

Database name: event_management

### Tables and purpose

| Table         | Purpose                                                 | Primary key |
| ------------- | ------------------------------------------------------- | ----------- |
| users         | Stores user accounts, roles, and active status          | id          |
| venues        | Stores venue details and capacity                       | id          |
| events        | Stores event details, organizer, venue, and seat status | id          |
| orders        | Stores ticket orders and ticket codes                   | id          |
| notifications | Stores notification logs used in reporting              | id          |
| budgets       | Stores planned budget values per event                  | id          |
| expenses      | Stores actual expense entries per event                 | id          |

### Main foreign key relationships

- events.venue_id -> venues.id
- events.organizer_id -> users.id
- orders.user_id -> users.id
- orders.event_id -> events.id
- budgets.event_id -> events.id
- expenses.event_id -> events.id

### Important enums

- users.role: ADMIN, ORGANIZER, CUSTOMER
- events.status: DRAFT, PUBLISHED, CLOSED, CANCELLED
- orders.status: PENDING, CONFIRMED, CANCELLED

### Setup note

Run Database/queries.sql to create the schema, indexes, foreign keys, and seed rows.
