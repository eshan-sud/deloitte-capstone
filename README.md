# Event Management System

A polyglot event management system with admin, organiser, & customer roles, built for the purpose of completing the Deloitte Capstone

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

## Comands

============================================================================
SERVICE STARTUP COMMAND
============================================================================
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

============================================================================
INDIVIDUAL SERVICE STARTUP (if needed)
============================================================================

- Spring Boot: `npm run start:spring` (or: cd Backend/spring-backend && mvn spring-boot:run)
- ASP.NET: `npm run start:dotnet` (or: cd Backend/dotnet-backend && dotnet run)
- Node: `npm run start:node` (or: cd Backend/node-backend && npm start)
- Frontend: `npm run start:frontend` (or: cd Frontend && npm run dev)

============================================================================
BUILD COMMANDS
============================================================================

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
