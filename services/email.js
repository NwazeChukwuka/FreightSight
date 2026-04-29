import nodemailer from "nodemailer"
import { renderTemplate } from "./emailTemplates.js"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export const sendParcelStatusEmail = async (userEmail, parcel, organizationId = null) => {
  try {
    const variables = {
      trackingId: parcel.trackingId,
      courier: parcel.courier,
      status: parcel.status,
      currentLocation: parcel.currentLocation ? 
        `${parcel.currentLocation.city}, ${parcel.currentLocation.country}` : 'Unknown',
      updatedAt: new Date(parcel.updatedAt).toLocaleString(),
      trackingUrl: `${process.env.FRONTEND_URL}/track?id=${parcel.trackingId}`
    }

    const template = await renderTemplate('parcel_update_default', variables, organizationId)
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: template.subject,
      html: template.html,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email sent to ${userEmail} for tracking ${parcel.trackingId}`)
  } catch (error) {
    console.error("Email sending error:", error.message)
  }
}

export const sendWelcomeEmail = async (userEmail, userName, organizationId = null) => {
  try {
    const variables = {
      userName: userName,
      trackingUrl: `${process.env.FRONTEND_URL}/track`
    }

    const template = await renderTemplate('welcome_default', variables, organizationId)
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: template.subject,
      html: template.html,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Welcome email sent to ${userEmail}`)
  } catch (error) {
    console.error("Welcome email error:", error.message)
  }
}

export const sendDelayAlert = async (userEmail, parcel, organizationId = null) => {
  try {
    const variables = {
      trackingId: parcel.trackingId,
      estimatedDelivery: parcel.estimatedDelivery ? 
        new Date(parcel.estimatedDelivery).toLocaleDateString() : "TBD",
      supportUrl: `${process.env.FRONTEND_URL}/user/support`
    }

    const template = await renderTemplate('delay_alert_default', variables, organizationId)
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: template.subject,
      html: template.html,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Delay alert sent to ${userEmail}`)
  } catch (error) {
    console.error("Delay alert error:", error.message)
  }
}
