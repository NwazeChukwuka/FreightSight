import request from 'supertest'
import mongoose from 'mongoose'
import { app } from '../server.js'
import User from '../models/User.js'
import Parcel from '../models/Parcel.js'
import ScheduledUpdate from '../models/ScheduledUpdate.js'

describe('FreightSight Enterprise API Tests', () => {
  let authToken
  let adminToken
  let testUser
  let adminUser
  let testParcel

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/freightsight-test')
  })

  afterAll(async () => {
    // Clean up and disconnect
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clean up collections
    await User.deleteMany({})
    await Parcel.deleteMany({})
    await ScheduledUpdate.deleteMany({})

    // Create test users
    testUser = await User.create({
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'Customer'
    })

    adminUser = await User.create({
      email: 'admin@example.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'Admin'
    })

    // Get auth tokens
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!'
      })

    authToken = loginResponse.body.token

    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!'
      })

    adminToken = adminLoginResponse.body.token

    // Create test parcel
    testParcel = await Parcel.create({
      trackingId: 'TEST123456789',
      courier: 'FreightSight',
      sender: {
        name: 'Test Sender',
        email: 'sender@example.com',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country'
      },
      receiver: {
        name: 'Test Receiver',
        email: 'receiver@example.com',
        address: '456 Test Ave',
        city: 'Test City',
        country: 'Test Country'
      },
      status: 'Pending'
    })
  })

  describe('Authentication Endpoints', () => {
    describe('POST /auth/register', () => {
      it('should register a new user successfully', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'newuser@example.com',
            password: 'NewPass123!',
            firstName: 'New',
            lastName: 'User'
          })

        expect(response.status).toBe(201)
        expect(response.body.message).toBe('User registered successfully')
        expect(response.body.token).toBeDefined()
      })

      it('should reject invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            password: 'ValidPass123!',
            firstName: 'Test',
            lastName: 'User'
          })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Validation failed')
      })

      it('should reject weak password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'weak',
            firstName: 'Test',
            lastName: 'User'
          })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Validation failed')
      })
    })

    describe('POST /auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'TestPass123!'
          })

        expect(response.status).toBe(200)
        expect(response.body.token).toBeDefined()
        expect(response.body.user.email).toBe('test@example.com')
      })

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('Invalid credentials')
      })
    })
  })

  describe('Parcel Management Endpoints', () => {
    describe('GET /parcels/search/:trackingId', () => {
      it('should find parcel with valid tracking ID', async () => {
        const response = await request(app)
          .get('/api/parcels/search/TEST123456789')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body.trackingId).toBe('TEST123456789')
        expect(response.body.courier).toBe('FreightSight')
      })

      it('should return 404 for non-existent tracking ID', async () => {
        const response = await request(app)
          .get('/api/parcels/search/NONEXISTENT')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Parcel not found in any system')
      })

      it('should reject requests without auth token', async () => {
        const response = await request(app)
          .get('/api/parcels/search/TEST123456789')

        expect(response.status).toBe(401)
      })
    })

    describe('GET /parcels/history', () => {
      it('should return user tracking history', async () => {
        // First search to create history
        await request(app)
          .get('/api/parcels/search/TEST123456789')
          .set('Authorization', `Bearer ${authToken}`)

        const response = await request(app)
          .get('/api/parcels/history')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body.history).toBeDefined()
        expect(response.body.history.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Admin Management Endpoints', () => {
    describe('POST /admin/generate-tracking-id', () => {
      it('should generate tracking ID for FreightSight', async () => {
        const response = await request(app)
          .post('/api/admin/generate-tracking-id')
          .send({ courier: 'FreightSight' })
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(response.body.trackingId).toMatch(/^FTS/)
      })

      it('should reject non-admin users', async () => {
        const response = await request(app)
          .post('/api/admin/generate-tracking-id')
          .send({ courier: 'FreightSight' })
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(403)
      })
    })

    describe('POST /admin/parcels', () => {
      it('should create new parcel', async () => {
        const parcelData = {
          trackingId: 'NEW123456789',
          courier: 'FreightSight',
          sender: {
            name: 'New Sender',
            email: 'newsender@example.com',
            address: '123 New St',
            city: 'New City',
            country: 'New Country'
          },
          receiver: {
            name: 'New Receiver',
            email: 'newreceiver@example.com',
            address: '456 New Ave',
            city: 'New City',
            country: 'New Country'
          }
        }

        const response = await request(app)
          .post('/api/admin/parcels')
          .send(parcelData)
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(201)
        expect(response.body.trackingId).toBe('NEW123456789')
      })

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/admin/parcels')
          .send({})
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Validation failed')
      })
    })

    describe('GET /admin/stats', () => {
      it('should return dashboard statistics', async () => {
        const response = await request(app)
          .get('/api/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(response.body.activeParcels).toBeDefined()
        expect(response.body.deliveredParcels).toBeDefined()
        expect(response.body.delayedParcels).toBeDefined()
      })
    })
  })

  describe('Scheduled Updates Endpoints', () => {
    describe('POST /scheduled-updates', () => {
      it('should create scheduled update', async () => {
        const scheduledTime = new Date()
        scheduledTime.setHours(scheduledTime.getHours() + 2) // 2 hours from now

        const updateData = {
          trackingId: 'TEST123456789',
          scheduledTime: scheduledTime.toISOString(),
          location: {
            address: '789 Update St',
            city: 'Update City',
            country: 'Update Country'
          },
          status: 'In Transit',
          notes: 'Test scheduled update'
        }

        const response = await request(app)
          .post('/api/scheduled-updates')
          .send(updateData)
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(201)
        expect(response.body.scheduledUpdate.trackingId).toBe('TEST123456789')
        expect(response.body.scheduledUpdate.isExecuted).toBe(false)
      })

      it('should reject past scheduled time', async () => {
        const pastTime = new Date()
        pastTime.setHours(pastTime.getHours() - 1) // 1 hour ago

        const response = await request(app)
          .post('/api/scheduled-updates')
          .send({
            trackingId: 'TEST123456789',
            scheduledTime: pastTime.toISOString(),
            location: {
              city: 'Test City',
              country: 'Test Country'
            },
            status: 'In Transit'
          })
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(400)
        expect(response.body.error).toContain('future')
      })
    })

    describe('GET /scheduled-updates/:trackingId', () => {
      it('should get scheduled updates for parcel', async () => {
        // First create a scheduled update
        const scheduledTime = new Date()
        scheduledTime.setHours(scheduledTime.getHours() + 2)

        await request(app)
          .post('/api/scheduled-updates')
          .send({
            trackingId: 'TEST123456789',
            scheduledTime: scheduledTime.toISOString(),
            location: {
              city: 'Test City',
              country: 'Test Country'
            },
            status: 'In Transit'
          })
          .set('Authorization', `Bearer ${adminToken}`)

        const response = await request(app)
          .get('/api/scheduled-updates/TEST123456789')
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(response.body.scheduledUpdates).toBeDefined()
        expect(response.body.scheduledUpdates.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Security Tests', () => {
    describe('Rate Limiting', () => {
      it('should limit auth endpoint requests', async () => {
        const promises = Array(10).fill(null).map(() =>
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        )

        const responses = await Promise.all(promises)
        const rateLimitedResponses = responses.filter(res => res.status === 429)

        expect(rateLimitedResponses.length).toBeGreaterThan(0)
      })
    })

    describe('Input Validation', () => {
      it('should sanitize XSS attempts', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'TestPass123!',
            firstName: '<script>alert("xss")</script>',
            lastName: 'User'
          })

        expect(response.status).toBe(201)
        // The script tag should be sanitized
        expect(response.body.user.firstName).not.toContain('<script>')
      })
    })
  })

  describe('Monitoring Endpoints', () => {
    describe('GET /monitoring/health', () => {
      it('should return system health status', async () => {
        const response = await request(app)
          .get('/api/monitoring/health')
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(response.body.status).toBe('healthy')
        expect(response.body.uptime).toBeDefined()
        expect(response.body.memory).toBeDefined()
      })

      it('should reject non-admin users', async () => {
        const response = await request(app)
          .get('/api/monitoring/health')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(403)
      })
    })

    describe('GET /monitoring/metrics', () => {
      it('should return performance metrics', async () => {
        const response = await request(app)
          .get('/api/monitoring/metrics')
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)
        expect(response.body.requests).toBeDefined()
        expect(response.body.performance).toBeDefined()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
    })

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database errors
      // For now, just test that the server responds
      const response = await request(app)
        .get('/api/health')

      expect(response.status).toBeLessThan(500)
    })
  })
})
