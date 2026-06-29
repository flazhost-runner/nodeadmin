import request from 'supertest'
import { app } from '../../src/index'
import { resetDb } from '../setup/jest.setup'
import { loginApi } from '../setup/helpers'

describe('Profile (API JWT)', () => {
    beforeEach(async () => { await resetDb() })

    it('GET /api/v1/profile tanpa token → 401', async () => {
        const res = await request(app).get('/api/v1/profile')
        expect(res.status).toBe(401)
    })

    it('GET /api/v1/profile dengan token → 200 + data user', async () => {
        const token = await loginApi()
        expect(token).toBeTruthy()
        const res = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${token}`)
        expect(res.status).toBe(200)
        expect(res.body.status).toBe(true)
    })
})
