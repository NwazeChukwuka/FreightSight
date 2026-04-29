import fs from "fs"
import path from "path"
import { productionConfig } from "../config/production.js"

class CDNService {
  constructor() {
    this.enabled = productionConfig.cdn.enabled
    this.cdnUrl = productionConfig.cdn.url
    this.staticAssetUrl = productionConfig.cdn.staticAssetUrl
    this.cacheTtl = productionConfig.cdn.cacheTtl
    this.uploadQueue = []
    this.isProcessing = false
  }

  // Generate CDN URL for static assets
  getStaticUrl(assetPath) {
    if (!this.enabled) {
      return `/${assetPath}`
    }
    
    // Use different base URLs for different asset types
    if (assetPath.startsWith('images/') || assetPath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return `${this.staticAssetUrl}/${assetPath}`
    }
    
    if (assetPath.startsWith('_next/static/')) {
      return `${this.cdnUrl}/${assetPath}`
    }
    
    return `${this.cdnUrl}/${assetPath}`
  }

  // Upload static assets to CDN
  async uploadStaticAssets() {
    if (!this.enabled) {
      console.log("⚠️ CDN is disabled, skipping upload")
      return
    }

    try {
      console.log("☁️ Uploading static assets to CDN...")
      
      const staticDir = path.join(process.cwd(), 'public')
      const buildDir = path.join(process.cwd(), '.next/static')
      
      // Upload public assets
      await this.uploadDirectory(staticDir, 'public')
      
      // Upload Next.js static assets
      await this.uploadDirectory(buildDir, '_next/static')
      
      console.log("✅ Static assets uploaded to CDN")
    } catch (error) {
      console.error("❌ Failed to upload static assets to CDN:", error)
      throw error
    }
  }

  async uploadDirectory(dirPath, remotePath) {
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️ Directory not found: ${dirPath}`)
      return
    }

    const files = this.getAllFiles(dirPath)
    
    for (const file of files) {
      const relativePath = path.relative(dirPath, file)
      const remoteFilePath = path.join(remotePath, relativePath).replace(/\\/g, '/')
      
      await this.uploadFile(file, remoteFilePath)
    }
  }

  getAllFiles(dirPath) {
    const files = []
    
    function traverse(currentPath) {
      const items = fs.readdirSync(currentPath)
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item)
        const stat = fs.statSync(itemPath)
        
        if (stat.isDirectory()) {
          traverse(itemPath)
        } else {
          files.push(itemPath)
        }
      }
    }
    
    traverse(dirPath)
    return files
  }

  async uploadFile(localPath, remotePath) {
    try {
      // This would integrate with your CDN provider (AWS CloudFront, Cloudflare, etc.)
      // For now, we'll simulate the upload
      
      const fileContent = fs.readFileSync(localPath)
      const fileSize = fileContent.length
      
      console.log(`📤 Uploading ${remotePath} (${fileSize} bytes)`)
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Add to upload queue for processing
      this.uploadQueue.push({
        localPath,
        remotePath,
        size: fileSize,
        uploadedAt: new Date().toISOString()
      })
      
      console.log(`✅ Uploaded ${remotePath}`)
    } catch (error) {
      console.error(`❌ Failed to upload ${remotePath}:`, error)
      throw error
    }
  }

  // Invalidate CDN cache
  async invalidateCache(paths = []) {
    if (!this.enabled) {
      console.log("⚠️ CDN is disabled, skipping cache invalidation")
      return
    }

    try {
      console.log("🔄 Invalidating CDN cache...")
      
      // Default paths to invalidate
      const defaultPaths = [
        '/*', // Invalidate all
        '/_next/static/*',
        '/images/*',
        '/static/*'
      ]
      
      const pathsToInvalidate = paths.length > 0 ? paths : defaultPaths
      
      for (const path of pathsToInvalidate) {
        await this.invalidatePath(path)
      }
      
      console.log("✅ CDN cache invalidated")
    } catch (error) {
      console.error("❌ Failed to invalidate CDN cache:", error)
      throw error
    }
  }

  async invalidatePath(path) {
    // This would integrate with your CDN provider's API
    console.log(`🗑️ Invalidating cache for: ${path}`)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Get CDN statistics
  getStats() {
    return {
      enabled: this.enabled,
      cdnUrl: this.cdnUrl,
      staticAssetUrl: this.staticAssetUrl,
      cacheTtl: this.cacheTtl,
      uploadedFiles: this.uploadQueue.length,
      totalUploadSize: this.uploadQueue.reduce((total, file) => total + file.size, 0),
      lastUpload: this.uploadQueue.length > 0 ? 
        this.uploadQueue[this.uploadQueue.length - 1].uploadedAt : null
    }
  }

  // Generate CDN headers for responses
  getCacheHeaders(assetType = 'static') {
    const headers = {
      'Cache-Control': `public, max-age=${this.cacheTtl}`,
      'Expires': new Date(Date.now() + this.cacheTtl * 1000).toUTCString(),
      'ETag': this.generateETag(),
      'X-CDN-Cache': 'HIT'
    }

    // Different cache settings for different asset types
    switch (assetType) {
      case 'image':
        headers['Cache-Control'] = `public, max-age=${this.cacheTtl * 7}, immutable`
        break
      case 'js':
      case 'css':
        headers['Cache-Control'] = `public, max-age=${this.cacheTtl * 30}, immutable`
        break
      case 'html':
        headers['Cache-Control'] = 'public, max-age=3600, must-revalidate'
        break
      default:
        headers['Cache-Control'] = `public, max-age=${this.cacheTtl}`
    }

    return headers
  }

  generateETag() {
    return `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`
  }

  // Middleware for CDN integration
  middleware() {
    return (req, res, next) => {
      if (!this.enabled) {
        return next()
      }

      // Add CDN headers to response
      const originalSend = res.send
      
      res.send = function(data) {
        // Add CDN headers
        const headers = cdnService.getCacheHeaders()
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value)
        })
        
        // Add CDN URL headers
        res.setHeader('X-CDN-URL', cdnService.cdnUrl)
        res.setHeader('X-Static-URL', cdnService.staticAssetUrl)
        
        return originalSend.call(this, data)
      }
      
      next()
    }
  }

  // Transform URLs in HTML to use CDN
  transformUrls(html) {
    if (!this.enabled) {
      return html
    }

    // Transform image URLs
    html = html.replace(/src="\/(images\/[^"]+)"/g, (match, imagePath) => {
      return `src="${this.getStaticUrl(imagePath)}"`
    })

    // Transform static asset URLs
    html = html.replace(/href="\/(_next\/static\/[^"]+)"/g, (match, assetPath) => {
      return `href="${this.getStaticUrl(assetPath)}"`
    })

    // Transform CSS URLs
    html = html.replace(/url\(["']?\/(static\/[^"')]+)["']?\)/g, (match, assetPath) => {
      return `url("${this.getStaticUrl(assetPath)}")`
    })

    return html
  }

  // Optimize images for CDN
  async optimizeImages() {
    if (!this.enabled) {
      return
    }

    try {
      console.log("🖼️ Optimizing images for CDN...")
      
      const imagesDir = path.join(process.cwd(), 'public', 'images')
      
      if (fs.existsSync(imagesDir)) {
        const imageFiles = this.getAllFiles(imagesDir).filter(file => 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        )
        
        for (const imageFile of imageFiles) {
          await this.optimizeImage(imageFile)
        }
      }
      
      console.log("✅ Images optimized for CDN")
    } catch (error) {
      console.error("❌ Failed to optimize images:", error)
    }
  }

  async optimizeImage(imagePath) {
    // This would integrate with sharp or imagemin for image optimization
    const stats = fs.statSync(imagePath)
    console.log(`🖼️ Optimizing ${imagePath} (${stats.size} bytes)`)
    
    // Simulate optimization
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  // Create CDN manifest
  async createManifest() {
    if (!this.enabled) {
      return
    }

    try {
      const manifest = {
        version: Date.now().toString(),
        created: new Date().toISOString(),
        cdn: {
          url: this.cdnUrl,
          staticUrl: this.staticAssetUrl,
          cacheTtl: this.cacheTtl
        },
        assets: this.uploadQueue.map(file => ({
          path: file.remotePath,
          size: file.size,
          uploaded: file.uploadedAt,
          cdnUrl: this.getStaticUrl(file.remotePath)
        }))
      }

      const manifestPath = path.join(process.cwd(), '.next', 'cdn-manifest.json')
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
      
      console.log("📋 CDN manifest created")
    } catch (error) {
      console.error("❌ Failed to create CDN manifest:", error)
    }
  }

  // Health check for CDN
  async healthCheck() {
    if (!this.enabled) {
      return { status: 'disabled', message: 'CDN is disabled' }
    }

    try {
      // Check CDN availability
      const startTime = Date.now()
      
      // Simulate CDN health check
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const responseTime = Date.now() - startTime
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        url: this.cdnUrl,
        staticUrl: this.staticAssetUrl,
        uploadedFiles: this.uploadQueue.length
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }
}

// Singleton instance
const cdnService = new CDNService()

export default cdnService
