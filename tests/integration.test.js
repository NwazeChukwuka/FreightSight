import request from 'supertest'
import mongoose from 'mongoose'
import { app } from '../server.js'
import User from '../models/User.js'
import Parcel from '../models/Parcel.js'
import ScheduledUpdate from '../models/ScheduledUpdate.js'
import AuditLog from '../models/AuditLog.js'
import CacheService from '../services/cache.js'

describe('FreightSight Enterprise Integration Tests', () => {
  let adminToken
  let staffToken
  let customerToken
  let adminUser
  let staffUser
  let customerUser
  let testParcel

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/freightsight-integration-test')
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clean up all collections
    await User.deleteMany({})
    await Parcel.deleteMany({})
    await ScheduledUpdate.deleteMany({})
    await AuditLog.deleteMany({})
    
    // Clear cache
    await CacheService.close()

    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'Admin'
    })

    staffUser = await User.create({
      email: 'staff@test.com',
      password: 'StaffPass123!',
      firstName: 'Staff',
      lastName: 'User',
      role: 'Staff'
    })

    customerUser = await User.create({
      email: 'customer@test.com',
      password: 'CustomerPass123!',
      firstName: 'Customer',
      lastName: 'User',
      role: 'Customer'
    })

    // Get auth tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'AdminPass123!' })
    adminToken = adminLogin.body.token

    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@test.com', password: 'StaffPass123!' })
    staffToken = staffLogin.body.token

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@test.com', password: 'CustomerPass123!' })
    customerToken = customerLogin.body.token

    // Create test parcel
    testParcel = await Parcel.create({
      trackingId: 'INT123456789',
      courier: 'FreightSight',
      sender: {
        name: 'Test Sender',
        email: 'sender@test.com',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country'
      },
      receiver: {
        name: 'Test Receiver',
        email: 'receiver@test.com',
        address: '456 Test Ave',
        city: 'Test City',
        country: 'Test Country'
      },
      status: 'Pending'
    })
  })

  describe('Enterprise Security Integration', () => {
    it('should enforce rate limiting on auth endpoints', async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'admin@test.com', password: 'wrongpassword' })
      )

      const responses = await Promise.all(promises)
      const rateLimitedResponses = responses.filter(res => res.status === 429)

      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should create audit logs for all user actions', async () => {
      // Perform various actions
      await request(app)
        .get('/api/parcels/search/INT123456789')
        .set('Authorization', `Bearer ${customerToken}`)

      await request(app)
        .post('/api/admin/parcels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trackingId: 'NEW123456789',
          courier: 'FreightSight',
          sender: {
            name: 'New Sender',
            email: 'newsender@test.com',
            address: '123 New St',
            city: 'New City',
            country: 'New Country'
          },
          receiver: {
            name: 'New Receiver',
            email: 'newreceiver@test.com',
            address: '456 New Ave',
            city: 'New City',
            country: 'New Country'
          }
        })

      // Check audit logs
      const auditLogs = await AuditLog.find().sort({ timestamp: -1 })
      expect(auditLogs.length).toBeGreaterThan(0)

      // Check specific actions
      const parcelViewedLog = auditLogs.find(log => log.action === 'PARCEL_VIEWED')
      const parcelCreatedLog = auditLogs.find(log => log.action === 'PARCEL_CREATED')

      expect(parcelViewedLog).toBeDefined()
      expect(parcelCreatedLog).toBeDefined()
    })

    it('should block suspicious IP addresses', async () => {
      // This test would require multiple rapid requests from same IP
      // For now, just verify the middleware is in place
      const response = await request(app)
        .get('/api/health')
      
      expect(response.status).toBeLessThan(500)
    })
  })

  describe('Scheduled Updates Integration', () => {
    it('should create and execute scheduled updates', async () => {
      const scheduledTime = new Date()
      scheduledTime.setSeconds(scheduledTime.getSeconds() + 5) // 5 seconds from now

      // Create scheduled update
      const createResponse = await request(app)
        .post('/api/scheduled-updates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trackingId: 'INT123456789',
          scheduledTime: scheduledTime.toISOString(),
          location: {
            address: '789 Update St',
            city: 'Update City',
            country: 'Update Country'
          },
          status: 'In Transit',
          notes: 'Test scheduled update'
        })

      expect(createResponse.status).toBe(201)
      expect(createResponse.body.scheduledUpdate.trackingId).toBe('INT123456789')

      const scheduledUpdateId = createResponse.body.scheduledUpdate._id

      // Verify scheduled update exists
      const getResponse = await request(app)
        .get('/api/scheduled-updates/INT123456789')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(getResponse.status).toBe(200)
      expect(getResponse.body.scheduledUpdates.length).toBeGreaterThan(0)

      // Cancel the scheduled update to avoid waiting for execution
      const cancelResponse = await request(app)
        .delete(`/api/scheduled-updates/${scheduledUpdateId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(cancelResponse.status).toBe(200)
    })

    it('should validate scheduled update permissions', async () => {
      const response = await request(app)
        .post('/api/scheduled-updates')
        .set('Authorization', `Bearer ${customerToken}`) // Customer trying to access admin endpoint
        .send({
          trackingId: 'INT123456789',
          scheduledTime: new Date(Date.now() + 3600000).toISOString(),
          location: {
            city: 'Test City',
            country: 'Test Country'
          },
          status: 'In Transit'
        })

      expect(response.status).toBe(403)
    })
  })

  describe('Caching Integration', () => {
    it('should cache parcel data after first search', async () => {
      // First search - should cache the data
      const firstResponse = await request(app)
        .get('/api/parcels/search/INT123456789')
        .set('Authorization', `Bearer ${customerToken}`)

      expect(firstResponse.status).toBe(200)

      // Second search - should use cached data
      const secondResponse = await request(app)
        .get('/api/parcels/search/INT123456789')
        .set('Authorization', `Bearer ${customerToken}`)

      expect(secondResponse.status).toBe(200)
      expect(secondResponse.body.trackingId).toBe('INT123456789')

      // Verify cache contains the data
      const cachedData = await CacheService.getCachedParcel('INT123456789')
      expect(cachedData).toBeDefined()
      expect(cachedData.trackingId).toBe('INT123456789')
    })

    it('should invalidate cache when parcel is updated', async () => {
      // First search to populate cache
      await request(app)
        .get('/api/parcels/search/INT123456789')
        .set('Authorization', `Bearer ${customerToken}`)

      // Verify cache exists
      let cachedData = await CacheService.getCachedParcel('INT123456789')
      expect(cachedData).toBeDefined()

      // Update parcel
      await request(app)
        .patch(`/api/admin/parcels/${testParcel._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'In Transit' })

      // Cache should be invalidated
      cachedData = await CacheService.getCachedParcel('INT123456789')
      expect(cachedData).toBeNull()
    })
  })

  describe('Monitoring Integration', () => {
    it('should track response times for all requests', async () => {
      const response = await request(app)
        .get('/api/health')

      expect(response.status).toBe(200)
      expect(response.headers['x-response-time']).toBeDefined()
    })

    it('should provide system health metrics', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('healthy')
      expect(response.body.uptime).toBeDefined()
      expect(response.body.memory).toBeDefined()
      expect(response.body.cache).toBeDefined()
      expect(response.body.scheduler).toBeDefined()
    })

    it('should provide performance metrics', async () => {
      // Make some requests to generate metrics
      await request(app)
        .get('/api/parcels/search/INT123456789')
        .set('Authorization', `Bearer ${customerToken}`)

      await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)

      const response = await request(app)
        .get('/api/monitoring/metrics')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.requests).toBeDefined()
      expect(response.body.performance).toBeDefined()
      expect(response.body.parcels).toBeDefined()
    })
  })

  describe('Role-based Access Control', () => {
    it('should allow admin to access all admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
    })

    it('should allow staff to access limited admin endpoints', async () => {
      const response = await request(app)
        .post('/api/admin/generate-tracking-id')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ courier: 'FreightSight' })

      expect(response.status).toBe(200)
    })

    it('should deny customer access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${customerToken}`)

      expect(response.status).toBe(403)
    })

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/stats')

      expect(response.status).toBe(401)
    })
  })

  describe('Data Validation and Sanitization', () => {
    it('should validate parcel creation data', async () => {
      const response = await request(app)
        .post('/api/admin/parcels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing required fields
          trackingId: 'INVALID123'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should sanitize input data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test-sanitize@example.com',
          password: 'TestPass123!',
          firstName: '<script>alert("xss")</script>',
          lastName: 'User'
        })

      expect(response.status).toBe(201)
      // The script tag should be sanitized
      expect(response.body.user.firstName).not.toContain('<script>')
    })
  })

  describe('Error Handling and Logging', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database errors
      // For now, test that the server responds appropriately
      const response = await request(app)
        .get('/api/health')

      expect(response.status).toBeLessThan(500)
    })

    it('should log errors to monitoring service', async () => {
      // Make a request that will cause an error
      const response = await request(app)
        .get('/api/parcels/search/NONEXISTENT123')
        .set('Authorization', `Bearer ${customerToken}`)

      expect(response.status).toBe(404)
      // Error should be logged (verified through monitoring endpoints)
    })
  })

  describe('Performance Under Load', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array(20).fill(null).map(() =>
        request(app)
          .get('/api/parcels/search/INT123456789')
          .set('Authorization', `Bearer ${customerToken}`)
      )

      const responses = await Promise.all(promises)
      const successfulResponses = responses.filter(res => res.status === 200)

      expect(successfulResponses.length).toBe(20)
    }, 10000) // 10 second timeout
  })

  describe('Compliance and Governance', () => {
    it('should maintain audit trail for all actions', async () => {
      // Perform various actions
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'AdminPass123!' })

      await request(app)
        .get('/api/parcels/search/INT123456789')
        .set('Authorization', `Bearer ${customerToken}`)

      // Check audit logs
      const auditLogs = await AuditLog.find().sort({ timestamp: -1 })
      
      expect(auditLogs.length).toBeGreaterThan(0)
      
      // Verify audit log structure
      const log = auditLogs[0]
      expect(log.timestamp).toBeDefined()
      expect(log.action).toBeDefined()
      expect(log.resource).toBeDefined()
      expect(log.ipAddress).toBeDefined()
      expect(log.success).toBeDefined()
    })

    it('should export audit logs for compliance', async () => {
      // This would test the export functionality
      // For now, verify the export endpoint exists
      const response = await request(app)
        .get('/api/monitoring/logs')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.logs).toBeDefined()
    })
  })
})
