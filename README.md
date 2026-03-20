# Deloitte Capstone Project - Event Management System (EventNest)

![Platform](https://img.shields.io/badge/platform-Web%20%7C%20API-blue)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB)
![Backend](https://img.shields.io/badge/backend-Spring%20Boot%20%7C%20Node.js%20%7C%20ASP.NET-6DB33F)
![Database](https://img.shields.io/badge/database-MySQL%20%7C%20MongoDB%20%7C%20H2-4479A1)
![DevOps](https://img.shields.io/badge/devops-Docker%20%2F%20Compose-2496ED)

A polyglot event management system with admin, organizer, & customer roles, built for the purpose of completing the Deloitte Capstone

- **Spring Boot (Java):**
  - Auth Service (User registration, login, JWT, profile, roles)
  - Event Service (Event CRUD, venue management, event search)
  - Order/Ticketing Service (Attendee registration, order placement, order history, cancellation)
- **Node.js (Express):**
  - Notification Service (Booking/registration notifications, reminders, notification logs)
- **ASP.NET (C#):**
  - Reporting Service (Admin KPIs, budget/expense tracking, summary/variance reports)
- **Frontend:** React + Vite (Role-based portals, all UI, API integration); Tailwind CSS
- **Database:** MySQL (primary, all services); MongoDB; H2 (spring boot - local storage)
- **Docker + AWS:** Deployment
- **GitHub Actions:** CI/CD

---

## Technologies used

- Version Control: git
- API Testing: Postman
- IDE: VS Code
- Frontend: React + Tailwind CSS
- Backend: Spring Boot + Node.js + ASP.NET
- Database: MySQL for persistent environments, H2 for local Spring smoke testing
- Deployment: Dockerized local environment

## Docker Compose Environment

`docker-compose.yml` now reads root-level environment variables for MySQL, Spring, ASP.NET, Node DB URI, and frontend build API URLs.

Create a root `.env` from `.env.example` before running compose:

```bash
copy .env.example .env
```

Then start the full stack:

```bash
docker compose up --build
```

## Frozen Module List & Ownership

| Module                                 | Owner Service                          | Supporting Services                                                  | Frontend Surfaces                                                                      |
| -------------------------------------- | -------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Auth and User Management               | Spring Boot (`Backend/spring-backend`) | -                                                                    | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/profile`, `/admin/users` |
| Event Management (CRUD + availability) | Spring Boot (`Backend/spring-backend`) | ASP.NET budget entries, Node notifications on downstream order flows | `/events`, `/events/:eventId`, `/create-event`, `/events/:eventId/edit`                |
| Order and Ticketing                    | Spring Boot (`Backend/spring-backend`) | Node notifications                                                   | `/checkout/:eventId`, `/my-orders`                                                     |
| Notifications and Logs                 | Node.js (`Backend/node-backend`)       | Triggered by Spring order flow                                       | `/notifications`                                                                       |
| Reporting and Finance                  | ASP.NET (`Backend/dotnet-backend`)     | MySQL event/order/user data from Spring domain                       | `/admin/reports`, organizer budget sync from create-event                              |

## Documentation Index

- Event module details: `Docs/features-event-module.md`
- Backend endpoint map: `Docs/backend-endpoint-map.md`
- Frontend route to endpoint map: `Docs/page-route-endpoint-map.md`
- Unified API envelope definition: `Docs/api-response-envelope.md`
- Auth request/response samples: `Docs/auth-request-response-samples.md`
- OpenAPI bundle: `Docs/openapi/`

## Comands

### SERVICE STARTUP COMMAND

From project root:

- npm install (if you haven't already)
- npm run install-all (install all service dependencies)
- npm run start-project (starts all 4 services in parallel)

Services will be available at:

- Frontend: http://localhost:5173
- Spring: http://localhost:8080/api
- ASP.NET: http://localhost:5107/api
- Node: http://localhost:4000/api

> Note: Stop all services: Press Ctrl+C in the terminal

### INDIVIDUAL SERVICE STARTUP (if needed)

- Spring Boot: `npm run start:spring` (or: cd Backend/spring-backend && mvn spring-boot:run)
- ASP.NET: `npm run start:dotnet` (or: cd Backend/dotnet-backend && dotnet run)
- Node: `npm run start:node` (or: cd Backend/node-backend && npm start)
- Frontend: `npm run start:frontend` (or: cd Frontend && npm run dev)

### BUILD COMMANDS

- Build all: `npm run build-all`
- Build frontend: `npm run build:frontend` (or: `cd Frontend && npm run build`)
- Build Spring: `npm run build:spring` (or: `cd Backend/spring-backend && mvn -DskipTests package`)
- Build ASP.NET: `npm run build:dotnet` (or: `cd Backend/dotnet-backend && dotnet build`)
- Check Node: `npm run build:node` (or: `cd Backend/node-backend && node --check src/server.js`)

## Setup

- Check if relevant technolgies have been installed:

```bash
node -v
npm -v
java -version
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin" && mysql -u root -p -e "SELECT VERSION();"
dotnet --version
docker --version
```

- Copy project file locally:

```bash
git clone https://github.com/eshan-sud/deloitte-capstone
cd deloitte-capstone
```

- Frontend:

```bash
cd Frontend
npm install
npm run dev
cd ..
```

- Backend:

```bash
cd Backend/spring-backend
mvn clean install
mvn spring-boot:run
# mvn clean package
# java -jar target/event-auth-service-1.0.0.jar
cd ..
```

Spring Boot uses an in-memory H2 database by default for local startup. Set `SPRING_DATASOURCE_*` & `SPRING_JPA_HIBERNATE_DIALECT` environment variables to run it against MySQL instead.

```bash
cd Backend/node-backend
npm install
npm run dev
cd ..
```

```bash
cd Backend/dotnet-backend
dotnet restore
dotnet run
cd ..
```

## High-Level Feature Requirements:

## Documentation:

- Features of the application with different module details
- Screenshots of the UI
- Implemented backend endpoints
- Frontend URLs & pages
- Link of github repository
- ER diagram
- Wireframe design documents
- UserFlow documents

- OpenAPI spec
- Postman collection
- curl examples
- HLD diagram
- LLD class diagrams

---
