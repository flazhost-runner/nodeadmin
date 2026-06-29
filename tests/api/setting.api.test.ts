import request from 'supertest'
import { app } from '../../src/index'
import { resetDb } from '../setup/jest.setup'
import { loginApi } from '../setup/helpers'
import { getSetting } from '../../src/services/settingCache'

describe('Setting (API JWT)', () => {
    beforeEach(async () => { await resetDb() })

    it('GET /api/v1/setting tanpa token → 401', async () => {
        const res = await request(app).get('/api/v1/setting')
        expect(res.status).toBe(401)
    })

    it('GET /api/v1/setting dengan token → 200 + data', async () => {
        const token = await loginApi()
        const res = await request(app).get('/api/v1/setting').set('Authorization', `Bearer ${token}`)
        expect(res.status).toBe(200)
        expect(res.body.status).toBe(true)
    })

    it('PUT /api/v1/setting/update ganti tema', async () => {
        const token = await loginApi()
        const res = await request(app).put('/api/v1/setting/update')
            .set('Authorization', `Bearer ${token}`)
            .field('theme', 'Green').field('name', 'Test Admin')
        expect(res.status).toBe(200)
        const s = await getSetting()
        expect(s?.theme).toBe('Green')
    })
})
