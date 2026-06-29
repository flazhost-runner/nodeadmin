import request from 'supertest'
import { app } from '../../src/index'
import { resetDb } from '../setup/jest.setup'

describe('Home (frontend publik)', () => {
    beforeEach(async () => { await resetDb() })

    it('GET / → 200 HTML home langsung (tanpa redirect)', async () => {
        const res = await request(app).get('/')
        expect(res.status).toBe(200)
        expect(res.headers['content-type']).toMatch(/html/)
        expect(res.text.toLowerCase()).toContain('</html>')
    })

    it('GET /home → 200 HTML (default render via EJS)', async () => {
        const res = await request(app).get('/home')
        expect(res.status).toBe(200)
        expect(res.headers['content-type']).toMatch(/html/)
        expect(res.text.toLowerCase()).toContain('</html>')
    })
})
