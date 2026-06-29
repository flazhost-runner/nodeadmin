import 'reflect-metadata'
import { container } from 'tsyringe'
import { registerRepository } from '@flazhost-nodeadmin/core'
import AppDataSource from './config/ormconfig'
import { User } from './modules/access/models/user.entity'
import { Role } from './modules/access/models/role.entity'
import { Permission } from './modules/access/models/permission.entity'
import { Setting } from './modules/setting/models/setting.entity'
import { TOKENS } from './tokens'

/**
 * Repository didaftarkan sebagai factory LAZY (via core registerRepository) —
 * getRepository hanya valid setelah AppDataSource.initialize(), dan factory
 * dipanggil saat resolve (per-request via routeBinding), bukan saat module load.
 */

registerRepository(AppDataSource, TOKENS.UserRepository, User)
registerRepository(AppDataSource, TOKENS.RoleRepository, Role)
registerRepository(AppDataSource, TOKENS.PermissionRepository, Permission)
registerRepository(AppDataSource, TOKENS.SettingRepository, Setting)

// --- Service registrations: CORE (selalu ada di varian full & api) ---
import UserService from './modules/access/http/services/v1/UserService'
import RoleService from './modules/access/http/services/v1/RoleService'
import PermissionService from './modules/access/http/services/v1/PermissionService'
import SettingService from './modules/setting/http/services/v1/SettingService'
import DashboardService from './modules/dashboard/http/services/v1/DashboardService'
container.register(TOKENS.IUserService, { useClass: UserService })
container.register(TOKENS.IRoleService, { useClass: RoleService })
container.register(TOKENS.IPermissionService, { useClass: PermissionService })
container.register(TOKENS.ISettingService, { useClass: SettingService })
container.register(TOKENS.IDashboardService, { useClass: DashboardService })

/**
 * Service registrations: UI-only (Media, Home → FeTemplate/FeCatalog).
 *
 * Modul-modul ini DIBUANG pada varian api-only (lihat tools/buildTemplate.js).
 * Agar file ini IDENTIK byte-for-byte di kedua varian — sehingga diff full↔api
 * murni additive dan upgrade `nodeadmin add-ui` bebas-konflik — registrasi
 * dilakukan lewat lazy require yang di-guard: bila folder modul tidak ada
 * (varian api), lewati diam-diam. Resolve token-nya (mis. di SettingService)
 * akan melempar dan ditangani pemanggil.
 */
function tryRegister(token: symbol, load: () => any): void {
    try {
        container.register(token, { useClass: load() })
    } catch {
        // Modul UI tidak ada di varian api-only — abaikan (bukan kondisi error).
    }
}
tryRegister(TOKENS.IMediaService, () => require('./modules/media/http/services/v1/MediaService').default)
tryRegister(TOKENS.IFeTemplateService, () => require('./modules/home/http/services/v1/FeTemplateService').default)
tryRegister(TOKENS.IFeCatalogService, () => require('./modules/home/http/services/v1/FeCatalogService').default)

export { container, TOKENS }
