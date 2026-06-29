import request from 'supertest'
import { app, AppDataSource } from '../../src/index'
import { resetDb } from '../setup/jest.setup'

describe('Smoke', () => {
    beforeAll(async () => { await resetDb() })

    it('DataSource terinisialisasi', () => {
        expect(AppDataSource.isInitialized).toBe(true)
    })

    it('GET /auth/login → 200', async () => {
        const res = await request(app).get('/auth/login')
        expect(res.status).toBe(200)
        expect(res.text).toContain('csrf-token')
    })

    it('root render home langsung (200 HTML, tanpa redirect)', async () => {
        const res = await request(app).get('/')
        expect(res.status).toBe(200)
        expect(res.headers['content-type']).toMatch(/html/)
    })
})
