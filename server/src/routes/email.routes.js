import { Router } from 'express'
import { EmailController } from '../controllers/email.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.use(authenticate)
router.use(authorize('admin', 'super_admin'))

router.get('/stats', asyncHandler(EmailController.getStats))
router.post('/preview', asyncHandler(EmailController.preview))
router.post('/send-bulk', asyncHandler(EmailController.sendBulk))

export default router
