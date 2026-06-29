import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import AccessMiddleware from '../../access/http/middleware/AccessMiddleware'
import { ensureAuthenticated } from '../../auth/http/middleware/authMiddleware'
import { upload } from '../http/validators/MediaUploadValidator'
import MediaController from '../http/controllers/web/v1/MediaController'
import { handler } from '@flazhost-nodeadmin/core'

const router = Router()
const mediaRoute = named.extendRouter(Router())

// File manager rich text editor (web — session + CSRF). Bukan /api.
mediaRoute.get('admin.v1.media.list', '/admin/v1/media/list', ensureAuthenticated, AccessMiddleware, handler(MediaController, 'list'))
mediaRoute.post('admin.v1.media.upload', '/admin/v1/media/upload', ensureAuthenticated, AccessMiddleware, upload.single('file'), handler(MediaController, 'upload'))
mediaRoute.post('admin.v1.media.delete', '/admin/v1/media/delete', ensureAuthenticated, AccessMiddleware, handler(MediaController, 'destroy'))
// Proxy view gambar editor → 302 ke presigned URL OSS (bucket private). Wildcard nama file.
mediaRoute.get('admin.v1.media.file', '/admin/v1/media/file/*', ensureAuthenticated, AccessMiddleware, handler(MediaController, 'file'))

router.use(mediaRoute)

export default router
