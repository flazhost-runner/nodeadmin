import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import AccessMiddleware from '../../access/http/middleware/AccessMiddleware'
import { ensureAuthenticated } from '../../auth/http/middleware/authMiddleware'
import { SettingValidator, upload } from '../http/validators/SettingValidator'
import SettingController from '../http/controllers/web/v1/SettingController'
import { handler } from '@flazhost-nodeadmin/core'
const router = Router()

// define route & set middleware user
const settingRoute = named.extendRouter(Router())

settingRoute.get('admin.v1.setting.index', '/admin/v1/setting', ensureAuthenticated, AccessMiddleware, handler(SettingController, 'index'))
settingRoute.get('admin.v1.setting.fe_preview', '/admin/v1/setting/fe-preview/:slug', ensureAuthenticated, AccessMiddleware, handler(SettingController, 'fePreview'))
settingRoute.put('admin.v1.setting.update', '/admin/v1/setting/update', ensureAuthenticated, AccessMiddleware, upload.any(), SettingValidator, handler(SettingController, 'update'))

router.use(settingRoute)

export default router
