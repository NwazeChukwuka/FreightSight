import nodemailer from 'nodemailer'
import CacheService from './cache.js'

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

// Email templates
const emailTemplates = {
  parcelUpdate: {
    subject: 'Your Parcel Status Has Been Updated',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parcel Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status { background: #e9ecef; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FreightSight</h1>
            <p>Global Parcel Tracking</p>
          </div>
          <div class="content">
            <h2>Parcel Status Update</h2>
            <p>Your parcel has been updated with the following information:</p>
            
            <div class="status">
              <strong>Tracking ID:</strong> ${data.trackingId}<br>
              <strong>Status:</strong> ${data.status}<br>
              <strong>Location:</strong> ${data.location}<br>
              <strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}
            </div>
            
            ${data.estimatedDelivery ? `
              <p><strong>Estimated Delivery:</strong> ${new Date(data.estimatedDelivery).toLocaleDateString()}</p>
            ` : ''}
            
            <p>You can track your parcel in real-time by visiting our website or using the tracking ID above.</p>
            
            <p>
              <a href="${process.env.FRONTEND_URL}/track?id=${data.trackingId}" 
                 style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Track Your Parcel
              </a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2025 FreightSight Global. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  deliveryConfirmation: {
    subject: 'Your Parcel Has Been Delivered',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delivery Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Delivered!</h1>
            <p>FreightSight</p>
          </div>
          <div class="content">
            <div class="success">
              <h2>Your Parcel Has Been Successfully Delivered</h2>
              <p><strong>Tracking ID:</strong> ${data.trackingId}</p>
              <p><strong>Delivery Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
              <p><strong>Location:</strong> ${data.location}</p>
            </div>
            
            <p>Thank you for choosing FreightSight for your shipping needs!</p>
            
            <p>
              <a href="${process.env.FRONTEND_URL}/track?id=${data.trackingId}" 
                 style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Delivery Details
              </a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2025 FreightSight Global. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  delayNotification: {
    subject: 'Parcel Delay Notification',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delay Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .delay { background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Delay Notification</h1>
            <p>FreightSight</p>
          </div>
          <div class="content">
            <div class="delay">
              <h2>Your Parcel Delivery Has Been Delayed</h2>
              <p><strong>Tracking ID:</strong> ${data.trackingId}</p>
              <p><strong>Current Status:</strong> Delayed</p>
              <p><strong>Current Location:</strong> ${data.location}</p>
              <p><strong>Delay Reason:</strong> ${data.reason || 'Unknown'}</p>
            </div>
            
            <p>We apologize for the inconvenience. Our team is working to resolve the delay as quickly as possible.</p>
            
            <p>
              <a href="${process.env.FRONTEND_URL}/track?id=${data.trackingId}" 
                 style="background: #ffc107; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Track Your Parcel
              </a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2025 FreightSight Global. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

// Send notification service
export const sendNotification = async ({ type, recipient, subject, template, data }) => {
  try {
    const cacheKey = `notification:${type}:${recipient}:${Date.now()}`
    
    // Check if similar notification was sent recently (prevent spam)
    const recentNotifications = await CacheService.get(`recent_notifications:${recipient}`)
    if (recentNotifications && recentNotifications.includes(data.trackingId)) {
      console.log(`Skipping duplicate notification for ${data.trackingId} to ${recipient}`)
      return { success: true, skipped: true }
    }

    const transporter = createTransporter()
    const emailTemplate = emailTemplates[template]

    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`)
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@freightsight.com',
      to: recipient,
      subject: subject || emailTemplate.subject,
      html: emailTemplate.html(data)
    }

    const result = await transporter.sendMail(mailOptions)
    
    // Cache recent notifications to prevent spam
    const notifications = recentNotifications || []
    notifications.push(data.trackingId)
    await CacheService.set(`recent_notifications:${recipient}`, notifications, 300) // 5 minutes

    console.log(`Notification sent successfully to ${recipient}:`, result.messageId)
    
    return { 
      success: true, 
      messageId: result.messageId,
      type,
      recipient
    }
  } catch (error) {
    console.error('Send notification error:', error)
    throw error
  }
}

// Send bulk notifications
export const sendBulkNotifications = async (notifications) => {
  const results = []
  
  for (const notification of notifications) {
    try {
      const result = await sendNotification(notification)
      results.push(result)
      
      // Add small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      results.push({ 
        success: false, 
        error: error.message,
        recipient: notification.recipient 
      })
    }
  }
  
  return results
}

// Get notification preferences for user
export const getNotificationPreferences = async (userId) => {
  try {
    const preferences = await CacheService.get(`notification_preferences:${userId}`)
    return preferences || {
      email: true,
      sms: false,
      push: false,
      updates: true,
      delays: true,
      delivery: true
    }
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return null
  }
}

// Update notification preferences
export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    await CacheService.set(`notification_preferences:${userId}`, preferences, 86400) // 24 hours
    return { success: true }
  } catch (error) {
    console.error('Update notification preferences error:', error)
    throw error
  }
}

export default {
  sendNotification,
  sendBulkNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  emailTemplates
}
