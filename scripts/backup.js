#!/usr/bin/env node

import mongoose from "mongoose"
import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"
import cron from "node-cron"
import AWS from "aws-sdk"
import tar from "tar"
import zlib from "zlib"
import { productionConfig } from "../config/production.js"

const execAsync = promisify(exec)

class BackupService {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: productionConfig.backup.s3.accessKey,
      secretAccessKey: productionConfig.backup.s3.secretKey,
      region: productionConfig.backup.s3.region
    })
    this.backupDir = path.join(process.cwd(), 'backups')
    this.logDir = path.join(process.cwd(), 'logs')
    
    // Ensure backup directory exists
    this.ensureDirectoryExists(this.backupDir)
    this.ensureDirectoryExists(this.logDir)
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  async createDatabaseBackup() {
    try {
      console.log("🔄 Starting database backup...")
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = `mongodb-backup-${timestamp}`
      const backupPath = path.join(this.backupDir, backupName)
      
      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true })
      
      // Extract database connection info
      const dbUri = productionConfig.database.uri
      const dbName = dbUri.split('/').pop().split('?')[0]
      
      // Use mongodump for backup
      const dumpCommand = `mongodump --uri="${dbUri}" --out="${backupPath}"`
      
      console.log("📦 Creating database dump...")
      await execAsync(dumpCommand)
      
      // Compress the backup
      const compressedPath = `${backupPath}.tar.gz`
      await this.compressDirectory(backupPath, compressedPath)
      
      // Remove uncompressed backup
      fs.rmSync(backupPath, { recursive: true, force: true })
      
      // Upload to S3
      if (productionConfig.backup.enabled) {
        await this.uploadToS3(compressedPath, `database/${backupName}.tar.gz`)
      }
      
      console.log(`✅ Database backup completed: ${compressedPath}`)
      return compressedPath
    } catch (error) {
      console.error("❌ Database backup failed:", error)
      throw error
    }
  }

  async createRedisBackup() {
    try {
      console.log("🔄 Starting Redis backup...")
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = `redis-backup-${timestamp}.rdb`
      const backupPath = path.join(this.backupDir, backupName)
      
      // Use redis-cli to create backup
      const redisCommand = `redis-cli --rdb "${backupPath}"`
      
      console.log("📦 Creating Redis dump...")
      await execAsync(redisCommand)
      
      // Upload to S3
      if (productionConfig.backup.enabled) {
        await this.uploadToS3(backupPath, `redis/${backupName}`)
      }
      
      console.log(`✅ Redis backup completed: ${backupPath}`)
      return backupPath
    } catch (error) {
      console.error("❌ Redis backup failed:", error)
      throw error
    }
  }

  async createFilesBackup() {
    try {
      console.log("🔄 Starting files backup...")
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = `files-backup-${timestamp}`
      const backupPath = path.join(this.backupDir, backupName)
      
      // Files to backup
      const filesToBackup = [
        'public/uploads',
        'logs',
        'config',
        '.env.production'
      ]
      
      // Create tar archive
      const tarPath = `${backupPath}.tar`
      await this.createTarArchive(filesToBackup, tarPath)
      
      // Compress the backup
      const compressedPath = `${backupPath}.tar.gz`
      await this.compressFile(tarPath, compressedPath)
      
      // Remove uncompressed tar
      fs.unlinkSync(tarPath)
      
      // Upload to S3
      if (productionConfig.backup.enabled) {
        await this.uploadToS3(compressedPath, `files/${backupName}.tar.gz`)
      }
      
      console.log(`✅ Files backup completed: ${compressedPath}`)
      return compressedPath
    } catch (error) {
      console.error("❌ Files backup failed:", error)
      throw error
    }
  }

  async compressDirectory(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip()
      const source = tar.create({ gzip: false, cwd: path.dirname(sourceDir) }, [path.basename(sourceDir)])
      const destination = fs.createWriteStream(outputPath)
      
      source.pipe(gzip).pipe(destination)
      
      destination.on('finish', () => resolve(outputPath))
      destination.on('error', reject)
      source.on('error', reject)
      gzip.on('error', reject)
    })
  }

  async compressFile(sourcePath, outputPath) {
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip()
      const source = fs.createReadStream(sourcePath)
      const destination = fs.createWriteStream(outputPath)
      
      source.pipe(gzip).pipe(destination)
      
      destination.on('finish', () => resolve(outputPath))
      destination.on('error', reject)
      source.on('error', reject)
      gzip.on('error', reject)
    })
  }

  async createTarArchive(files, outputPath) {
    return new Promise((resolve, reject) => {
      const tarStream = tar.create({ gzip: false }, files)
      const output = fs.createWriteStream(outputPath)
      
      tarStream.pipe(output)
      
      output.on('finish', () => resolve(outputPath))
      output.on('error', reject)
      tarStream.on('error', reject)
    })
  }

  async uploadToS3(filePath, s3Key) {
    try {
      console.log(`☁️ Uploading ${s3Key} to S3...`)
      
      const fileStream = fs.createReadStream(filePath)
      const uploadParams = {
        Bucket: productionConfig.backup.s3.bucket,
        Key: s3Key,
        Body: fileStream,
        StorageClass: 'STANDARD_IA', // Use Infrequent Access for cost savings
        ServerSideEncryption: 'AES256'
      }
      
      const result = await this.s3.upload(uploadParams).promise()
      console.log(`✅ Uploaded to S3: ${result.Location}`)
      
      return result.Location
    } catch (error) {
      console.error("❌ S3 upload failed:", error)
      throw error
    }
  }

  async cleanupOldBackups() {
    try {
      console.log("🧹 Cleaning up old backups...")
      
      // Clean up local backups
      const retentionDays = productionConfig.backup.retentionDays
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
      
      const backupFiles = fs.readdirSync(this.backupDir)
      
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          console.log(`🗑️ Deleted old backup: ${file}`)
        }
      }
      
      // Clean up S3 backups
      if (productionConfig.backup.enabled) {
        await this.cleanupS3Backups()
      }
      
      console.log("✅ Backup cleanup completed")
    } catch (error) {
      console.error("❌ Backup cleanup failed:", error)
      throw error
    }
  }

  async cleanupS3Backups() {
    try {
      const params = {
        Bucket: productionConfig.backup.s3.bucket,
        Prefix: 'backups/'
      }
      
      const objects = await this.s3.listObjectsV2(params).promise()
      const retentionDays = productionConfig.backup.retentionDays
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
      
      const objectsToDelete = objects.Contents.filter(obj => {
        return obj.LastModified < cutoffDate
      }).map(obj => ({ Key: obj.Key }))
      
      if (objectsToDelete.length > 0) {
        await this.s3.deleteObjects({
          Bucket: productionConfig.backup.s3.bucket,
          Delete: { Objects: objectsToDelete }
        }).promise()
        
        console.log(`🗑️ Deleted ${objectsToDelete.length} old S3 backups`)
      }
    } catch (error) {
      console.error("❌ S3 cleanup failed:", error)
      throw error
    }
  }

  async performFullBackup() {
    try {
      console.log("🚀 Starting full backup process...")
      const startTime = new Date()
      
      // Create all backups
      const [dbBackup, redisBackup, filesBackup] = await Promise.allSettled([
        this.createDatabaseBackup(),
        this.createRedisBackup(),
        this.createFilesBackup()
      ])
      
      // Log results
      const results = {
        database: dbBackup.status === 'fulfilled' ? 'success' : 'failed',
        redis: redisBackup.status === 'fulfilled' ? 'success' : 'failed',
        files: filesBackup.status === 'fulfilled' ? 'success' : 'failed'
      }
      
      // Clean up old backups
      await this.cleanupOldBackups()
      
      const endTime = new Date()
      const duration = endTime - startTime
      
      console.log(`✅ Full backup completed in ${duration}ms`)
      console.log("📊 Results:", results)
      
      // Log to file
      const logEntry = {
        timestamp: startTime.toISOString(),
        duration: duration,
        results: results
      }
      
      fs.appendFileSync(
        path.join(this.logDir, 'backup.log'),
        JSON.stringify(logEntry) + '\n'
      )
      
      return results
    } catch (error) {
      console.error("❌ Full backup failed:", error)
      throw error
    }
  }

  async restoreDatabase(backupPath) {
    try {
      console.log("🔄 Starting database restore...")
      
      // Extract backup if compressed
      if (backupPath.endsWith('.tar.gz')) {
        const extractPath = backupPath.replace('.tar.gz', '')
        await this.extractTarGz(backupPath, extractPath)
        backupPath = extractPath
      }
      
      // Use mongorestore to restore
      const dbUri = productionConfig.database.uri
      const restoreCommand = `mongorestore --uri="${dbUri}" --drop "${backupPath}"`
      
      console.log("📦 Restoring database...")
      await execAsync(restoreCommand)
      
      console.log("✅ Database restore completed")
    } catch (error) {
      console.error("❌ Database restore failed:", error)
      throw error
    }
  }

  async extractTarGz(filePath, extractPath) {
    return new Promise((resolve, reject) => {
      const gunzip = zlib.createGunzip()
      const source = fs.createReadStream(filePath)
      const destination = tar.extract({ cwd: path.dirname(filePath) })
      
      source.pipe(gunzip).pipe(destination)
      
      destination.on('finish', () => resolve(extractPath))
      destination.on('error', reject)
      source.on('error', reject)
      gunzip.on('error', reject)
    })
  }

  startScheduledBackups() {
    if (!productionConfig.backup.enabled) {
      console.log("⚠️ Backup scheduling is disabled")
      return
    }
    
    const schedule = productionConfig.backup.schedule
    console.log(`⏰ Starting scheduled backups: ${schedule}`)
    
    cron.schedule(schedule, async () => {
      try {
        console.log("🔄 Starting scheduled backup...")
        await this.performFullBackup()
        console.log("✅ Scheduled backup completed")
      } catch (error) {
        console.error("❌ Scheduled backup failed:", error)
        
        // Send alert notification
        await this.sendBackupAlert('Scheduled backup failed', error.message)
      }
    })
  }

  async sendBackupAlert(subject, message) {
    try {
      // Send email alert
      if (productionConfig.alerts.email.enabled) {
        await this.sendEmailAlert(subject, message)
      }
      
      // Send Slack alert
      if (productionConfig.alerts.slack.webhook) {
        await this.sendSlackAlert(subject, message)
      }
      
      // Send Discord alert
      if (productionConfig.alerts.discord.webhook) {
        await this.sendDiscordAlert(subject, message)
      }
    } catch (error) {
      console.error("❌ Failed to send backup alert:", error)
    }
  }

  async sendEmailAlert(subject, message) {
    // Implement email alert sending
    console.log(`📧 Email alert: ${subject} - ${message}`)
  }

  async sendSlackAlert(subject, message) {
    const payload = {
      text: subject,
      attachments: [{
        color: 'danger',
        text: message
      }]
    }
    
    await fetch(productionConfig.alerts.slack.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  async sendDiscordAlert(subject, message) {
    const payload = {
      embeds: [{
        title: subject,
        description: message,
        color: 0xFF0000,
        timestamp: new Date().toISOString()
      }]
    }
    
    await fetch(productionConfig.alerts.discord.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2]
  const backupService = new BackupService()
  
  switch (command) {
    case 'full':
      backupService.performFullBackup()
        .then(() => process.exit(0))
        .catch(error => {
          console.error(error)
          process.exit(1)
        })
      break
      
    case 'database':
      backupService.createDatabaseBackup()
        .then(() => process.exit(0))
        .catch(error => {
          console.error(error)
          process.exit(1)
        })
      break
      
    case 'redis':
      backupService.createRedisBackup()
        .then(() => process.exit(0))
        .catch(error => {
          console.error(error)
          process.exit(1)
        })
      break
      
    case 'files':
      backupService.createFilesBackup()
        .then(() => process.exit(0))
        .catch(error => {
          console.error(error)
          process.exit(1)
        })
      break
      
    case 'cleanup':
      backupService.cleanupOldBackups()
        .then(() => process.exit(0))
        .catch(error => {
          console.error(error)
          process.exit(1)
        })
      break
      
    case 'schedule':
      backupService.startScheduledBackups()
      console.log("📅 Backup scheduler started. Press Ctrl+C to stop.")
      
      // Keep process running
      process.on('SIGINT', () => {
        console.log("🛑 Stopping backup scheduler...")
        process.exit(0)
      })
      break
      
    default:
      console.log(`
Usage: node backup.js <command>

Commands:
  full      - Perform full backup (database, redis, files)
  database  - Backup database only
  redis     - Backup redis only
  files     - Backup files only
  cleanup   - Clean up old backups
  schedule  - Start scheduled backup service

Examples:
  node backup.js full
  node backup.js schedule
      `)
      process.exit(1)
  }
}

export default BackupService
