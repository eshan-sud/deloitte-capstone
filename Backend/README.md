# Backend Services

This directory contains the three backend services used by the EventNest capstone.

## Services

- `spring-backend` (Java / Spring Boot)
	- Auth and user management
	- Events and venues
	- Orders and ticketing

- `node-backend` (Node.js / Express)
	- Notification service
	- Event order notifications
	- Reminder notifications
	- Notification logs and read tracking

- `dotnet-backend` (ASP.NET Core)
	- Reporting summary and KPIs
	- Budget and expense APIs
	- Budget-vs-actual and order category reports
	- CSV export

## Run Locally

From repository root:

```bash
npm run start:spring
npm run start:node
npm run start:dotnet
```

Or run all services (including frontend):

```bash
npm run start-project
```

## Health Endpoints

- Spring: `http://localhost:8080/api/auth/health`
- Node: `http://localhost:4000/api/health`
- ASP.NET: `http://localhost:5107/api/reports/health`

## Docker

Each service has its own Dockerfile:

- `Backend/spring-backend/Dockerfile`
- `Backend/node-backend/Dockerfile`
- `Backend/dotnet-backend/Dockerfile`

To run the complete stack:

```bash
docker compose up --build
```

## Environment Notes

- Node uses `Backend/node-backend/.env`.
- Spring and ASP.NET connection values are set in `docker-compose.yml` for compose runs.
- Database setup scripts are in `Database/queries.sql`.
