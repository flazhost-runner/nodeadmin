import { Not, Repository } from 'typeorm'
import { injectable, inject } from 'tsyringe'
import AppDataSource from '../../../../../config/ormconfig'
import { Permission } from '../../../models/permission.entity'
import { Functions as functions, removePrefix, ciLike, paginate } from '@flazhost-nodeadmin/core'
import { Application } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import { IPermissionService } from './IPermissionService'
import { TOKENS } from '../../../../../tokens'
import { AppError, NotFoundError, ConflictError } from '@flazhost-nodeadmin/core'

@injectable()
export default class PermissionService implements IPermissionService {
    // Dual-mode: prod inject token; test `new PermissionService()` pakai default param.
    constructor(
        @inject(TOKENS.PermissionRepository) private permissionRepository: Repository<Permission> = AppDataSource.getRepository(Permission),
    ) {}

	public async getAllRegisteredRoute(app: Application) {
        const routes: { method: string, path: string }[] = []
		const extractRoutes = (stack: any) => {
			stack.forEach((middleware: any) => {
				if (middleware.route) {
					const methods = Object.keys(middleware.route.methods).map(method => method.toUpperCase())
					const path = middleware.route.path
					methods.forEach(method => routes.push({ method, path }))
				} else if (middleware.name === 'router' || middleware.handle && middleware.handle.stack) {
					extractRoutes(middleware.handle.stack)
				}
			})
		}
		extractRoutes(app._router.stack)
        for (const route of routes) {
            const name = named.getNameByPathAndMethod(route.path, route.method)
            if (!name) continue // only persist named routes
            // Jalur auth dari nama/route: 'api.*' → guard api, selain itu web.
            const guard = name.startsWith('api.') ? 'api' : 'web'
            let permission = await this.permissionRepository.findOne({ where: { name, method: route.method, guard_name: guard } })
            if (!permission) {
                permission = this.permissionRepository.create({
                    name,
                    method: route.method,
                    guard_name: guard
                })
                await this.permissionRepository.save(permission)
            }
        }
    }

	public async index(filter: any) {
		const cleanConditions = removePrefix(filter, 'q_')
        let query = this.permissionRepository.createQueryBuilder('permissions')

		// filter
		if (cleanConditions.name) {
            query = query.andWhere(...ciLike('permissions.name', 'name', cleanConditions.name))
		}
		if (cleanConditions.method) {
            query = query.andWhere(`permissions.method = :method`, { method: cleanConditions.method })
		}
		if (cleanConditions.status) {
            query = query.andWhere(`permissions.status = :status`, { status: cleanConditions.status })
		}
		if (cleanConditions.guard) {
            query = query.andWhere(`permissions.guard_name = :guard`, { guard: cleanConditions.guard })
		}
		if (cleanConditions.desc) {
            query = query.andWhere(...ciLike('permissions.desc', 'desc', cleanConditions.desc))
		}

		return paginate(query, cleanConditions)
	}

	public async store(request: any) {
		const find = await this.permissionRepository.findOne({ where: { name: request.name } })
		if (find) {
			throw new ConflictError("Permission Already Exists")
		}
		request = functions.removeEmptyFields(request)
		const data = this.permissionRepository.create({ ...request })
		const result = await this.permissionRepository.save(data)
		if (!result) {
			throw new AppError("Store Permission Fail", 500)
		}
		return result
	}

	public async edit(id: string) {
		const data = await this.permissionRepository.findOne({ where: { id } })
		if (!data) {
			throw new NotFoundError('Permission not found')
		}
		return data
	}

	public async update(id: string, request: any) {
		const find = await this.permissionRepository.findOne({ where: { id: Not(id), name: request.name } })
		if (find) {
			throw new ConflictError("Permission Already Exists")
		}
		const permission = await this.permissionRepository.findOne({ where: { id } })
		if (!permission) {
			throw new NotFoundError('Permission not found')
		}
		request = functions.removeEmptyFields(request)
		const data = this.permissionRepository.merge(permission, { ...request })
		const result = await this.permissionRepository.save(data)
		if (!result) {
			throw new AppError("Update Permission Fail", 500)
		}
		return result
	}

	public async delete(id: string) {
		const data = await this.permissionRepository.findOne({ where: { id } })
		if (!data) {
			throw new NotFoundError('Permission not found')
		}
		const result = await this.permissionRepository.remove(data)
		return result
	}
}
