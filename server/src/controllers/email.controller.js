import { sendBulkEmail, buildEmailTemplate } from '../services/emailService.js'
import { success, error, badRequest } from '../utils/response.js'
import { Logger } from '../utils/logger.js'
import { getDB } from '../database/connection.js'

const logger = Logger.getInstance()

export class EmailController {
  /**
   * Send bulk email to all users of a restaurant
   * POST /api/v1/admin/email/send-bulk
   * Body: { subject, title, body, ctaText?, ctaUrl?, targetAll? }
   * Auth: admin or super_admin
   */
  static async sendBulk(req, res) {
    try {
      const { subject, title, body, ctaText, ctaUrl, targetAll } = req.body
      const userRole = req.user?.role
      const restaurantId = req.user?.restaurant_id

      if (!subject || !title || !body) {
        return badRequest(res, 'subject, title, and body are required')
      }

      // Super admin can send to all restaurants
      const targetRestaurantId = (userRole === 'super_admin' && targetAll) ? null : restaurantId

      // Get restaurant name for email template
      const db = getDB()
      let restaurantName = 'Vishnu Hastkala Kendra'
      if (targetRestaurantId) {
        const r = db.prepare('SELECT name FROM restaurants WHERE id = ?').get(targetRestaurantId)
        if (r) restaurantName = r.name
      }

      const htmlBody = buildEmailTemplate({ title, body, restaurantName, ctaText, ctaUrl })

      const result = await sendBulkEmail({
        subject,
        htmlBody,
        restaurantId: targetRestaurantId,
        senderName: restaurantName,
      })

      logger.info('Bulk email sent', { ...result, by: req.user?.id })

      return success(res, result, `Email sent to ${result.sent} users${result.failed > 0 ? `, ${result.failed} failed` : ''}`)
    } catch (err) {
      logger.error('Send bulk email failed', { error: err.message })
      return error(res, 'Failed to send emails: ' + err.message)
    }
  }

  /**
   * Preview email template
   * POST /api/v1/admin/email/preview
   */
  static preview(req, res) {
    try {
      const { subject, title, body, ctaText, ctaUrl } = req.body
      const db = getDB()
      const restaurantId = req.user?.restaurant_id
      let restaurantName = 'Vishnu Hastkala Kendra'
      if (restaurantId) {
        const r = db.prepare('SELECT name FROM restaurants WHERE id = ?').get(restaurantId)
        if (r) restaurantName = r.name
      }

      const html = buildEmailTemplate({ title, body, restaurantName, ctaText, ctaUrl })
      return success(res, { html, subject })
    } catch (err) {
      return error(res, 'Failed to generate preview')
    }
  }

  /**
   * Get email stats — how many users have emails
   * GET /api/v1/admin/email/stats
   */
  static getStats(req, res) {
    try {
      const db = getDB()
      const restaurantId = req.user?.restaurant_id
      const userRole = req.user?.role

      let query = `SELECT COUNT(*) as count FROM users WHERE email IS NOT NULL AND email != '' AND is_active = 1`
      const params = []

      if (userRole !== 'super_admin' && restaurantId) {
        query += ` AND restaurant_id = ?`
        params.push(restaurantId)
      }

      const result = db.prepare(query).get(...params)
      return success(res, { emailCount: result.count })
    } catch (err) {
      return error(res, 'Failed to get email stats')
    }
  }
}
