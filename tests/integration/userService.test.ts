import UserService from '../../src/modules/access/http/services/v1/UserService'
import { resetDb } from '../setup/jest.setup'
import AppDataSource from '../../src/config/ormconfig'
import { Role } from '../../src/modules/access/models/role.entity'

const svc = new UserService()

describe('UserService (integration, sqlite)', () => {
    let userRoleId: string

    beforeEach(async () => {
        const seed = await resetDb()
        userRoleId = (seed.userRole as any).id
    })

    it('store membuat user dengan role', async () => {
        const res: any = await svc.store({
            code: 'X01', name: 'Budi', email: 'budi@test.com',
            password: 'password123', status: 'Active', roles: [userRoleId],
        })
        expect(res.email).toBe('budi@test.com')
        // password ter-hash
        expect(res.password).not.toBe('password123')
    })

    it('store gagal bila role tidak ada', async () => {
        await expect(svc.store({
            code: 'X02', name: 'X', email: 'x@test.com',
            password: 'password123', status: 'Active', roles: ['tidak-ada'],
        })).rejects.toThrow()
    })

    it('index mengembalikan pagination + roles', async () => {
        const res = await svc.index({})
        expect(res.datas.length).toBeGreaterThanOrEqual(2) // admin + user seed
        expect(res.paginate_data).toHaveProperty('total_data')
        expect(Array.isArray(res.roles)).toBe(true)
    })

    it('index filter by name (case-insensitive)', async () => {
        const res = await svc.index({ q_name: 'ADMIN' }) // uppercase → tetap ketemu (ciLike)
        expect(res.datas.some((u: any) => u.name === 'Admin')).toBe(true)
    })

    it('update mengubah data', async () => {
        const created: any = await svc.store({
            code: 'X03', name: 'Old', email: 'old@test.com',
            password: 'password123', status: 'Active', roles: [userRoleId],
        })
        const res: any = await svc.update(created.id, { name: 'New', roles: [userRoleId] })
        expect(res.name).toBe('New')
    })

    it('delete menghapus user', async () => {
        const created: any = await svc.store({
            code: 'X04', name: 'Del', email: 'del@test.com',
            password: 'password123', status: 'Active', roles: [userRoleId],
        })
        const res = await svc.delete(created.id)
        expect(res).toBeTruthy()
        const after = await AppDataSource.getRepository('User' as any).count()
        expect(after).toBe(2) // kembali ke seed
    })
})
