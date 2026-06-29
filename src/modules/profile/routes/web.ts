import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import AccessMiddleware from '../../access/http/middleware/AccessMiddleware'
import { ensureAuthenticated } from '../../auth/http/middleware/authMiddleware'
import { upload, ProfileUpdateValidator } from '../http/validators/ProfileUpdateValidator'
import ProfileController from '../http/controllers/web/v1/ProfileController'
import { handler } from '@flazhost-nodeadmin/core'
const router = Router()

// define route & set middleware user
const profileRoute = named.extendRouter(Router())

profileRoute.get('admin.v1.profile.index', '/admin/v1/profile', ensureAuthenticated, AccessMiddleware, handler(ProfileController, 'index'))
profileRoute.put('admin.v1.profile.update', '/admin/v1/profile/update', ensureAuthenticated, AccessMiddleware, upload.any(), ProfileUpdateValidator, handler(ProfileController, 'update'))

router.use(profileRoute)

export default router
