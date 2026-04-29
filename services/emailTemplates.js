import EmailTemplate from "../models/EmailTemplate.js"

export const renderTemplate = async (templateName, variables, organizationId = null) => {
  try {
    const template = await EmailTemplate.findOne({
      name: templateName,
      isActive: true,
      organizationId: organizationId || { $exists: false }
    }).populate('createdBy', 'firstName lastName')

    if (!template) {
      // Fallback to default template if custom template not found
      return getDefaultTemplate(templateName, variables)
    }

    let renderedContent = template.htmlContent
    let renderedSubject = template.subject

    // Replace variables in both subject and content
    template.variables.forEach(variable => {
      const value = variables[variable.name] || `[${variable.name}]`
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
      renderedContent = renderedContent.replace(regex, value)
      renderedSubject = renderedSubject.replace(regex, value)
    })

    return {
      subject: renderedSubject,
      html: renderedContent,
      template: template
    }
  } catch (error) {
    console.error('Template rendering error:', error)
    return getDefaultTemplate(templateName, variables)
  }
}

export const getDefaultTemplate = (templateName, variables) => {
  const defaultTemplates = {
    parcel_update: {
      subject: `Parcel Update: {{trackingId}}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007BFF;">Parcel Status Update</h2>
          <p>Your parcel has been updated:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tracking ID:</strong> {{trackingId}}</p>
            <p><strong>Courier:</strong> {{courier}}</p>
            <p><strong>Status:</strong> <span style="color: #00C851; font-weight: bold;">{{status}}</span></p>
            <p><strong>Current Location:</strong> {{currentLocation}}</p>
            <p><strong>Last Updated:</strong> {{updatedAt}}</p>
          </div>

          <p>Track your parcel in real-time:</p>
          <a href="{{trackingUrl}}" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Tracking Details
          </a>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from FreightSight. Please do not reply to this email.
          </p>
        </div>
      `,
      variables: ['trackingId', 'courier', 'status', 'currentLocation', 'updatedAt', 'trackingUrl']
    },
    welcome: {
      subject: "Welcome to FreightSight - Global Parcel Tracking",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007BFF;">Welcome to FreightSight, {{userName}}!</h2>
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

          <a href="{{trackingUrl}}" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Start Tracking Now
          </a>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Questions? Contact our support team at support@freightsight.com
          </p>
        </div>
      `,
      variables: ['userName', 'trackingUrl']
    },
    delay_alert: {
      subject: `Delay Alert: {{trackingId}}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B6B;">Delivery Delay Alert</h2>
          <p>Your parcel appears to be delayed:</p>
          
          <div style="background-color: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B6B;">
            <p><strong>Tracking ID:</strong> {{trackingId}}</p>
            <p><strong>Status:</strong> <span style="color: #FF6B6B; font-weight: bold;">Delayed</span></p>
            <p><strong>Expected Delivery:</strong> {{estimatedDelivery}}</p>
          </div>

          <p>We're monitoring your shipment closely. Contact our support team if you need assistance.</p>
          <a href="{{supportUrl}}" style="background-color: #FF6B6B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Contact Support
          </a>
        </div>
      `,
      variables: ['trackingId', 'estimatedDelivery', 'supportUrl']
    }
  }

  const template = defaultTemplates[templateName]
  if (!template) {
    throw new Error(`Template ${templateName} not found`)
  }

  let renderedContent = template.html
  let renderedSubject = template.subject

  template.variables.forEach(variable => {
    const value = variables[variable] || `[${variable}]`
    const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g')
    renderedContent = renderedContent.replace(regex, value)
    renderedSubject = renderedSubject.replace(regex, value)
  })

  return {
    subject: renderedSubject,
    html: renderedContent
  }
}

export const createDefaultTemplates = async (userId) => {
  const defaultTemplates = [
    {
      name: "parcel_update_default",
      type: "parcel_update",
      subject: "Parcel Update: {{trackingId}}",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007BFF;">Parcel Status Update</h2>
          <p>Your parcel has been updated:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tracking ID:</strong> {{trackingId}}</p>
            <p><strong>Courier:</strong> {{courier}}</p>
            <p><strong>Status:</strong> <span style="color: #00C851; font-weight: bold;">{{status}}</span></p>
            <p><strong>Current Location:</strong> {{currentLocation}}</p>
            <p><strong>Last Updated:</strong> {{updatedAt}}</p>
          </div>

          <p>Track your parcel in real-time:</p>
          <a href="{{trackingUrl}}" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Tracking Details
          </a>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from FreightSight. Please do not reply to this email.
          </p>
        </div>
      `,
      variables: [
        { name: "trackingId", description: "Parcel tracking ID", required: true },
        { name: "courier", description: "Courier company name", required: true },
        { name: "status", description: "Current parcel status", required: true },
        { name: "currentLocation", description: "Current location of parcel", required: false },
        { name: "updatedAt", description: "Last update timestamp", required: false },
        { name: "trackingUrl", description: "URL to track parcel", required: false }
      ],
      createdBy: userId
    },
    {
      name: "welcome_default",
      type: "welcome",
      subject: "Welcome to FreightSight - Global Parcel Tracking",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007BFF;">Welcome to FreightSight, {{userName}}!</h2>
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

          <a href="{{trackingUrl}}" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Start Tracking Now
          </a>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Questions? Contact our support team at support@freightsight.com
          </p>
        </div>
      `,
      variables: [
        { name: "userName", description: "User's name", required: true },
        { name: "trackingUrl", description: "URL to tracking page", required: false }
      ],
      createdBy: userId
    },
    {
      name: "delay_alert_default",
      type: "delay_alert",
      subject: "Delay Alert: {{trackingId}}",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B6B;">Delivery Delay Alert</h2>
          <p>Your parcel appears to be delayed:</p>
          
          <div style="background-color: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B6B;">
            <p><strong>Tracking ID:</strong> {{trackingId}}</p>
            <p><strong>Status:</strong> <span style="color: #FF6B6B; font-weight: bold;">Delayed</span></p>
            <p><strong>Expected Delivery:</strong> {{estimatedDelivery}}</p>
          </div>

          <p>We're monitoring your shipment closely. Contact our support team if you need assistance.</p>
          <a href="{{supportUrl}}" style="background-color: #FF6B6B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Contact Support
          </a>
        </div>
      `,
      variables: [
        { name: "trackingId", description: "Parcel tracking ID", required: true },
        { name: "estimatedDelivery", description: "Estimated delivery date", required: false },
        { name: "supportUrl", description: "URL to support page", required: false }
      ],
      createdBy: userId
    }
  ]

  try {
    for (const template of defaultTemplates) {
      const existing = await EmailTemplate.findOne({ name: template.name })
      if (!existing) {
        await EmailTemplate.create(template)
      }
    }
    console.log('Default email templates created successfully')
  } catch (error) {
    console.error('Error creating default email templates:', error)
  }
}
