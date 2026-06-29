import { resetDb } from '../setup/jest.setup'
import { loginWeb, getCsrf } from '../setup/helpers'
import AppDataSource from '../../src/config/ormconfig'
import { Role } from '../../src/modules/access/models/role.entity'

describe('Access User (API web)', () => {
    let userRoleId: string

    beforeEach(async () => {
        await resetDb()
        const role = await AppDataSource.getRepository(Role).findOne({ where: { name: 'User' } })
        userRoleId = role!.id
    })

    it('list user → 200', async () => {
        const { agent } = await loginWeb()
        const res = await agent.get('/admin/v1/access/user')
        expect(res.status).toBe(200)
    })

    it('store user (dengan CSRF) → redirect sukses', async () => {
        const { agent } = await loginWeb()
        const csrf = await getCsrf(agent, '/admin/v1/access/user/create')
        const res = await agent.post('/admin/v1/access/user/store').type('form').send({
            code: 'NEW01', name: 'Baru', email: 'baru@test.com',
            password: 'password123', password_confirmation: 'password123',
            status: 'Active', 'roles[]': userRoleId, _csrf: csrf,
        })
        expect(res.status).toBe(302)
    })

    it('store user TANPA CSRF → 403', async () => {
        const { agent } = await loginWeb()
        const res = await agent.post('/admin/v1/access/user/store').type('form').send({
            code: 'NOCSRF', name: 'X', email: 'nocsrf@test.com',
            password: 'password123', password_confirmation: 'password123',
            status: 'Active', 'roles[]': userRoleId,
        })
        expect(res.status).toBe(403)
    })

    it('validation error (email invalid) → balik dengan error', async () => {
        const { agent } = await loginWeb()
        const csrf = await getCsrf(agent, '/admin/v1/access/user/create')
        const res = await agent.post('/admin/v1/access/user/store').type('form').send({
            code: 'BAD', name: 'X', email: 'bukan-email',
            password: 'password123', password_confirmation: 'password123',
            status: 'Active', 'roles[]': userRoleId, _csrf: csrf,
        })
        expect(res.status).toBe(302) // redirect back (web validator)
    })
})
