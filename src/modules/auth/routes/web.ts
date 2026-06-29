import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import passport from 'passport'
import AuthController from '../http/controllers/web/v1/AuthController'
import { UserCreateValidator } from '../../access/http/validators/UserCreateValidator'
import { ResetPasswordProcessValidator } from '../http/validators/ResetPasswordProcessValidator'
import { authLimiter, otpLimiter } from '@flazhost-nodeadmin/core'
import { handler } from '@flazhost-nodeadmin/core'

const router = Router()

const authRoute = named.extendRouter(Router())
authRoute.get('web.auth.login', '/auth/login', handler(AuthController, 'getLogin'))
authRoute.post('web.auth.login.post', '/auth/login', authLimiter, passport.authenticate('local', {
    successRedirect: '/admin/v1/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
}))
authRoute.get('web.auth.register', '/auth/register', handler(AuthController, 'getRegister'))
authRoute.post('web.auth.register.post', '/auth/register', authLimiter, UserCreateValidator, handler(AuthController, 'postRegister'))
authRoute.post('web.auth.logout', '/auth/logout', handler(AuthController, 'logout'))

authRoute.get('admin.v1.auth.reset.req', '/admin/v1/auth/reset/req', handler(AuthController, 'request_view'))
authRoute.get('admin.v1.auth.reset.proc', '/admin/v1/auth/reset/proc', handler(AuthController, 'process_view'))

authRoute.post('admin.v1.auth.reset.request', '/admin/v1/auth/reset/request', authLimiter, handler(AuthController, 'request'))
authRoute.post('admin.v1.auth.reset.process', '/admin/v1/auth/reset/process', otpLimiter, ResetPasswordProcessValidator, handler(AuthController, 'process'))

router.use(authRoute)

export default router
