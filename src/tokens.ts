/**
 * Token DI terpisah dari container.ts untuk menghindari circular import
 * (service meng-import TOKENS; container meng-import service).
 */
export const TOKENS = {
    UserRepository: Symbol('UserRepository'),
    RoleRepository: Symbol('RoleRepository'),
    PermissionRepository: Symbol('PermissionRepository'),
    SettingRepository: Symbol('SettingRepository'),

    IUserService: Symbol('IUserService'),
    IRoleService: Symbol('IRoleService'),
    IPermissionService: Symbol('IPermissionService'),
    ISettingService: Symbol('ISettingService'),
    IDashboardService: Symbol('IDashboardService'),
    IMediaService: Symbol('IMediaService'),
    IFeTemplateService: Symbol('IFeTemplateService'),
    IFeCatalogService: Symbol('IFeCatalogService'),
} as const
