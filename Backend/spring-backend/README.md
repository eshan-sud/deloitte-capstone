# Spring Backend - Auth, Events, & Orders

Production-grade Spring Boot service for authentication, user management, event scheduling, venue catalog, & ticket orders.

## Features

- JWT registration, login, & current-user flow
- Profile update plus admin user management for status & role changes
- Venue listing & event CRUD with organizer/admin authorization
- Event filtering by query, category, & status
- Order placement, history, detail lookup, cancellation, & seat-capacity protection
- Unified API response envelope with centralized exception handling
- Seeded demo users & venues for local development

## Tech

- Java 25
- Spring Boot 4.1.0-M2
- Spring Security + JWT
- Spring Data JPA + Hibernate
- H2 in-memory database by default for local runtime
- MySQL via environment variables for persistent environments

## Seeded Accounts

- `admin@eventnest.io` / `Admin@123`
- `organizer@eventnest.io` / `Organizer@123`
- `customer@eventnest.io` / `Customer@123`

## Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/health`

### Users

- `PUT /api/users/me`
- `GET /api/auth/users`
- `PATCH /api/auth/users/{id}/status`
- `PATCH /api/auth/users/{id}/role`

### Events & Venues

- `GET /api/venues`
- `GET /api/events`
- `GET /api/events/{id}`
- `POST /api/events`
- `PUT /api/events/{id}`
- `DELETE /api/events/{id}`

### Orders

- `POST /api/orders`
- `GET /api/orders/my`
- `GET /api/orders/{id}`
- `PATCH /api/orders/{id}/cancel`

## Run Locally

```bash
cd Backend/spring-backend
mvn clean package
java -jar target/event-auth-service-1.0.0.jar
```

The default local configuration uses an in-memory H2 database so the service starts without external setup.

## Use MySQL Instead Of H2

Set these environment variables before starting the service:

- `SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/event_management?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
- `SPRING_DATASOURCE_USERNAME=root`
- `SPRING_DATASOURCE_PASSWORD=your-password`
- `SPRING_DATASOURCE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver`
- `SPRING_JPA_HIBERNATE_DIALECT=org.hibernate.dialect.MySQLDialect`

## Notes

- Base path is `/api`
- CORS allows `http://localhost:3000` & `http://localhost:5173`
- API responses use `success`, `message`, `data`, `errors`, & `timestamp`
- H2 data resets when the process stops unless you point the service to MySQL
