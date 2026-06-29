import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import { ensureAuthenticatedApi } from '../../auth/http/middleware/authMiddleware'
import AccessMiddleware from '../../access/http/middleware/AccessMiddleware'
import DashboardController from '../http/controllers/api/v1/DashboardController'
import { handler } from '@flazhost-nodeadmin/core'

const router = Router()
const dashboardRoute = named.extendRouter(Router())

dashboardRoute.get('api.v1.dashboard.index', '/api/v1/dashboard', ensureAuthenticatedApi, AccessMiddleware, handler(DashboardController, 'index'))

router.use(dashboardRoute)

export default router
