# Frontend (React + Vite)

This is the EventNest client application.

## Main Routes

- `/` Home
- `/events` Event listing
- `/events/:eventId` Event details
- `/create-event` Create/Edit event (organizer/admin)
- `/dashboard` Role-aware dashboard
- `/notifications` Notification center
- `/my-orders` Customer order history
- `/profile` Profile management
- `/admin/reports` Reporting dashboard
- `/admin/users` User management
- `/login` Sign in
- `/signup` Registration
- `/forgot-password` Forgot password
- `/reset-password` Reset password

## API Configuration

The frontend reads these environment variables:

- `VITE_SPRING_API_URL` (default: `http://localhost:8080/api`)
- `VITE_ASPNET_API_URL` (default: `http://localhost:5107/api`)
- `VITE_NODE_API_URL` (default: `http://localhost:4000/api`)

## Development

```bash
cd Frontend
npm install
npm run dev
```

App URL: `http://localhost:5173`

## Production Build

```bash
cd Frontend
npm run build
npm run preview
```

## Docker

`Frontend/Dockerfile` builds the Vite app and serves it through Nginx.

Use root compose for full stack run:

```bash
docker compose up --build
```
