import request from 'supertest'
import { app } from '../../src/index'
import { resetDb } from '../setup/jest.setup'
import { loginWeb, getCsrf } from '../setup/helpers'

describe('Media (file manager editor)', () => {
    beforeEach(async () => { await resetDb() })

    it('GET /admin/v1/media/list tanpa login → redirect login', async () => {
        const res = await request(app).get('/admin/v1/media/list')
        expect(res.status).toBe(302)
        expect(res.headers.location).toContain('/auth/login')
    })

    it('GET /admin/v1/media/list (login) → 200 + array (kosong tanpa OSS)', async () => {
        const { agent } = await loginWeb()
        const res = await agent.get('/admin/v1/media/list')
        expect(res.status).toBe(200)
        expect(res.body.status).toBe(true)
        expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('POST /admin/v1/media/delete key invalid → 400', async () => {
        const { agent } = await loginWeb()
        const csrf = await getCsrf(agent, '/admin/v1/setting')
        const res = await agent
            .post('/admin/v1/media/delete')
            .set('x-csrf-token', csrf)
            .send({ key: '../../etc/passwd' })
        expect(res.status).toBe(400)
    })

    it('POST /admin/v1/media/delete tanpa CSRF → 403', async () => {
        const { agent } = await loginWeb()
        const res = await agent
            .post('/admin/v1/media/delete')
            .send({ key: 'modules/media/editor/x.webp' })
        expect(res.status).toBe(403)
    })
})
