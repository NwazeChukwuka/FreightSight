import EventEmitter from "events"
import fs from "fs"
import path from "path"
import { performance } from "perf_hooks"
import os from "os"
import { productionConfig } from "../config/production.js"

class AlertService extends EventEmitter {
  constructor() {
    super()
    this.alertHistory = []
    this.alertThresholds = {
      cpu: 80, // 80% CPU usage
      memory: 85, // 85% memory usage
      disk: 90, // 90% disk usage
      responseTime: 5000, // 5 seconds response time
      errorRate: 5, // 5% error rate
      queueSize: 1000 // 1000 items in queue
    }
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      cpu: [],
      memory: [],
      disk: []
    }
    this.alertCooldowns = new Map() // Prevent alert spam
    
    // Start monitoring
    this.startMonitoring()
  }

  startMonitoring() {
    if (!productionConfig.monitoring.enabled) {
      console.log("⚠️ Monitoring is disabled")
      return
    }

    console.log("🔍 Starting monitoring service...")
    
    // System monitoring every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics()
    }, 30000)
    
    // Application monitoring every 10 seconds
    setInterval(() => {
      this.collectApplicationMetrics()
    }, 10000)
    
    // Alert processing every 5 seconds
    setInterval(() => {
      this.processAlerts()
    }, 5000)
    
    // Cleanup old metrics every hour
    setInterval(() => {
      this.cleanupMetrics()
    }, 3600000)
  }

  collectSystemMetrics() {
    try {
      // CPU usage
      const cpuUsage = process.cpuUsage()
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / (os.cpus().length * 1000000) * 100
      this.metrics.cpu.push({
        timestamp: Date.now(),
        value: cpuPercent
      })
      
      // Memory usage
      const memoryUsage = process.memoryUsage()
      const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      this.metrics.memory.push({
        timestamp: Date.now(),
        value: memoryPercent
      })
      
      // Disk usage (simplified - in production, use proper disk monitoring)
      const stats = fs.statSync(process.cwd())
      this.metrics.disk.push({
        timestamp: Date.now(),
        value: 0 // Placeholder
      })
      
      // Keep only last 100 data points
      Object.keys(this.metrics).forEach(key => {
        if (Array.isArray(this.metrics[key]) && this.metrics[key].length > 100) {
          this.metrics[key] = this.metrics[key].slice(-100)
        }
      })
      
    } catch (error) {
      console.error("❌ Error collecting system metrics:", error)
    }
  }

  collectApplicationMetrics() {
    try {
      // Calculate average response time
      if (this.metrics.responseTime.length > 0) {
        const avgResponseTime = this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
        this.checkThreshold('responseTime', avgResponseTime)
      }
      
      // Calculate error rate
      const errorRate = this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0
      this.checkThreshold('errorRate', errorRate)
      
    } catch (error) {
      console.error("❌ Error collecting application metrics:", error)
    }
  }

  recordRequest(responseTime, isError = false) {
    this.metrics.requests++
    this.metrics.responseTime.push(responseTime)
    
    if (isError) {
      this.metrics.errors++
    }
    
    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000)
    }
  }

  checkThreshold(metric, value) {
    const threshold = this.alertThresholds[metric]
    if (threshold && value > threshold) {
      this.triggerAlert(metric, value, threshold)
    }
  }

  async triggerAlert(type, value, threshold) {
    const alertKey = `${type}-${Math.floor(value / 10)}`
    const now = Date.now()
    
    // Check cooldown (5 minutes)
    if (this.alertCooldowns.has(alertKey)) {
      const lastAlert = this.alertCooldowns.get(alertKey)
      if (now - lastAlert < 300000) {
        return // Skip due to cooldown
      }
    }
    
    this.alertCooldowns.set(alertKey, now)
    
    const alert = {
      id: Date.now().toString(),
      type,
      severity: this.getSeverity(type, value, threshold),
      title: this.getAlertTitle(type, value, threshold),
      message: this.getAlertMessage(type, value, threshold),
      timestamp: new Date().toISOString(),
      value,
      threshold,
      resolved: false
    }
    
    this.alertHistory.push(alert)
    
    // Keep only last 1000 alerts
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000)
    }
    
    console.warn(`🚨 ALERT: ${alert.title}`)
    
    // Send notifications
    await this.sendNotifications(alert)
    
    // Emit event
    this.emit('alert', alert)
  }

  getSeverity(type, value, threshold) {
    const ratio = value / threshold
    
    if (ratio >= 2) return 'critical'
    if (ratio >= 1.5) return 'high'
    if (ratio >= 1.2) return 'medium'
    return 'low'
  }

  getAlertTitle(type, value, threshold) {
    const titles = {
      cpu: `High CPU Usage`,
      memory: `High Memory Usage`,
      disk: `High Disk Usage`,
      responseTime: `Slow Response Time`,
      errorRate: `High Error Rate`,
      queueSize: `Large Queue Size`
    }
    
    return titles[type] || 'System Alert'
  }

  getAlertMessage(type, value, threshold) {
    const messages = {
      cpu: `CPU usage is ${value.toFixed(2)}% (threshold: ${threshold}%)`,
      memory: `Memory usage is ${value.toFixed(2)}% (threshold: ${threshold}%)`,
      disk: `Disk usage is ${value.toFixed(2)}% (threshold: ${threshold}%)`,
      responseTime: `Average response time is ${value.toFixed(2)}ms (threshold: ${threshold}ms)`,
      errorRate: `Error rate is ${value.toFixed(2)}% (threshold: ${threshold}%)`,
      queueSize: `Queue size is ${value} (threshold: ${threshold})`
    }
    
    return messages[type] || `Threshold exceeded: ${value} > ${threshold}`
  }

  async sendNotifications(alert) {
    try {
      // Send email notification
      if (productionConfig.alerts.email.enabled) {
        await this.sendEmailAlert(alert)
      }
      
      // Send Slack notification
      if (productionConfig.alerts.slack.webhook) {
        await this.sendSlackAlert(alert)
      }
      
      // Send Discord notification
      if (productionConfig.alerts.discord.webhook) {
        await this.sendDiscordAlert(alert)
      }
      
      // Log to file
      this.logAlert(alert)
      
    } catch (error) {
      console.error("❌ Error sending notifications:", error)
    }
  }

  async sendEmailAlert(alert) {
    try {
      const nodemailer = require("nodemailer")
      
      const transporter = nodemailer.createTransporter({
        host: productionConfig.email.host,
        port: productionConfig.email.port,
        secure: productionConfig.email.secure,
        auth: {
          user: productionConfig.email.auth.user,
          pass: productionConfig.email.auth.pass
        }
      })
      
      const mailOptions = {
        from: productionConfig.email.from,
        to: productionConfig.alerts.email.to.join(', '),
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">🚨 ${alert.title}</h2>
              <p style="margin: 5px 0 0 0;">Severity: ${alert.severity.toUpperCase()}</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
              <p><strong>Message:</strong> ${alert.message}</p>
              <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
              <p><strong>Value:</strong> ${alert.value}</p>
              <p><strong>Threshold:</strong> ${alert.threshold}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 12px;">
                This is an automated alert from FreightSight Monitoring System.
              </p>
            </div>
          </div>
        `
      }
      
      await transporter.sendMail(mailOptions)
      console.log(`📧 Email alert sent: ${alert.title}`)
      
    } catch (error) {
      console.error("❌ Failed to send email alert:", error)
    }
  }

  async sendSlackAlert(alert) {
    try {
      const colors = {
        low: 'good',
        medium: 'warning',
        high: 'danger',
        critical: 'danger'
      }
      
      const payload = {
        text: `🚨 ${alert.title}`,
        attachments: [{
          color: colors[alert.severity],
          fields: [
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Value', value: alert.value.toString(), short: true },
            { title: 'Threshold', value: alert.threshold.toString(), short: true },
            { title: 'Time', value: new Date(alert.timestamp).toLocaleString(), short: false }
          ],
          text: alert.message,
          footer: 'FreightSight Monitoring',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
        }]
      }
      
      const response = await fetch(productionConfig.alerts.slack.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        console.log(`💬 Slack alert sent: ${alert.title}`)
      } else {
        throw new Error(`Slack API error: ${response.statusText}`)
      }
      
    } catch (error) {
      console.error("❌ Failed to send Slack alert:", error)
    }
  }

  async sendDiscordAlert(alert) {
    try {
      const colors = {
        low: 0x00FF00, // Green
        medium: 0xFFFF00, // Yellow
        high: 0xFF6600, // Orange
        critical: 0xFF0000 // Red
      }
      
      const payload = {
        embeds: [{
          title: `🚨 ${alert.title}`,
          description: alert.message,
          color: colors[alert.severity],
          fields: [
            { name: 'Severity', value: alert.severity.toUpperCase(), inline: true },
            { name: 'Value', value: alert.value.toString(), inline: true },
            { name: 'Threshold', value: alert.threshold.toString(), inline: true },
            { name: 'Time', value: new Date(alert.timestamp).toLocaleString(), inline: false }
          ],
          footer: { text: 'FreightSight Monitoring System' },
          timestamp: alert.timestamp
        }]
      }
      
      const response = await fetch(productionConfig.alerts.discord.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        console.log(`🎮 Discord alert sent: ${alert.title}`)
      } else {
        throw new Error(`Discord API error: ${response.statusText}`)
      }
      
    } catch (error) {
      console.error("❌ Failed to send Discord alert:", error)
    }
  }

  logAlert(alert) {
    try {
      const logDir = path.join(process.cwd(), 'logs')
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
      
      const logFile = path.join(logDir, 'alerts.log')
      const logEntry = JSON.stringify(alert) + '\n'
      
      fs.appendFileSync(logFile, logEntry)
      
    } catch (error) {
      console.error("❌ Failed to log alert:", error)
    }
  }

  getSeverityColor(severity) {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    }
    
    return colors[severity] || '#6c757d'
  }

  processAlerts() {
    // Check for resolved alerts
    this.alertHistory.forEach(alert => {
      if (!alert.resolved) {
        const currentValue = this.getCurrentValue(alert.type)
        if (currentValue !== null && currentValue < alert.threshold * 0.8) {
          alert.resolved = true
          alert.resolvedAt = new Date().toISOString()
          this.emit('alertResolved', alert)
        }
      }
    })
  }

  getCurrentValue(type) {
    const latestMetrics = {
      cpu: this.metrics.cpu[this.metrics.cpu.length - 1]?.value,
      memory: this.metrics.memory[this.metrics.memory.length - 1]?.value,
      disk: this.metrics.disk[this.metrics.disk.length - 1]?.value,
      responseTime: this.metrics.responseTime.length > 0 ? 
        this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length : null,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0
    }
    
    return latestMetrics[type] || null
  }

  cleanupMetrics() {
    // Remove metrics older than 1 hour
    const oneHourAgo = Date.now() - 3600000
    
    Object.keys(this.metrics).forEach(key => {
      if (Array.isArray(this.metrics[key])) {
        this.metrics[key] = this.metrics[key].filter(metric => 
          metric.timestamp > oneHourAgo
        )
      }
    })
    
    // Remove resolved alerts older than 24 hours
    const oneDayAgo = Date.now() - 86400000
    this.alertHistory = this.alertHistory.filter(alert => {
      if (alert.resolved && alert.resolvedAt) {
        return new Date(alert.resolvedAt).getTime() > oneDayAgo
      }
      return new Date(alert.timestamp).getTime() > oneDayAgo
    })
  }

  getMetrics() {
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      avgResponseTime: this.metrics.responseTime.length > 0 ? 
        this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length : 0,
      currentCPU: this.metrics.cpu[this.metrics.cpu.length - 1]?.value || 0,
      currentMemory: this.metrics.memory[this.metrics.memory.length - 1]?.value || 0,
      currentDisk: this.metrics.disk[this.metrics.disk.length - 1]?.value || 0,
      activeAlerts: this.alertHistory.filter(alert => !alert.resolved).length,
      totalAlerts: this.alertHistory.length
    }
  }

  getAlerts(limit = 50) {
    return this.alertHistory.slice(-limit).reverse()
  }

  setThreshold(metric, value) {
    this.alertThresholds[metric] = value
    console.log(`📊 Updated threshold for ${metric}: ${value}`)
  }

  createCustomAlert(title, message, severity = 'medium') {
    const alert = {
      id: Date.now().toString(),
      type: 'custom',
      severity,
      title,
      message,
      timestamp: new Date().toISOString(),
      value: null,
      threshold: null,
      resolved: false
    }
    
    this.alertHistory.push(alert)
    this.sendNotifications(alert)
    this.emit('alert', alert)
    
    return alert
  }
}

// Singleton instance
const alertService = new AlertService()

export default alertService
