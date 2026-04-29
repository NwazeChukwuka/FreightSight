import express from "express"
import { body, validationResult } from "express-validator"
import EmailTemplate from "../models/EmailTemplate.js"
import { authMiddleware, adminMiddleware } from "../middleware/auth.js"
import { createDefaultTemplates } from "../services/emailTemplates.js"

const router = express.Router()

// Get all email templates
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search } = req.query
    const query = { organizationId: req.user.organizationId || { $exists: false } }
    
    if (type) query.type = type
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } }
      ]
    }

    const templates = await EmailTemplate.find(query)
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await EmailTemplate.countDocuments(query)

    res.json({
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single email template
router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
      .populate("createdBy", "firstName lastName email")

    if (!template) {
      return res.status(404).json({ error: "Template not found" })
    }

    res.json(template)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create email template
router.post("/", [
  authMiddleware,
  adminMiddleware,
  body("name").notEmpty().withMessage("Template name is required"),
  body("type").isIn(["parcel_update", "welcome", "delay_alert", "delivery_confirmation", "custom"]),
  body("subject").notEmpty().withMessage("Subject is required"),
  body("htmlContent").notEmpty().withMessage("HTML content is required"),
  body("variables").isArray().withMessage("Variables must be an array")
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, type, subject, htmlContent, variables } = req.body

    // Check if template name already exists
    const existingTemplate = await EmailTemplate.findOne({ 
      name,
      organizationId: req.user.organizationId || { $exists: false }
    })

    if (existingTemplate) {
      return res.status(400).json({ error: "Template with this name already exists" })
    }

    const template = new EmailTemplate({
      name,
      type,
      subject,
      htmlContent,
      variables,
      organizationId: req.user.organizationId,
      createdBy: req.user._id
    })

    await template.save()
    await template.populate("createdBy", "firstName lastName email")

    res.status(201).json(template)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update email template
router.put("/:id", [
  authMiddleware,
  adminMiddleware,
  body("name").optional().notEmpty().withMessage("Template name is required"),
  body("type").optional().isIn(["parcel_update", "welcome", "delay_alert", "delivery_confirmation", "custom"]),
  body("subject").optional().notEmpty().withMessage("Subject is required"),
  body("htmlContent").optional().notEmpty().withMessage("HTML content is required"),
  body("variables").optional().isArray().withMessage("Variables must be an array")
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const template = await EmailTemplate.findById(req.params.id)
    if (!template) {
      return res.status(404).json({ error: "Template not found" })
    }

    // Check permissions
    if (template.organizationId && template.organizationId.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({ error: "Access denied" })
    }

    const updates = req.body
    Object.assign(template, updates)
    template.updatedAt = new Date()

    await template.save()
    await template.populate("createdBy", "firstName lastName email")

    res.json(template)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete email template
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
    if (!template) {
      return res.status(404).json({ error: "Template not found" })
    }

    // Check permissions
    if (template.organizationId && template.organizationId.toString() !== req.user.organizationId?.toString()) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Don't allow deletion of default templates
    if (template.name.includes('_default')) {
      return res.status(400).json({ error: "Cannot delete default templates" })
    }

    await EmailTemplate.findByIdAndDelete(req.params.id)

    res.json({ message: "Template deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Preview email template
router.post("/preview", [
  authMiddleware,
  adminMiddleware,
  body("templateId").notEmpty().withMessage("Template ID is required"),
  body("variables").optional().isObject().withMessage("Variables must be an object")
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { templateId, variables = {} } = req.body

    const template = await EmailTemplate.findById(templateId)
    if (!template) {
      return res.status(404).json({ error: "Template not found" })
    }

    // Render template with provided variables
    let renderedContent = template.htmlContent
    let renderedSubject = template.subject

    template.variables.forEach(variable => {
      const value = variables[variable.name] || `[${variable.name}]`
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
      renderedContent = renderedContent.replace(regex, value)
      renderedSubject = renderedSubject.replace(regex, value)
    })

    res.json({
      subject: renderedSubject,
      html: renderedContent
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Send test email
router.post("/send-test", [
  authMiddleware,
  adminMiddleware,
  body("templateId").notEmpty().withMessage("Template ID is required"),
  body("recipientEmail").isEmail().withMessage("Valid email is required"),
  body("variables").optional().isObject().withMessage("Variables must be an object")
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { templateId, recipientEmail, variables = {} } = req.body

    const template = await EmailTemplate.findById(templateId)
    if (!template) {
      return res.status(404).json({ error: "Template not found" })
    }

    // Render template
    let renderedContent = template.htmlContent
    let renderedSubject = template.subject

    template.variables.forEach(variable => {
      const value = variables[variable.name] || `[${variable.name}]`
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
      renderedContent = renderedContent.replace(regex, value)
      renderedSubject = renderedSubject.replace(regex, value)
    })

    // Send test email
    const nodemailer = require("nodemailer")
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `[TEST] ${renderedSubject}`,
      html: renderedContent,
    }

    await transporter.sendMail(mailOptions)

    res.json({ message: "Test email sent successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Initialize default templates
router.post("/initialize", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await createDefaultTemplates(req.user._id)
    res.json({ message: "Default templates initialized successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
