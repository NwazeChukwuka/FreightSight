# FreightSight Enterprise - Global Parcel Tracking System

## Overview

FreightSight Enterprise is a comprehensive, enterprise-grade parcel tracking system with advanced features including real-time scheduled updates, comprehensive monitoring, and robust security.

## 🚀 Key Features

### Core Functionality
- **Global Parcel Tracking**: Track parcels across 100+ courier networks
- **Real-time Updates**: Live tracking with interactive maps
- **AI-Powered Assistant**: Smart chat support for tracking queries
- **Multi-courier Integration**: DHL, FedEx, UPS, USPS, Aramex, Royal Mail, and more

### Enterprise Features
- **Scheduled Updates**: Admin can schedule automatic status updates for future times
- **Advanced Security**: Rate limiting, input validation, audit logging, IP blocking
- **Redis Caching**: High-performance caching for improved response times
- **Comprehensive Monitoring**: Real-time metrics, error tracking, performance analytics
- **Audit Logging**: Complete compliance and audit trail for all actions
- **Role-based Access Control**: Admin, Staff, and Customer roles with granular permissions

### Admin Capabilities
- **Real-time Parcel Management**: Update parcel statuses instantly or schedule for future
- **Bulk Operations**: Generate tracking IDs, create parcels in bulk
- **Analytics Dashboard**: Track performance, delivery rates, and system health
- **User Management**: Manage users and permissions
- **Compliance Reports**: Export audit logs and compliance data

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB
- **Caching**: Redis
- **Security**: Helmet.js, express-rate-limit, JWT authentication
- **Monitoring**: Custom monitoring service with comprehensive metrics
- **Testing**: Vitest, Supertest
- **Scheduling**: node-cron for automated updates

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 5.0+
- Redis 6.0+
- Git

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd FreightSight-Parcel-Tracking-System
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/freightsight
MONGODB_TEST_URI=mongodb://localhost:27017/freightsight-test

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@freightsight.com

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# External APIs
AFTERSHIP_API_KEY=your-aftership-api-key
NEXT_PUBLIC_API_URL=http://localhost:5000

# Frontend
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### 3. Start Services

Start MongoDB and Redis, then run:

```bash
# Start the backend server
npm run server

# In a new terminal, start the frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 Monitoring & Analytics

Access comprehensive monitoring at `/api/monitoring` (admin access required):

- **System Health**: `/api/monitoring/health`
- **Performance Metrics**: `/api/monitoring/metrics`
- **Audit Logs**: `/api/monitoring/logs`
- **Cache Statistics**: `/api/monitoring/cache`

## 🔧 Configuration

### Security Settings
- Rate limiting: 100 requests/15min (general), 5 requests/15min (auth)
- IP blocking for suspicious activity
- Input sanitization and validation
- Security headers via Helmet.js

### Caching Strategy
- Parcel data: 30 minutes
- API responses: 5 minutes
- User sessions: 2 hours
- Analytics data: 10 minutes

### Scheduled Updates
Admins can schedule parcel updates for any future time:
- Automatic execution at scheduled time
- Email notifications to sender/receiver
- Audit logging for compliance
- Cancellation and modification support

## 📚 API Documentation

Comprehensive API documentation is available at `/docs/api.md` or view the online documentation.

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset

#### Parcel Management
- `GET /api/parcels/search/:trackingId` - Search parcel
- `GET /api/parcels/history` - User tracking history

#### Admin Operations
- `POST /api/admin/generate-tracking-id` - Generate tracking ID
- `POST /api/admin/parcels` - Create parcel
- `GET /api/admin/stats` - Dashboard statistics

#### Scheduled Updates
- `POST /api/scheduled-updates` - Create scheduled update
- `GET /api/scheduled-updates/:trackingId` - Get scheduled updates
- `DELETE /api/scheduled-updates/:updateId` - Cancel update

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **Audit Logging**: Complete action tracking
- **IP Blocking**: Automatic blocking of suspicious IPs
- **CORS Protection**: Configurable cross-origin policies
- **Security Headers**: Helmet.js protection

## 📈 Performance

- **Redis Caching**: Sub-millisecond response times for cached data
- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: Efficient database connections
- **Compression**: Gzip compression for responses
- **CDN Ready**: Static asset optimization

## 🏢 Enterprise Features

### Multi-tenancy Support
- Organization-based data isolation
- Role-based permissions
- Custom branding options

### Compliance & Governance
- GDPR compliance features
- Data retention policies
- Audit trail exports
- Compliance reporting

### Scalability
- Horizontal scaling support
- Load balancer ready
- Microservices architecture
- Container deployment support

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Production Deployment
1. Set production environment variables
2. Build the application: `npm run build`
3. Start with process manager: `npm start`
4. Set up reverse proxy (nginx/Apache)
5. Configure SSL certificates

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
REDIS_URL=redis://your-production-redis
JWT_SECRET=your-production-secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@freightsight.com
- Documentation: https://docs.freightsight.com
- Issues: GitHub Issues

## 🔄 Version History

### v2.0.0 - Enterprise Edition
- Added scheduled updates system
- Implemented enterprise security features
- Added comprehensive monitoring
- Redis caching implementation
- Audit logging and compliance features

### v1.0.0 - Initial Release
- Basic parcel tracking
- User authentication
- Admin management
- Multi-courier integration

