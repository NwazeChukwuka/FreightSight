# FreightSight Enterprise API Documentation

## Overview

FreightSight Enterprise API provides comprehensive parcel tracking, management, and administrative capabilities with enterprise-grade security and performance features.

## Base URL

```
Development: http://localhost:5000/api
Production: https://api.freightsight.com/api
```

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Admin endpoints**: 50 requests per minute per IP

## API Versioning

Current version: v1

All endpoints are prefixed with `/api/v1/` for versioning. Previous versions remain supported for backward compatibility.

## Response Format

### Success Response
```json
{
  "data": {},
  "message": "Operation successful",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error description",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Customer" // Optional: Admin, Staff, Customer
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "Customer"
  }
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### POST /auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "resetToken": "reset-token-here",
  "newPassword": "NewSecurePass123!"
}
```

### Parcel Management

#### GET /parcels/search/:trackingId
Search for parcel by tracking ID.

**Query Parameters:**
- `courier` (optional): Specify courier for external search

**Response:**
```json
{
  "trackingId": "FTSX48T9ZP237",
  "courier": "FreightSight",
  "status": "In Transit",
  "sender": {
    "name": "Sender Name",
    "email": "sender@example.com",
    "address": "123 Sender St",
    "city": "New York",
    "country": "USA"
  },
  "receiver": {
    "name": "Receiver Name",
    "email": "receiver@example.com",
    "address": "456 Receiver Ave",
    "city": "Los Angeles",
    "country": "USA"
  },
  "currentLocation": {
    "address": "789 Current Location",
    "city": "Chicago",
    "country": "USA",
    "timestamp": "2025-01-15T10:30:00.000Z"
  },
  "estimatedDelivery": "2025-01-17T18:00:00.000Z",
  "timeline": [
    {
      "status": "Package picked up",
      "location": "New York, USA",
      "timestamp": "2025-01-15T08:00:00.000Z"
    }
  ]
}
```

#### GET /parcels/history
Get user's tracking history.

**Response:**
```json
{
  "history": [
    {
      "trackingId": "FTSX48T9ZP237",
      "courier": "FreightSight",
      "searchedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

#### GET /parcels/route/:trackingId
Get parcel route coordinates for mapping.

**Response:**
```json
{
  "route": [
    {
      "lat": 40.7128,
      "lng": -74.0060,
      "timestamp": "2025-01-15T08:00:00.000Z",
      "status": "Package picked up",
      "location": "New York, USA"
    }
  ]
}
```

### Admin Management

#### POST /admin/generate-tracking-id
Generate a new tracking ID for a specific courier.

**Request Body:**
```json
{
  "courier": "FreightSight" // DHL, FedEx, UPS, etc.
}
```

**Response:**
```json
{
  "trackingId": "FTSX48T9ZP237"
}
```

#### POST /admin/parcels
Create a new parcel (Admin/Staff only).

**Request Body:**
```json
{
  "trackingId": "FTSX48T9ZP237",
  "courier": "FreightSight",
  "sender": {
    "name": "Sender Name",
    "email": "sender@example.com",
    "address": "123 Sender St",
    "city": "New York",
    "country": "USA"
  },
  "receiver": {
    "name": "Receiver Name",
    "email": "receiver@example.com",
    "address": "456 Receiver Ave",
    "city": "Los Angeles",
    "country": "USA"
  },
  "estimatedDelivery": "2025-01-17T18:00:00.000Z",
  "weight": "2.5 kg",
  "dimensions": "30x20x10 cm"
}
```

#### PATCH /admin/parcels/:id
Update parcel information.

**Request Body:**
```json
{
  "status": "In Transit",
  "currentLocation": {
    "address": "789 Current Location",
    "city": "Chicago",
    "country": "USA"
  },
  "estimatedDelivery": "2025-01-18T18:00:00.000Z"
}
```

#### GET /admin/parcels
Get all parcels (Admin only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 100)
- `status` (optional): Filter by status

#### GET /admin/stats
Get dashboard statistics.

**Response:**
```json
{
  "activeParcels": 150,
  "deliveredParcels": 1200,
  "delayedParcels": 5
}
```

### Scheduled Updates

#### POST /scheduled-updates
Create a new scheduled update (Admin/Staff only).

**Request Body:**
```json
{
  "trackingId": "FTSX48T9ZP237",
  "scheduledTime": "2025-01-15T15:00:00.000Z",
  "location": {
    "address": "789 Current Location",
    "city": "Chicago",
    "country": "USA"
  },
  "status": "In Transit",
  "notes": "Package arrived at sorting facility"
}
```

#### GET /scheduled-updates/:trackingId
Get scheduled updates for a parcel.

**Query Parameters:**
- `includeExecuted` (optional): Include executed updates (default: false)

#### DELETE /scheduled-updates/:updateId
Cancel a scheduled update.

#### PATCH /scheduled-updates/:updateId
Update a scheduled update (only if not executed).

#### GET /scheduled-updates
Get all scheduled updates (with pagination and filtering).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (pending/executed)

#### GET /scheduled-updates/system/status
Get scheduler system status (Admin only).

**Response:**
```json
{
  "scheduler": {
    "isRunning": true,
    "activeTasks": 2,
    "uptime": 86400
  },
  "cache": {
    "status": "healthy",
    "message": "Redis connection successful"
  }
}
```

### Monitoring & Analytics

#### GET /monitoring/health
Get comprehensive system health status (Admin only).

#### GET /monitoring/metrics
Get detailed performance metrics (Admin only).

#### GET /monitoring/report
Generate performance report (Admin only).

#### GET /monitoring/logs
Get recent system logs (Admin only).

**Query Parameters:**
- `level` (optional): Log level (error/warning/info)
- `limit` (optional): Number of logs to return (default: 50)

#### POST /monitoring/reset
Reset metrics collection (Admin only).

#### GET /monitoring/cache
Get cache statistics (Admin only).

#### GET /monitoring/scheduler
Get scheduler status (Admin only).

#### POST /monitoring/cleanup
Trigger manual cleanup of logs and cache (Admin only).

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation failed |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Security Features

- **Rate Limiting**: IP-based request limiting
- **Input Validation**: Comprehensive request validation
- **Audit Logging**: All actions are logged for compliance
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js security headers
- **IP Blocking**: Automatic blocking of suspicious IPs

## Caching

Responses are cached using Redis for improved performance:

- Parcel data: 30 minutes
- API responses: 5 minutes
- Analytics data: 10 minutes
- User sessions: 2 hours

## Webhooks

FreightSight supports webhooks for real-time notifications:

### Configure Webhook

```json
{
  "url": "https://your-app.com/webhook",
  "events": ["parcel.created", "parcel.updated", "parcel.delivered"],
  "secret": "webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "parcel.updated",
  "data": {
    "trackingId": "FTSX48T9ZP237",
    "status": "In Transit",
    "location": "Chicago, USA",
    "timestamp": "2025-01-15T10:30:00.000Z"
  },
  "signature": "sha256=signature-here"
}
```

## SDKs and Libraries

Official SDKs are available for:
- JavaScript/Node.js
- Python
- Java
- C#
- PHP

## Support

For API support and documentation:
- Email: api-support@freightsight.com
- Documentation: https://docs.freightsight.com
- Status Page: https://status.freightsight.com

## Changelog

### v1.0.0 (Current)
- Initial enterprise release
- Scheduled updates feature
- Advanced monitoring and analytics
- Enterprise security features
- Redis caching implementation

### v0.9.0
- Basic parcel tracking
- User authentication
- Admin management interface
