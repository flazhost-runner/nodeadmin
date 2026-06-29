import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import AccessMiddleware from '../../access/http/middleware/AccessMiddleware'
import { ensureAuthenticatedApi } from '../../auth/http/middleware/authMiddleware'
import { upload, ProfileUpdateValidator } from '../http/validators/ProfileUpdateValidator'
import ProfileController from '../http/controllers/api/v1/ProfileController'
import { handler } from '@flazhost-nodeadmin/core'
const router = Router()

// define route & set middleware user
const profileRoute = named.extendRouter(Router())

profileRoute.get('api.v1.profile.index', '/api/v1/profile', ensureAuthenticatedApi, AccessMiddleware, handler(ProfileController, 'index'))
profileRoute.put('api.v1.profile.update', '/api/v1/profile/update', ensureAuthenticatedApi, AccessMiddleware, upload.any(), ProfileUpdateValidator, handler(ProfileController, 'update'))

router.use(profileRoute)

export default router
