import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import UserController from '../http/controllers/api/v1/UserController'
import PermissionController from '../http/controllers/api/v1/PermissionController'
import AccessMiddleware from '../http/middleware/AccessMiddleware'
import { ensureAuthenticatedApi } from '../../auth/http/middleware/authMiddleware'
import RoleController from '../http/controllers/api/v1/RoleController'
import { roleValidationRules } from '../http/validators/RoleValidator'
import { permissionValidationRules } from '../http/validators/PermissionValidator'
import { upload, UserCreateValidator } from '../http/validators/UserCreateValidator'
import { UserUpdateValidator } from '../http/validators/UserUpdateValidator'
import { handler } from '@flazhost-nodeadmin/core'

const router = Router()

// define route & set middleware user
const userRoute = named.extendRouter(Router())

userRoute.get('api.v1.access.user.index', '/api/v1/access/user', ensureAuthenticatedApi, AccessMiddleware, handler(UserController, 'index'))
userRoute.post('api.v1.access.user.store', '/api/v1/access/user/store', ensureAuthenticatedApi, AccessMiddleware, upload.any(), UserCreateValidator, handler(UserController, 'store'))
userRoute.get('api.v1.access.user.edit', '/api/v1/access/user/:id/edit', ensureAuthenticatedApi, AccessMiddleware, handler(UserController, 'edit'))
userRoute.put('api.v1.access.user.update', '/api/v1/access/user/:id/update', ensureAuthenticatedApi, AccessMiddleware, upload.any(), UserUpdateValidator, handler(UserController, 'update'))
userRoute.delete('api.v1.access.user.delete', '/api/v1/access/user/:id/delete', ensureAuthenticatedApi, AccessMiddleware, handler(UserController, 'delete'))
userRoute.post('api.v1.access.user.delete_selected', '/api/v1/access/user/delete_selected', ensureAuthenticatedApi, AccessMiddleware, handler(UserController, 'delete_selected'))

// define route & set middleware access
const permissionRoute = named.extendRouter(Router())

permissionRoute.get('api.v1.access.permission.index', '/api/v1/access/permission', ensureAuthenticatedApi, AccessMiddleware, handler(PermissionController, 'index'))
permissionRoute.post('api.v1.access.permission.store', '/api/v1/access/permission/store', ensureAuthenticatedApi, AccessMiddleware, permissionValidationRules(), handler(PermissionController, 'store'))
permissionRoute.get('api.v1.access.permission.edit', '/api/v1/access/permission/:id/edit', ensureAuthenticatedApi, AccessMiddleware, handler(PermissionController, 'edit'))
permissionRoute.put('api.v1.access.permission.update', '/api/v1/access/permission/:id/update', ensureAuthenticatedApi, AccessMiddleware, permissionValidationRules(), handler(PermissionController, 'update'))
permissionRoute.delete('api.v1.access.permission.delete', '/api/v1/access/permission/:id/delete', ensureAuthenticatedApi, AccessMiddleware, handler(PermissionController, 'delete'))
permissionRoute.post('api.v1.access.permission.delete_selected', '/api/v1/access/permission/delete_selected', ensureAuthenticatedApi, AccessMiddleware, handler(PermissionController, 'delete_selected'))

// define route & set middleware role
const roleRoute = named.extendRouter(Router())

roleRoute.get('api.v1.access.role.index', '/api/v1/access/role', ensureAuthenticatedApi, AccessMiddleware, handler(RoleController, 'index'))
roleRoute.post('api.v1.access.role.store', '/api/v1/access/role/store', ensureAuthenticatedApi, AccessMiddleware, roleValidationRules(), handler(RoleController, 'store'))
roleRoute.get('api.v1.access.role.permission', '/api/v1/access/role/:id/permission', ensureAuthenticatedApi, AccessMiddleware, handler(RoleController, 'permission'))
roleRoute.get('api.v1.access.role.permission.assign', '/api/v1/access/role/:id/permission/:permission_id/assign', ensureAuthenticatedApi, AccessMiddleware, handler(RoleController, 'permission_assign'))
roleRoute.post('api.v1.access.role.permission.assign_selected', '/api/v1/access/role/:id/permission/assign_selected', ensureAuthenticatedApi, AccessMiddleware, handler(RoleController, 'permission_assign_selected'))
roleRoute.get('api.v1.access.role.permission.unassign', '/api/v1/access/role/:id/permission/:permission_id/unassign', ensureAuthenticatedApi, AccessMiddleware, handler(RoleController, 'permission_unassign'))
roleRoute.post('api.v1.access.role.permission.unassign_selected', '/api/v1/access/role/:id/permission/unassign_selected', ensureAuthenticatedApi, AccessMiddleware, handler(RoleController, 'permission_unassign_selected'))
roleRoute.get('api.v1.access.role.edit', '/api/v1/access/role/:id/edit', ensureAuthenticatedApi, AccessMiddleware, handler(RoleController, 'edit'))
roleRoute.put('api.v1.access.role.update', '/api/v1/access/role/:id/update', ensureAuthenticatedApi, AccessMiddleware, roleValidationRules(), handler(RoleController, 'update'))
roleRoute.delete('api.v1.access.role.delete', '/api/v1/access/role/:id/delete', ensureAuthenticatedApi, AccessMiddleware, handler(RoleController, 'delete'))
roleRoute.post('api.v1.access.role.delete_selected', '/api/v1/access/role/delete_selected', ensureAuthenticatedApi, AccessMiddleware, handler(RoleController, 'delete_selected'))

router.use(userRoute,permissionRoute,roleRoute)

export default router
