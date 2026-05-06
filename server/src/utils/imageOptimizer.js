/**
 * ImageOptimizer — real compression using sharp
 *
 * Replaces the stub in carousel.controller.js
 * Compresses images to WebP and generates small thumbnails
 */
import sharp from 'sharp'

export class ImageOptimizer {
  /**
   * Compress a base64 image to WebP at reduced quality.
   * Returns a base64 string (data:image/webp;base64,...).
   * Falls back to original if anything fails.
   *
   * @param {string} base64String  — full data:image/xxx;base64,... string
   * @param {number} quality       — 1–100, default 80
   * @returns {Promise<string>}
   */
  static async compressBase64(base64String, quality = 80) {
    try {
      const buffer = ImageOptimizer._toBuffer(base64String)
      if (!buffer) return base64String

      const compressed = await sharp(buffer)
        .webp({ quality })
        .toBuffer()

      return `data:image/webp;base64,${compressed.toString('base64')}`
    } catch (err) {
      console.warn('[ImageOptimizer] compressBase64 failed, using original:', err.message)
      return base64String
    }
  }

  /**
   * Generate a small thumbnail (max 400px wide) as WebP.
   * Stored in image_thumbnail — served in list views.
   * Typically 10–20KB vs 500KB+ for full image.
   *
   * @param {string} base64String
   * @param {number} maxWidth     — default 400px
   * @returns {Promise<string|null>}
   */
  static async generateThumbnail(base64String, maxWidth = 400) {
    try {
      const buffer = ImageOptimizer._toBuffer(base64String)
      if (!buffer) return null

      const thumbnail = await sharp(buffer)
        .resize(maxWidth, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: 70 })
        .toBuffer()

      return `data:image/webp;base64,${thumbnail.toString('base64')}`
    } catch (err) {
      console.warn('[ImageOptimizer] generateThumbnail failed:', err.message)
      return null
    }
  }

  /**
   * Convert base64 data URL to a Buffer.
   * Returns null if format is invalid.
   * @private
   */
  static _toBuffer(base64String) {
    if (!base64String || !base64String.startsWith('data:image/')) return null
    const commaIdx = base64String.indexOf(',')
    if (commaIdx === -1) return null
    return Buffer.from(base64String.slice(commaIdx + 1), 'base64')
  }
}
