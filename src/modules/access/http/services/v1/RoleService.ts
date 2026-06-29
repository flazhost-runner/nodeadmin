import { Not, In, Repository } from 'typeorm'
import { injectable, inject } from 'tsyringe'
import AppDataSource from '../../../../../config/ormconfig'
import { Role } from '../../../models/role.entity'
import { Permission } from '../../../models/permission.entity'
import { Functions as functions, removePrefix, ciLike, paginate } from '@flazhost-nodeadmin/core'
import { IRoleService } from './IRoleService'
import { TOKENS } from '../../../../../tokens'
import { AppError, NotFoundError, ConflictError } from '@flazhost-nodeadmin/core'

@injectable()
export default class RoleService implements IRoleService {
	// Dual-mode: prod inject token; test `new RoleService()` pakai default param.
	constructor(
		@inject(TOKENS.RoleRepository) private roleRepository: Repository<Role> = AppDataSource.getRepository(Role),
		@inject(TOKENS.PermissionRepository) private permissionRepository: Repository<Permission> = AppDataSource.getRepository(Permission),
	) {}

	public async index(filter: any) {
		const cleanConditions = removePrefix(filter, 'q_')
		let query = this.roleRepository.createQueryBuilder('roles')

		// filter
		if (cleanConditions.name) {
			query = query.andWhere(...ciLike('roles.name', 'name', cleanConditions.name))
		}
		if (cleanConditions.desc) {
			query = query.andWhere(...ciLike('roles.desc', 'desc', cleanConditions.desc))
		}
		if (cleanConditions.status) {
			query = query.andWhere(`roles.status = :status`, { status: cleanConditions.status })
		}
		return paginate(query, cleanConditions)
	}

	public async store(request: any) {
		const find = await this.roleRepository.findOne({ where: { name: request.name } })
		if (find) {
			throw new ConflictError("Role Already Exists")
		}
		request = functions.removeEmptyFields(request)
		const data = this.roleRepository.create({ ...request })
		const result = await this.roleRepository.save(data)
		if (!result) {
			throw new AppError("Store Role Fail", 500)
		}
		return result
	}

	public async edit(id: string) {
		const data = await this.roleRepository.findOne({ where: { id } })
		return data
	}

	public async update(id: string, request: any) {
		const find = await this.roleRepository.findOne({ where: { id: Not(id), name: request.name } })
		if (find) {
			throw new ConflictError("Role Already Exists")
		}
		const role = await this.roleRepository.findOne({ where: { id } })
		if (!role) {
			throw new NotFoundError('Role not found')
		}
		request = functions.removeEmptyFields(request)
		const data = this.roleRepository.merge(role, { ...request })
		const result = await this.roleRepository.save(data)
		if (!result) {
			throw new AppError("Update Role Fail", 500)
		}
		return result
	}

	public async delete(id: string) {
		const data = await this.roleRepository.findOne({ where: { id } })
		if (!data) {
			throw new NotFoundError('Role not found')
		}
		const result = await this.roleRepository.remove(data)
		return result
	}

	public async permission(role_id: string,filter:any) {
		const cleanConditions = removePrefix(filter, 'q_')
        const role = await this.roleRepository.findOne({ where: { id: role_id }, relations: ['permissions'] })
        let query = this.permissionRepository.createQueryBuilder('permissions')

		// filter
		if (cleanConditions.name) {
            query = query.andWhere(...ciLike('permissions.name', 'name', cleanConditions.name))
		}
		if (cleanConditions.method) {
            query = query.andWhere(`permissions.method = :method`, { method: cleanConditions.method })
		}
		if (cleanConditions.status) {
            if (cleanConditions.status == 'Active') {
                query = query.leftJoinAndSelect('permissions.roles', 'role')
                        .andWhere('role.id = :role_id', { role_id })
            } else if (cleanConditions.status == 'Inactive') {
                query = query.leftJoinAndSelect('permissions.roles', 'role')
                .where(qb => {
                    const subQuery = qb.subQuery()
                        .select('roles_permissions.permission_id')
                        .from('roles_permissions', 'roles_permissions')
                        .where('roles_permissions.role_id = :roleId')
                        .getQuery()
                    return `permissions.id NOT IN ${subQuery}`
                })
                .setParameter('roleId', role_id)
            }
        }
        if (cleanConditions.desc) {
            query = query.andWhere(...ciLike('permissions.desc', 'desc', cleanConditions.desc))
        }

		const result = await paginate(query, cleanConditions)
		return { ...result, role }
	}

	public async permission_assign(role_id: string, permission_id: string) {
        const role = await this.roleRepository.findOne({
            where: { id: role_id },
            relations: ['permissions']
        })
			if (!role) {
				throw new NotFoundError('Role not found')
			}
        const permission = await this.permissionRepository.findOne({
            where: { id: permission_id }
        })
			if (!permission) {
				throw new NotFoundError('Permission not found')
			}
        role.permissions.push(permission as any)
			const result = await this.roleRepository.save(role)
			if (!result) {
				throw new AppError("Assign Permission Fail", 500)
			}
			return result
	}

	public async permission_assign_selected(role_id: string, permissions: string[]) {
        const role = await this.roleRepository.findOne({
            where: { id: role_id },
            relations: ['permissions']
        })
			if (!role) {
				throw new NotFoundError('Role not found')
			}
			// Ambil semua permission terpilih dalam 1 query (bukan N query di loop),
			// gabungkan dengan yang sudah ada tanpa duplikat.
			const found = await this.permissionRepository.findBy({ id: In(permissions) })
			const existingIds = new Set(role.permissions.map((p: Permission) => p.id))
			for (const permission of found) {
				if (!existingIds.has(permission.id)) {
					role.permissions.push(permission)
				}
			}
			const result = await this.roleRepository.save(role)
			if (!result) {
				throw new AppError("Assign Permission Fail", 500)
			}
			return result
	}

	public async permission_unassign(role_id: string, permission_id: string) {
        const role = await this.roleRepository.findOne({
            where: { id: role_id },
            relations: ['permissions']
        })
			if (!role) {
				throw new NotFoundError('Role not found')
			}
        role.permissions = role.permissions.filter((permission: { id: string }) => permission.id !== permission_id)
			const result = await this.roleRepository.save(role)
			if (!result) {
				throw new AppError("Unassign Permission Fail", 500)
			}
			return result
	}

	public async permission_unassign_selected(role_id: string, permissions: string[]) {
        const role = await this.roleRepository.findOne({
            where: { id: role_id },
            relations: ['permissions']
        })
			if (!role) {
				throw new NotFoundError('Role not found')
			}
        permissions.forEach(permission_id => {
            role.permissions = role.permissions.filter((permission: { id: string }) => permission.id !== permission_id)
        })
			const result = await this.roleRepository.save(role)
			if (!result) {
				throw new AppError("Unassign Permission Fail", 500)
			}
			return result
	}
}
