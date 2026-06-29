import request from 'supertest'
import { app } from '../../src/index'
import { resetDb, ADMIN } from '../setup/jest.setup'
import { loginWeb, extractCsrf } from '../setup/helpers'
import AppDataSource from '../../src/config/ormconfig'
import { User } from '../../src/modules/access/models/user.entity'

describe('Auth (API/web)', () => {
    beforeEach(async () => { await resetDb() })

    it('login web sukses → redirect dashboard', async () => {
        const agent = request.agent(app)
        const page = await agent.get('/auth/login')
        const csrf = extractCsrf(page.text)
        const res = await agent.post('/auth/login').type('form')
            .send({ email: ADMIN.email, password: ADMIN.password, _csrf: csrf })
        expect(res.status).toBe(302)
        expect(res.headers.location).toContain('/admin/v1/dashboard')
    })

    it('login web gagal (password salah) → balik ke login', async () => {
        const agent = request.agent(app)
        const page = await agent.get('/auth/login')
        const csrf = extractCsrf(page.text)
        const res = await agent.post('/auth/login').type('form')
            .send({ email: ADMIN.email, password: 'salah', _csrf: csrf })
        expect(res.status).toBe(302)
        expect(res.headers.location).toContain('/auth/login')
    })

    it('akses halaman terproteksi setelah login → 200', async () => {
        const { agent } = await loginWeb()
        const res = await agent.get('/admin/v1/dashboard')
        expect(res.status).toBe(200)
    })

    it('register publik TIDAK bisa self-assign Administrator (C4)', async () => {
        const agent = request.agent(app)
        const page = await agent.get('/auth/register')
        const csrf = extractCsrf(page.text)
        await agent.post('/auth/register').type('form').send({
            code: 'HACK', name: 'Hacker', email: 'hack@test.com',
            password: 'password123', password_confirmation: 'password123',
            status: 'Active', _csrf: csrf,
            'roles[]': 'whatever-admin-id', // mencoba inject role
        })
        // user (jika terbuat) tak boleh punya role Administrator
        const u = await AppDataSource.getRepository(User).findOne({
            where: { email: 'hack@test.com' }, relations: ['roles'],
        })
        if (u) {
            expect(u.roles.some(r => r.name === 'Administrator')).toBe(false)
        }
    })

    it('API login mengembalikan JWT', async () => {
        const res = await request(app).post('/api/v1/auth/login')
            .send({ email: ADMIN.email, password: ADMIN.password })
        expect(res.status).toBe(200)
        expect(res.body.data.access_token).toBeTruthy()
    })

    it('API login salah → 401', async () => {
        const res = await request(app).post('/api/v1/auth/login')
            .send({ email: ADMIN.email, password: 'salah' })
        expect(res.status).toBe(401)
    })

    it('API logout mem-blacklist token → token sama ditolak (401)', async () => {
        // login → dapatkan JWT
        const login = await request(app).post('/api/v1/auth/login')
            .send({ email: ADMIN.email, password: ADMIN.password })
        const token = login.body.data.access_token
        expect(token).toBeTruthy()

        // sebelum logout: token valid di endpoint terproteksi
        const before = await request(app).get('/api/v1/dashboard')
            .set('Authorization', `Bearer ${token}`)
        expect(before.status).toBe(200)

        // logout → blacklist (POST: logout adalah mutasi, GET tak boleh punya efek samping)
        const logout = await request(app).post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${token}`)
        expect(logout.status).toBe(200)

        // sesudah logout: token yang sama HARUS ditolak (regresi blacklist legacyMode)
        const after = await request(app).get('/api/v1/dashboard')
            .set('Authorization', `Bearer ${token}`)
        expect(after.status).toBe(401)
    })
})
