import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import DashboardController from '../http/controllers/web/v1/DashboardController'
import { ensureAuthenticated } from '../../auth/http/middleware/authMiddleware'
import AccessMiddleware from '../../access/http/middleware/AccessMiddleware'
import { handler } from '@flazhost-nodeadmin/core'

const router = Router()

// define route & set middleware
const dashboardRoute = named.extendRouter(Router())
dashboardRoute.get('admin.v1.dashboard.index', '/admin/v1/dashboard', ensureAuthenticated, AccessMiddleware, handler(DashboardController, 'index'))

router.use(dashboardRoute)

export default router
