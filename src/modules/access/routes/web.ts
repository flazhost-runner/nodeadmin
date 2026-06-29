import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import UserController from '../http/controllers/web/v1/UserController'
import PermissionController from '../http/controllers/web/v1/PermissionController'
import AccessMiddleware from '../http/middleware/AccessMiddleware'
import { ensureAuthenticated } from '../../auth/http/middleware/authMiddleware'
import RoleController from '../http/controllers/web/v1/RoleController'
import { roleValidationRules } from '../http/validators/RoleValidator'
import { permissionValidationRules } from '../http/validators/PermissionValidator'
import { upload, UserCreateValidator } from '../http/validators/UserCreateValidator'
import { UserUpdateValidator } from '../http/validators/UserUpdateValidator'
import { handler } from '@flazhost-nodeadmin/core'

const router = Router()

// define route & set middleware user
const userRoute = named.extendRouter(Router())

userRoute.get('admin.v1.access.user.index', '/admin/v1/access/user', ensureAuthenticated, AccessMiddleware, handler(UserController, 'index'))
userRoute.get('admin.v1.access.user.create', '/admin/v1/access/user/create', ensureAuthenticated, AccessMiddleware, handler(UserController, 'create'))
userRoute.post('admin.v1.access.user.store', '/admin/v1/access/user/store', ensureAuthenticated, AccessMiddleware, upload.any(), UserCreateValidator, handler(UserController, 'store'))
userRoute.get('admin.v1.access.user.edit', '/admin/v1/access/user/:id/edit', ensureAuthenticated, AccessMiddleware, handler(UserController, 'edit'))
userRoute.put('admin.v1.access.user.update', '/admin/v1/access/user/:id/update', ensureAuthenticated, AccessMiddleware, upload.any(), UserUpdateValidator, handler(UserController, 'update'))
userRoute.delete('admin.v1.access.user.delete', '/admin/v1/access/user/:id/delete', ensureAuthenticated, AccessMiddleware, handler(UserController, 'delete'))
userRoute.post('admin.v1.access.user.delete_selected', '/admin/v1/access/user/delete_selected', ensureAuthenticated, AccessMiddleware, handler(UserController, 'delete_selected'))

// define route & set middleware access
const permissionRoute = named.extendRouter(Router())

permissionRoute.get('admin.v1.access.permission.index', '/admin/v1/access/permission', ensureAuthenticated, AccessMiddleware, handler(PermissionController, 'index'))
permissionRoute.get('admin.v1.access.permission.create', '/admin/v1/access/permission/create', ensureAuthenticated, AccessMiddleware, handler(PermissionController, 'create'))
permissionRoute.post('admin.v1.access.permission.store', '/admin/v1/access/permission/store', ensureAuthenticated, AccessMiddleware, permissionValidationRules(), handler(PermissionController, 'store'))
permissionRoute.get('admin.v1.access.permission.edit', '/admin/v1/access/permission/:id/edit', ensureAuthenticated, AccessMiddleware, handler(PermissionController, 'edit'))
permissionRoute.put('admin.v1.access.permission.update', '/admin/v1/access/permission/:id/update', ensureAuthenticated, AccessMiddleware, permissionValidationRules(), handler(PermissionController, 'update'))
permissionRoute.delete('admin.v1.access.permission.delete', '/admin/v1/access/permission/:id/delete', ensureAuthenticated, AccessMiddleware, handler(PermissionController, 'delete'))
permissionRoute.post('admin.v1.access.permission.delete_selected', '/admin/v1/access/permission/delete_selected', ensureAuthenticated, AccessMiddleware, handler(PermissionController, 'delete_selected'))

// define route & set middleware role
const roleRoute = named.extendRouter(Router())

roleRoute.get('admin.v1.access.role.index', '/admin/v1/access/role', ensureAuthenticated, AccessMiddleware, handler(RoleController, 'index'))
roleRoute.get('admin.v1.access.role.create', '/admin/v1/access/role/create', ensureAuthenticated, AccessMiddleware, handler(RoleController, 'create'))
roleRoute.post('admin.v1.access.role.store', '/admin/v1/access/role/store', ensureAuthenticated, AccessMiddleware, roleValidationRules(), handler(RoleController, 'store'))
roleRoute.get('admin.v1.access.role.permission', '/admin/v1/access/role/:id/permission', ensureAuthenticated, AccessMiddleware, handler(RoleController, 'permission'))
roleRoute.get('admin.v1.access.role.permission.assign', '/admin/v1/access/role/:id/permission/:permission_id/assign', ensureAuthenticated, AccessMiddleware, handler(RoleController, 'permission_assign'))
roleRoute.post('admin.v1.access.role.permission.assign_selected', '/admin/v1/access/role/:id/permission/assign_selected', ensureAuthenticated, AccessMiddleware, handler(RoleController, 'permission_assign_selected'))
roleRoute.get('admin.v1.access.role.permission.unassign', '/admin/v1/access/role/:id/permission/:permission_id/unassign', ensureAuthenticated, AccessMiddleware, handler(RoleController, 'permission_unassign'))
roleRoute.post('admin.v1.access.role.permission.unassign_selected', '/admin/v1/access/role/:id/permission/unassign_selected', ensureAuthenticated, AccessMiddleware, handler(RoleController, 'permission_unassign_selected'))
roleRoute.get('admin.v1.access.role.edit', '/admin/v1/access/role/:id/edit', ensureAuthenticated, AccessMiddleware, handler(RoleController, 'edit'))
roleRoute.put('admin.v1.access.role.update', '/admin/v1/access/role/:id/update', ensureAuthenticated, AccessMiddleware, roleValidationRules(), handler(RoleController, 'update'))
roleRoute.delete('admin.v1.access.role.delete', '/admin/v1/access/role/:id/delete', ensureAuthenticated, AccessMiddleware, handler(RoleController, 'delete'))
roleRoute.post('admin.v1.access.role.delete_selected', '/admin/v1/access/role/delete_selected', ensureAuthenticated, AccessMiddleware, handler(RoleController, 'delete_selected'))

router.use(userRoute,permissionRoute,roleRoute)

export default router
