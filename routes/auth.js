import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { authMiddleware } from "../middleware/auth.js"
import { authLimiter } from "../middleware/rateLimit.js"
import { validateUserRegistration } from "../middleware/inputValidation.js"
import AuditService from "../services/audit.js"
import CacheService from "../services/cache.js"
import monitoringService from "../services/monitoring.js"

const router = express.Router()

// Register
router.post("/register", authLimiter, validateUserRegistration, async (req, res) => {
  const startTime = Date.now()
  try {
    const { email, password, firstName, lastName, role } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      await AuditService.log({
        userId: null,
        action: 'CREATE',
        resource: 'User',
        resourceId: email,
        details: { email, reason: 'User already exists' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'User already exists'
      })
      return res.status(400).json({ error: "User already exists" })
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: role || "Customer",
    })

    await user.save()

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    )

    // Log successful registration
    await AuditService.log({
      userId: user._id,
      action: 'USER_CREATED',
      resource: 'User',
      resourceId: user._id,
      details: { email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    // Log metrics
    monitoringService.logRequest(req, res, Date.now() - startTime)
    monitoringService.logParcelOperation('created', user._id, user._id)

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    await AuditService.log({
      userId: null,
      action: 'CREATE',
      resource: 'User',
      resourceId: req.body.email,
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })
    
    monitoringService.logError(error, { context: 'user_registration' })
    res.status(500).json({ error: error.message })
  }
})

// Login
router.post("/login", authLimiter, async (req, res) => {
  const startTime = Date.now()
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      await AuditService.log({
        userId: null,
        action: 'LOGIN',
        resource: 'User',
        resourceId: email,
        details: { email },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'User not found'
      })
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      await AuditService.log({
        userId: user._id,
        action: 'LOGIN',
        resource: 'User',
        resourceId: user._id,
        details: { email },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Invalid password'
      })
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    )

    // Cache user session
    await CacheService.setUserSession(user._id, {
      id: user._id,
      email: user.email,
      role: user.role,
      loginTime: new Date()
    })

    // Log successful login
    await AuditService.log({
      userId: user._id,
      action: 'LOGIN',
      resource: 'User',
      resourceId: user._id,
      details: { email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    // Log metrics
    monitoringService.logRequest(req, res, Date.now() - startTime)

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    await AuditService.log({
      userId: null,
      action: 'LOGIN',
      resource: 'User',
      resourceId: req.body.email,
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })
    
    monitoringService.logError(error, { context: 'user_login' })
    res.status(500).json({ error: error.message })
  }
})

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    user.resetToken = resetToken
    user.resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    await user.save()

    // In production, send email with reset link
    res.json({
      message: "Password reset token generated",
      resetToken, // In production, don't return this
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body

    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" })
    }

    user.password = newPassword
    user.resetToken = undefined
    user.resetTokenExpiry = undefined

    await user.save()

    res.json({ message: "Password reset successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
