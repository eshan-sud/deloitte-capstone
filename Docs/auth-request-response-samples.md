# Auth Request/Response Samples

Base URL: `http://localhost:8080/api`

## Register

### Request

```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "Taylor",
  "lastName": "Tester",
  "email": "taylor.tester@example.com",
  "password": "Starter@123"
}
```

### Success Response (`201`)

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "<jwt>",
    "user": {
      "id": 12,
      "firstName": "Taylor",
      "lastName": "Tester",
      "email": "taylor.tester@example.com",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-03-17T10:30:00",
      "updatedAt": "2026-03-17T10:30:00"
    }
  },
  "errors": null,
  "timestamp": "2026-03-17T10:30:00Z"
}
```

## Login

### Request

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@eventnest.io",
  "password": "Admin@123"
}
```

### Success Response (`200`)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt>",
    "user": {
      "id": 1,
      "firstName": "Ava",
      "lastName": "Admin",
      "email": "admin@eventnest.io",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-03-17T10:00:00",
      "updatedAt": "2026-03-17T10:00:00"
    }
  },
  "errors": null,
  "timestamp": "2026-03-17T10:31:00Z"
}
```

## Get Current User

### Request

```http
GET /auth/me
Authorization: Bearer <jwt>
```

### Success Response (`200`)

```json
{
  "success": true,
  "message": "Current user fetched",
  "data": {
    "id": 1,
    "firstName": "Ava",
    "lastName": "Admin",
    "email": "admin@eventnest.io",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-03-17T10:00:00",
    "updatedAt": "2026-03-17T10:00:00"
  },
  "errors": null,
  "timestamp": "2026-03-17T10:32:00Z"
}
```

## Forgot Password

### Request

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "taylor.tester@example.com"
}
```

### Success Response (`200`)

```json
{
  "success": true,
  "message": "If an account exists for that email, a password reset token has been prepared.",
  "data": {
    "demoMode": true,
    "resetTokenIssued": true,
    "resetToken": "<demo-reset-token>",
    "expiresAt": "2026-03-17T11:02:00Z"
  },
  "errors": null,
  "timestamp": "2026-03-17T10:32:00Z"
}
```

## Reset Password

### Request

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "<demo-reset-token>",
  "password": "Updated@123",
  "confirmPassword": "Updated@123"
}
```

### Success Response (`200`)

```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "reset": true
  },
  "errors": null,
  "timestamp": "2026-03-17T10:33:00Z"
}
```

## Sample Auth Failure (`401`)

```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null,
  "errors": null,
  "timestamp": "2026-03-17T10:33:30Z"
}
```
