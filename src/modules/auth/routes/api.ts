import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import AuthController from '../http/controllers/api/v1/AuthController'
import { ensureAuthenticatedApi } from '../../auth/http/middleware/authMiddleware'
import { UserCreateValidator } from '../../access/http/validators/UserCreateValidator'
import { ResetPasswordProcessValidator } from '../http/validators/ResetPasswordProcessValidator'
import { authLimiter, otpLimiter } from '@flazhost-nodeadmin/core'

const router = named.extendRouter(Router())

const authController = new AuthController
router.post('api.v1.auth.login', '/api/v1/auth/login', authLimiter, authController.login.bind(authController))
router.post('api.v1.auth.logout', '/api/v1/auth/logout', ensureAuthenticatedApi, authController.logout.bind(authController))
router.post('api.v1.auth.register', '/api/v1/auth/register', authLimiter, UserCreateValidator, authController.register.bind(authController))
router.post('api.v1.auth.reset.request', '/api/v1/auth/reset/request', authLimiter, authController.request.bind(authController))
router.post('api.v1.auth.reset.process', '/api/v1/auth/reset/process', otpLimiter, ResetPasswordProcessValidator, authController.process.bind(authController))

export default router
