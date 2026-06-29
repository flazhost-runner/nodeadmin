import { setWorldConstructor, World, IWorldOptions, BeforeAll, AfterAll, Before } from '@cucumber/cucumber'
import request from 'supertest'

// Muat env test + app SETELAH env siap (mirip jest.setup)
import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true })
process.env.NODE_ENV = 'test'
process.env.TZ = 'UTC'

// Stub fileService.getFile agar tak memanggil OSS/sharp saat render view di test.
// (BDD memakai app sungguhan; getFile dipanggil di hampir semua view via setting.logo)
import fileService from '../../../src/services/fileService'
;(fileService as any).getFile = (name: string) => `https://test/${name ?? 'placeholder'}`
;(fileService as any).uploadFile = async (name: string) => name
;(fileService as any).deleteFile = async () => true

import { app, AppDataSource } from '../../../src/index'
import bcrypt from 'bcryptjs'
import { v6 as uuidv6 } from 'uuid'
import { User } from '../../../src/modules/access/models/user.entity'
import { Role } from '../../../src/modules/access/models/role.entity'
import { Setting } from '../../../src/modules/setting/models/setting.entity'
import { invalidateSetting } from '../../../src/services/settingCache'

export const ADMIN = { email: 'admin@test.com', password: 'password123' }

export class CustomWorld extends World {
    agent = request.agent(app)
    response: any
    csrf = ''
    constructor(opts: IWorldOptions) { super(opts) }
}
setWorldConstructor(CustomWorld)

export { app, AppDataSource }

BeforeAll(async () => {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize()
})
AfterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy()
})

// Reset + seed sebelum tiap scenario
Before(async function () {
    const userRepo = AppDataSource.getRepository(User)
    const roleRepo = AppDataSource.getRepository(Role)
    const settingRepo = AppDataSource.getRepository(Setting)
    await AppDataSource.query('DELETE FROM users_roles').catch(() => {})
    await AppDataSource.query('DELETE FROM roles_permissions').catch(() => {})
    await userRepo.clear()
    await roleRepo.clear()
    await settingRepo.clear()

    const adminRole = await roleRepo.save(roleRepo.create({ id: uuidv6(), name: 'Administrator', status: 'Active', desc: '' } as any))
    await roleRepo.save(roleRepo.create({ id: uuidv6(), name: 'User', status: 'Active', desc: '' } as any))
    await userRepo.save(userRepo.create({
        id: uuidv6(), code: 'ADM001', name: 'Admin', email: ADMIN.email,
        password: await bcrypt.hash(ADMIN.password, 4), status: 'Active', roles: [adminRole],
    } as any))
    await settingRepo.save(settingRepo.create({ id: uuidv6(), name: 'Test', theme: 'Blue' } as any))
    invalidateSetting()
})

export function extractCsrf(html: string): string {
    const m = html.match(/name="csrf-token" content="([^"]+)"/)
    return m ? m[1] : ''
}
