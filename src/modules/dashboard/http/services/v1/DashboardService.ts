import { Repository } from 'typeorm'
import { injectable, inject } from 'tsyringe'
import AppDataSource from '../../../../../config/ormconfig'
import { User } from '../../../../access/models/user.entity'
import { Role } from '../../../../access/models/role.entity'
import { Permission } from '../../../../access/models/permission.entity'
import { IDashboardService } from './IDashboardService'
import { TOKENS } from '../../../../../tokens'

@injectable()
export default class DashboardService implements IDashboardService {
    // Dual-mode: prod inject token; test `new DashboardService()` pakai default param.
    constructor(
        @inject(TOKENS.UserRepository) private userRepo: Repository<User> = AppDataSource.getRepository(User),
        @inject(TOKENS.RoleRepository) private roleRepo: Repository<Role> = AppDataSource.getRepository(Role),
        @inject(TOKENS.PermissionRepository) private permRepo: Repository<Permission> = AppDataSource.getRepository(Permission),
    ) {}

    async stats() {
        const [users, roles, permissions] = await Promise.all([
            this.userRepo.count(),
            this.roleRepo.count(),
            this.permRepo.count(),
        ])
        return { users, roles, permissions }
    }
}
