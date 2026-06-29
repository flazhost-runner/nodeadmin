import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import AccessMiddleware from '../../access/http/middleware/AccessMiddleware'
import { ensureAuthenticatedApi } from '../../auth/http/middleware/authMiddleware'
import { SettingValidator, upload } from '../http/validators/SettingValidator'
import SettingController from '../http/controllers/api/v1/SettingController'
import { handler } from '@flazhost-nodeadmin/core'

const router = Router()
const settingRoute = named.extendRouter(Router())

settingRoute.get('api.v1.setting.index', '/api/v1/setting', ensureAuthenticatedApi, AccessMiddleware, handler(SettingController, 'index'))
settingRoute.put('api.v1.setting.update', '/api/v1/setting/update', ensureAuthenticatedApi, AccessMiddleware, upload.any(), SettingValidator, handler(SettingController, 'update'))

router.use(settingRoute)

export default router
