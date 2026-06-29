import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../../src/index'
import { resetDb, ADMIN, USER } from '../setup/jest.setup'
import { loginWeb, loginApi, getCsrf } from '../setup/helpers'
import env from '../../src/config/env'
import AppDataSource from '../../src/config/ormconfig'
import { User } from '../../src/modules/access/models/user.entity'

describe('Security', () => {
    beforeEach(async () => { await resetDb() })

    describe('RBAC (C1)', () => {
        it('tanpa login → redirect ke login (web)', async () => {
            const res = await request(app).get('/admin/v1/access/user')
            expect(res.status).toBe(302)
            expect(res.headers.location).toContain('/auth/login')
        })

        it('API tanpa token → 401', async () => {
            const res = await request(app).get('/api/v1/access/user')
            expect(res.status).toBe(401)
        })

        it('user biasa (non-admin) tanpa permission → ditolak', async () => {
            const { agent } = await loginWeb(USER)
            const res = await agent.get('/admin/v1/access/user')
            // RBAC: redirect back / ke login (bukan 200)
            expect(res.status).not.toBe(200)
        })
    })

    describe('CSRF', () => {
        it('POST tanpa token → 403', async () => {
            const { agent } = await loginWeb()
            const res = await agent.post('/admin/v1/setting/update?_method=PUT').type('form').send({ theme: 'Red' })
            expect(res.status).toBe(403)
        })
        it('POST dengan token → bukan 403', async () => {
            const { agent } = await loginWeb()
            const csrf = await getCsrf(agent)
            const res = await agent.post('/admin/v1/setting/update?_method=PUT').type('form')
                .send({ theme: 'Red', name: 'Test Admin', _csrf: csrf })
            expect(res.status).not.toBe(403)
        })
    })

    describe('Rate limiting', () => {
        it('login berlebihan → 429', async () => {
            let got429 = false
            for (let i = 0; i < 15; i++) {
                const res = await request(app).post('/api/v1/auth/login')
                    .send({ email: 'x@x.com', password: 'wrong' })
                if (res.status === 429) { got429 = true; break }
            }
            expect(got429).toBe(true)
        })
    })

    describe('JWT', () => {
        it('token alg=none ditolak', async () => {
            const bad = jwt.sign({ id: 'x', email: 'x' }, '', { algorithm: 'none' })
            const res = await request(app).get('/api/v1/access/user')
                .set('Authorization', `Bearer ${bad}`)
            expect(res.status).toBe(401)
        })

        it('token kadaluarsa ditolak', async () => {
            const expired = jwt.sign({ id: 'x', email: 'x' }, env.jwt.secret, { algorithm: 'HS256', expiresIn: -10 })
            const res = await request(app).get('/api/v1/access/user')
                .set('Authorization', `Bearer ${expired}`)
            expect(res.status).toBe(401)
        })
    })

    describe('Mass-assignment', () => {
        it('field tak dikenal di-strip saat store user', async () => {
            const { agent } = await loginWeb()
            const role = await AppDataSource.getRepository('Role' as any).findOne({ where: { name: 'User' } }) as any
            const csrf = await getCsrf(agent, '/admin/v1/access/user/create')
            await agent.post('/admin/v1/access/user/store').type('form').send({
                code: 'MA01', name: 'MassAssign', email: 'ma@test.com',
                password: 'password123', password_confirmation: 'password123',
                status: 'Active', 'roles[]': role.id, _csrf: csrf,
                created_by: 'HACKED', id: 'forced-id', // field jahat
            })
            const u = await AppDataSource.getRepository(User).findOne({ where: { email: 'ma@test.com' } })
            // id tidak boleh ter-set dari input (di-generate service), created_by tak ter-inject
            expect(u?.id).not.toBe('forced-id')
            expect((u as any)?.created_by).not.toBe('HACKED')
        })
    })
})
