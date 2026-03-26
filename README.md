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

`docker-compose.yml` reads root-level environment variables for MySQL, Spring, ASP.NET, Node DB URI, and frontend build API URLs.

### Docker Setup

**Prerequisites:**

- Docker Desktop (Windows/Mac) or Docker + Docker Compose (Linux)
- Verify installation:
  ```powershell
  docker --version
  docker compose --version
  ```

### Docker Quick Start

1. **Create environment file:**

   ```powershell
   copy .env.example .env
   ```

2. **Start all services (builds images if needed):**

   ```powershell
   docker compose up -d
   ```

3. **Verify all services are running (wait 30-50 seconds for health checks):**

   ```powershell
   docker compose ps
   ```

   Expected: 6 containers with status `healthy` or `running`

4. **Access services:**
   - **Frontend:** http://localhost:5173
   - **Spring API:** http://localhost:8080/api
   - **ASP.NET API:** http://localhost:5107/api (requires X-Admin-Key header)
   - **Node API:** http://localhost:4000/api

### Docker Usage Commands

**View real-time logs:**

```powershell
docker compose logs -f                    # All services
docker compose logs -f dotnet             # Specific service (dotnet, spring, node, mysql, mongodb, frontend)
```

**Test individual services:**

```powershell
# Spring health
docker exec event-management-spring curl http://localhost:8080/api/health

# ASP.NET health (with admin key)
docker exec event-management-dotnet curl -H "X-Admin-Key: dev-reporting-admin-key-12345" http://localhost:5107/api/health

# Node health
docker exec event-management-node curl http://localhost:4000/api/health

# MySQL connection
docker exec event-management-mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SELECT 1"
```

**Stop all services:**

```powershell
docker compose down
```

**Stop and remove volumes (clean reset - WARNING: clears DB data):**

```powershell
docker compose down -v
```

**Rebuild images after code changes:**

```powershell
docker compose up -d --build
```

**View service status in detail:**

```powershell
docker compose ps -a                     # All containers
docker stats                             # Resource usage (CPU, memory)
```

**Access service containers directly:**

```powershell
docker exec -it event-management-mysql bash        # MySQL shell
docker exec -it event-management-spring bash       # Spring container
docker exec -it event-management-dotnet bash       # ASP.NET container
```

### Database Access from Docker

**MySQL:**

```powershell
docker exec -it event-management-mysql mysql -u root -pdeloitteCapstone2024 event_db
```

**MongoDB:**

```powershell
docker exec -it event-management-mongo mongosh
```

### Troubleshooting

**Services not becoming healthy:**

1. Check logs: `docker compose logs -f [service-name]`
2. Ensure `.env` file is correctly configured
3. Verify ports 3307, 27017, 5107, 8080, 4000, 5173 are not in use
4. Restart: `docker compose down && docker compose up -d`

**Database connection errors:**

- Ensure wait-for-it scripts complete successfully
- Check `docker compose logs mysql` and `docker compose logs spring`
- MySQL may take 10-15 seconds to fully initialize

**Admin key authentication errors:**

- Use correct key: `dev-reporting-admin-key-12345` (from `.env`)
- Header format: `X-Admin-Key: dev-reporting-admin-key-12345`
- Verify in ASP.NET requests only (Spring uses JWT, Node is public)

## Module List

| Module                                 | Owner Service                          | Supporting Services                                                  | Frontend Surfaces                                                                      |
| -------------------------------------- | -------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Auth and User Management               | Spring Boot (`Backend/spring-backend`) | -                                                                    | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/profile`, `/admin/users` |
| Event Management (CRUD + availability) | Spring Boot (`Backend/spring-backend`) | ASP.NET budget entries, Node notifications on downstream order flows | `/events`, `/events/:eventId`, `/create-event`, `/events/:eventId/edit`                |
| Order and Ticketing                    | Spring Boot (`Backend/spring-backend`) | Node notifications                                                   | `/checkout/:eventId`, `/my-orders`                                                     |
| Notifications and Logs                 | Node.js (`Backend/node-backend`)       | Triggered by Spring order flow                                       | `/notifications`                                                                       |
| Reporting and Finance                  | ASP.NET (`Backend/dotnet-backend`)     | MySQL event/order/user data from Spring domain                       | `/admin/reports`, organizer budget sync from create-event                              |

## Features

- Role-based platform with ADMIN, ORGANIZER, and CUSTOMER experiences
- Secure authentication with signup, login, JWT sessions, and profile management
- Event lifecycle management with create, edit, delete, publish states, and venue availability checks
- Public event discovery with event listing, details view, and filtering/search support
- Ticket booking and order management with checkout, order history, and cancellation flow
- Oversell protection through capacity validation during order placement
- Notification service with booking confirmations, reminders, read-state updates, and notification logs
- Admin reporting with KPI summaries, budget vs actual tracking, expense entries, and CSV export
- Polyglot microservice architecture using Spring Boot, Node.js, and ASP.NET with React frontend
- Dockerized local deployment using a single compose workflow with MySQL and MongoDB

## Documentation Index

- Diagrams:
  - `Docs/Diagrams/ER Diagram.png`
  - `Docs/Diagrams/HLD.png`
  - `Docs/Wireframes/`
- OpenAPI Specifications: `Docs/OpenAPI/`
- Postman:
  - `Docs/Postman/All-Services.postman_collection.json`
  - `Docs/Postman/Local.postman_environment.json`
- Screenshots: `Docs/Screenshots/`
- Documentation - Frontend/Backend/Database: `Docs/Documentation.md`
- User Flows: `Docs/User Flows/`
- Testing Reports: `Docs/Testing.md`

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

---
