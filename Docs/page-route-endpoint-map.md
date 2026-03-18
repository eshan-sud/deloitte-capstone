# Frontend Route To Endpoint Map

## Route Mapping

| Frontend Route        | Page               | Backend Service Calls                                                                                                                                            |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /                     | Home               | Spring: `GET /events`                                                                                                                                            |
| /events               | Events             | Spring: `GET /events`                                                                                                                                            |
| /events/:eventId      | EventDetails       | Spring: `GET /events/{id}`; Spring: `DELETE /events/{id}` (admin/organizer)                                                                                      |
| /events/:eventId/edit | CreateEvent (edit) | Spring: `GET /venues`, `GET /events/{id}`, `GET /venues/availability`, `PUT /events/{id}`                                                                        |
| /create-event         | CreateEvent        | Spring: `GET /venues`, `GET /venues/availability`, `POST /events`; ASP.NET: `POST /reports/budget` (optional budget sync)                                        |
| /checkout/:eventId    | Checkout           | Spring: `GET /events/{id}`, `POST /orders`; Node: `POST /v1/notifications/event-order-created`                                                                   |
| /my-orders            | MyOrders           | Spring: `GET /orders/my`, `PATCH /orders/{id}/cancel`                                                                                                            |
| /notifications        | Notifications      | Node: `GET /v1/notifications/my`, `PATCH /v1/notifications/{id}/read`, `PATCH /v1/notifications/read-all`                                                        |
| /dashboard            | Dashboard          | Spring: `GET /events`, `GET /orders/my`, `GET /events/{id}`; ASP.NET: `GET /reports/summary`, `GET /reports/orders-by-category`, `GET /reports/budget-vs-actual` |
| /admin/reports        | AdminReports       | ASP.NET: `GET /reports/summary`, `GET /reports/orders-by-category`, `GET /reports/budget-vs-actual`                                                              |
| /admin/users          | UserManagement     | Spring: `GET /auth/users`, `PATCH /auth/users/{id}/status`, `PATCH /auth/users/{id}/role`                                                                        |
| /profile              | Profile            | Spring: `GET /auth/me`, `PUT /users/me`                                                                                                                          |
| /login                | Login              | Spring: `POST /auth/login`                                                                                                                                       |
| /signup               | SignUp             | Spring: `POST /auth/register`                                                                                                                                    |
| /forgot-password      | ForgotPassword     | Spring: `POST /auth/forgot-password`                                                                                                                             |
| /reset-password       | ResetPassword      | Spring: `POST /auth/reset-password`                                                                                                                              |
| /admin                | Redirect           | No API call (redirect to `/admin/reports`)                                                                                                                       |
| \*                    | NotFound           | No API call                                                                                                                                                      |

## Coverage Result

All app routes in `Frontend/src/App.jsx` are mapped to either:

- One or more backend endpoints, or
- Explicitly no endpoint for redirect/not-found routes.
