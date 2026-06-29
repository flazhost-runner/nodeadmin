import 'reflect-metadata'

// --- Mock layanan eksternal (OSS) agar test tak menyentuh jaringan ---
jest.mock('../../src/services/fileService', () => ({
    __esModule: true,
    default: {
        uploadFile: jest.fn(async (name: string) => name),
        getFile: jest.fn((name: string) => `https://test/${name}`),
        deleteFile: jest.fn(async () => true),
        listFiles: jest.fn(async () => []),
    },
}))

// --- Mock client Redis (dipakai di logout/blacklist) ---
jest.mock('redis', () => {
    const store = new Map<string, string>()
    // Promise API (cermin clientRedis.v4 di legacyMode — dipakai blacklist token).
    const v4 = {
        get: jest.fn(async (k: string) => store.get(k) ?? null),
        set: jest.fn(async (k: string, v: string) => { store.set(k, v); return 'OK' }),
        del: jest.fn(async (k: string) => { store.delete(k); return 1 }),
    }
    const client = {
        isOpen: true,
        on: jest.fn(),
        connect: jest.fn(async () => {}),
        quit: jest.fn(async () => {}),
        // legacy (callback-style, redis v3): TIDAK mengembalikan Promise nilai.
        // Disengaja meniru perilaku legacyMode asli — `await clientRedis.get(k)`
        // menghasilkan undefined (bukan nilai). Maka kode yang keliru memakai flat
        // get/set untuk blacklist (bukan .v4) akan GAGAL test, bukan lolos diam-diam.
        get: jest.fn((_k: string, cb?: (e: any, v: any) => void) => { cb?.(null, store.get(_k) ?? null) }),
        set: jest.fn((_k: string, _v: string, cb?: (e: any, v: any) => void) => { store.set(_k, _v); cb?.(null, 'OK') }),
        del: jest.fn((_k: string, cb?: (e: any, v: any) => void) => { store.delete(_k); cb?.(null, 1) }),
        // Promise API (cermin clientRedis.v4) — dipakai blacklist token.
        v4,
    }
    return { createClient: () => client }
})

import AppDataSource from '../../src/config/ormconfig'
import bcrypt from 'bcryptjs'
import { v6 as uuidv6 } from 'uuid'
import { User } from '../../src/modules/access/models/user.entity'
import { Role } from '../../src/modules/access/models/role.entity'
import { Setting } from '../../src/modules/setting/models/setting.entity'
import { Permission } from '../../src/modules/access/models/permission.entity'
import { invalidateSetting } from '../../src/services/settingCache'

export const ADMIN = { email: 'admin@test.com', password: 'password123' }
export const USER = { email: 'user@test.com', password: 'password123' }

beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize()
    }
})

afterAll(async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy()
    }
})

/** Reset semua tabel + seed Administrator & User role + akun. */
export async function resetDb() {
    const userRepo = AppDataSource.getRepository(User)
    const roleRepo = AppDataSource.getRepository(Role)

    // sqlite: hapus child→parent
    const settingRepo = AppDataSource.getRepository(Setting)
    await AppDataSource.query('DELETE FROM users_roles').catch(() => {})
    await AppDataSource.query('DELETE FROM roles_permissions').catch(() => {})
    await userRepo.clear()
    await roleRepo.clear()
    await AppDataSource.getRepository(Permission).clear()
    await settingRepo.clear()

    // Seed 1 row Setting (di produksi dibuat migration InitSetting)
    await settingRepo.save(settingRepo.create({
        id: uuidv6(), initial: 'Test', name: 'Test Admin', theme: 'Blue',
    } as any))
    invalidateSetting()

    const adminRole = await roleRepo.save(roleRepo.create({ id: uuidv6(), name: 'Administrator', status: 'Active', desc: '' } as any))
    const userRole = await roleRepo.save(roleRepo.create({ id: uuidv6(), name: 'User', status: 'Active', desc: '' } as any))

    await userRepo.save(userRepo.create({
        id: uuidv6(), code: 'ADM001', name: 'Admin', email: ADMIN.email,
        password: await bcrypt.hash(ADMIN.password, 4), status: 'Active', roles: [adminRole],
    } as any))
    await userRepo.save(userRepo.create({
        id: uuidv6(), code: 'USR001', name: 'User', email: USER.email,
        password: await bcrypt.hash(USER.password, 4), status: 'Active', roles: [userRole],
    } as any))

    return { adminRole, userRole }
}
