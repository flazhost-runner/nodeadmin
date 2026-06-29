import request from 'supertest'
import { app } from '../../src/index'
import { resetDb } from '../setup/jest.setup'
import { loginApi } from '../setup/helpers'

describe('Dashboard (API JWT)', () => {
    beforeEach(async () => { await resetDb() })

    it('GET /api/v1/dashboard tanpa token → 401', async () => {
        const res = await request(app).get('/api/v1/dashboard')
        expect(res.status).toBe(401)
    })

    it('GET /api/v1/dashboard dengan token → 200 + stats', async () => {
        const token = await loginApi()
        const res = await request(app).get('/api/v1/dashboard').set('Authorization', `Bearer ${token}`)
        expect(res.status).toBe(200)
        expect(res.body.data).toHaveProperty('users')
        expect(res.body.data).toHaveProperty('roles')
        expect(res.body.data).toHaveProperty('permissions')
    })
})
