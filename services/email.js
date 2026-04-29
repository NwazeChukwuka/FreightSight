import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export const sendParcelStatusEmail = async (userEmail, parcel) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Parcel Update: ${parcel.trackingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007BFF;">Parcel Status Update</h2>
          <p>Your parcel has been updated:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tracking ID:</strong> ${parcel.trackingId}</p>
            <p><strong>Courier:</strong> ${parcel.courier}</p>
            <p><strong>Status:</strong> <span style="color: #00C851; font-weight: bold;">${parcel.status}</span></p>
            <p><strong>Current Location:</strong> ${parcel.currentLocation?.city}, ${parcel.currentLocation?.country}</p>
            <p><strong>Last Updated:</strong> ${new Date(parcel.updatedAt).toLocaleString()}</p>
          </div>

          <p>Track your parcel in real-time:</p>
          <a href="${process.env.FRONTEND_URL}/track?id=${parcel.trackingId}" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Tracking Details
          </a>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from FreightSight. Please do not reply to this email.
          </p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email sent to ${userEmail} for tracking ${parcel.trackingId}`)
  } catch (error) {
    console.error("Email sending error:", error.message)
  }
}

export const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Welcome to FreightSight - Global Parcel Tracking",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007BFF;">Welcome to FreightSight, ${userName}!</h2>
          <p>Thank you for joining FreightSight, your global parcel tracking solution.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Get Started:</h3>
            <ul>
              <li>Track parcels from 100+ courier networks worldwide</li>
              <li>Get real-time updates and notifications</li>
              <li>View live route maps with Google Maps integration</li>
              <li>Manage your tracking history and preferences</li>
            </ul>
          </div>

          <a href="${process.env.FRONTEND_URL}/track" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Start Tracking Now
          </a>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Questions? Contact our support team at support@freightsight.com
          </p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Welcome email sent to ${userEmail}`)
  } catch (error) {
    console.error("Welcome email error:", error.message)
  }
}

export const sendDelayAlert = async (userEmail, parcel) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Delay Alert: ${parcel.trackingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B6B;">Delivery Delay Alert</h2>
          <p>Your parcel appears to be delayed:</p>
          
          <div style="background-color: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B6B;">
            <p><strong>Tracking ID:</strong> ${parcel.trackingId}</p>
            <p><strong>Status:</strong> <span style="color: #FF6B6B; font-weight: bold;">Delayed</span></p>
            <p><strong>Expected Delivery:</strong> ${parcel.estimatedDelivery ? new Date(parcel.estimatedDelivery).toLocaleDateString() : "TBD"}</p>
          </div>

          <p>We're monitoring your shipment closely. Contact our support team if you need assistance.</p>
          <a href="${process.env.FRONTEND_URL}/user/support" style="background-color: #FF6B6B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Contact Support
          </a>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Delay alert sent to ${userEmail}`)
  } catch (error) {
    console.error("Delay alert error:", error.message)
  }
}
