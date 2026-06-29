import request from 'supertest'
import { app } from '../../src/index'
import { resetDb } from '../setup/jest.setup'
import { loginWeb } from '../setup/helpers'

describe('Components showcase (web)', () => {
    beforeEach(async () => { await resetDb() })

    it('tanpa login → redirect login', async () => {
        const res = await request(app).get('/admin/v1/components')
        expect(res.status).toBe(302)
    })

    it('login → 200 + memuat komponen', async () => {
        const { agent } = await loginWeb()
        const res = await agent.get('/admin/v1/components')
        expect(res.status).toBe(200)
        expect(res.text).toContain('UI Components')
        expect(res.text).toContain('demoLine')        // chart
        expect(res.text).toContain('badge')           // badge
    })
})
