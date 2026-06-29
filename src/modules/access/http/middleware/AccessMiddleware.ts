import { Request, Response, NextFunction } from 'express'
import AppDataSource from '../../../../config/ormconfig'
import { Permission } from '../../models/permission.entity'
import { User } from '../../models/user.entity'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import env from '../../../../config/env'

const AccessMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const permissionRepository = AppDataSource.getRepository(Permission)
    const userRepository = AppDataSource.getRepository(User)

    // Determine the current route's declared path (with params) and derive its name
    const declaredPath = (req.baseUrl || '') + ((req.route?.path === '/' ? '' : (req.route?.path as string | undefined)) || (req.path === '/' ? '' : req.path))
    const method = req.method.toUpperCase()
    const routeName = named.getNameByPathAndMethod(declaredPath, method)

    const user = req.user as User
    const roles = await userRepository.findOne({
        where: { id: user?.id },
        relations: ['roles', 'roles.permissions']
    })

    const hasAccess = !!roles?.roles.some((role: { permissions: { name: string; method: string }[] }) =>
        role.permissions.some((permission: { name: string; method: string }) =>
            permission.name === routeName && permission.method === method
        )
    )
    const currentPath = routeName ? named.getPathByName(routeName) || '' : ''
    const isApi = currentPath.includes('/api/')

    if (!roles?.roles.some(role => role.name == env.roles.administrator)) {
        if (!hasAccess) {
            if (!isApi) {
                req.session.flashMessage = { key: 'error', message: 'Unauthorized.' }
                if (!req.isAuthenticated()) {
                    return res.redirect('/auth/login')
                }
                return res.redirect(req.get('Referrer') || '/')
            } else {
                return res.status(403).json({ message: 'Forbidden' })
            }
        }
    }

    next()
}

export default AccessMiddleware
