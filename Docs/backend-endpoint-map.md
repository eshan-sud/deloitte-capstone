# Backend Endpoint Map

## Spring Boot (`http://localhost:8080/api`)

| Method | Path                    | Auth                           | Description                     |
| ------ | ----------------------- | ------------------------------ | ------------------------------- |
| POST   | /auth/register          | Public                         | Register user                   |
| POST   | /auth/login             | Public                         | Login and return JWT            |
| POST   | /auth/forgot-password   | Public                         | Generate demo reset token       |
| POST   | /auth/reset-password    | Public                         | Reset password with token       |
| GET    | /auth/me                | Bearer                         | Get current user                |
| GET    | /auth/health            | Public                         | Auth service health             |
| GET    | /auth/users             | Bearer (Admin)                 | List users                      |
| PATCH  | /auth/users/{id}/status | Bearer (Admin)                 | Activate/deactivate user        |
| PATCH  | /auth/users/{id}/role   | Bearer (Admin)                 | Update user role                |
| PUT    | /users/me               | Bearer                         | Update profile                  |
| GET    | /users/{id}             | Bearer (Admin)                 | User details                    |
| GET    | /venues                 | Public                         | List venues                     |
| GET    | /venues/availability    | Public                         | Check venue time-slot conflicts |
| GET    | /events                 | Public                         | List/search events              |
| GET    | /events/{id}            | Public                         | Event details                   |
| POST   | /events                 | Bearer (Admin/Organizer)       | Create event                    |
| PUT    | /events/{id}            | Bearer (Admin/Owner Organizer) | Update event                    |
| DELETE | /events/{id}            | Bearer (Admin/Owner Organizer) | Delete event                    |
| POST   | /orders                 | Bearer                         | Place order                     |
| GET    | /orders/my              | Bearer                         | My orders                       |
| GET    | /orders/{id}            | Bearer (Owner/Admin)           | Order details                   |
| PATCH  | /orders/{id}/cancel     | Bearer (Owner/Admin)           | Cancel order                    |

## Node Notification Service (`http://localhost:4000/api`)

| Method | Path                                  | Auth                                 | Description                         |
| ------ | ------------------------------------- | ------------------------------------ | ----------------------------------- |
| GET    | /health                               | Public                               | Notification service health         |
| POST   | /v1/notifications/test                | Public                               | Test notification enqueue           |
| POST   | /v1/notifications/send                | Public (service-to-service expected) | Send notification                   |
| POST   | /v1/notifications/event-order-created | Public (service-to-service expected) | Trigger order-created notifications |
| POST   | /v1/notifications/reminder            | Public (service-to-service expected) | Trigger reminder notification       |
| GET    | /v1/notifications/my                  | Public with identity params          | List user notifications             |
| PATCH  | /v1/notifications/{id}/read           | Public with identity payload         | Mark one notification read          |
| PATCH  | /v1/notifications/read-all            | Public with identity payload         | Mark all notifications read         |
| GET    | /v1/notifications/logs                | Public                               | Notification log listing            |

## ASP.NET Reporting Service (`http://localhost:5107/api`)

| Method | Path                        | Auth            | Description              |
| ------ | --------------------------- | --------------- | ------------------------ |
| GET    | /reports/health             | Public          | Reporting service health |
| GET    | /reports/health/live        | Public          | Liveness probe           |
| GET    | /reports/summary            | `X-Admin-Key`   | KPI summary              |
| GET    | /reports/budget-vs-actual   | `X-Admin-Key`   | Budget variance report   |
| GET    | /reports/orders-by-category | `X-Admin-Key`   | Category order breakdown |
| GET    | /reports/export?format=csv  | `X-Admin-Key`   | CSV export               |
| POST   | /reports/budget             | Public/internal | Create budget entry      |
| POST   | /reports/expenses           | Public/internal | Create expense entry     |
