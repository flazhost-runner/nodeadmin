import { resetDb } from '../setup/jest.setup'
import { loginWeb, getCsrf } from '../setup/helpers'
import { getSetting } from '../../src/services/settingCache'

describe('Setting (API web)', () => {
    beforeEach(async () => { await resetDb() })

    it('halaman setting → 200 + switcher tema', async () => {
        const { agent } = await loginWeb()
        const res = await agent.get('/admin/v1/setting')
        expect(res.status).toBe(200)
        expect(res.text).toContain('name="theme"')
    })

    it('ganti tema via PUT → tersimpan + cache invalidate', async () => {
        const { agent } = await loginWeb()
        const csrf = await getCsrf(agent, '/admin/v1/setting')
        const res = await agent.post('/admin/v1/setting/update?_method=PUT').type('form').send({
            theme: 'Green', name: 'Test Admin', _csrf: csrf,
        })
        expect(res.status).toBe(302)
        const s = await getSetting()
        expect(s?.theme).toBe('Green')
    })

    it('tema invalid ditolak validator', async () => {
        const { agent } = await loginWeb()
        const csrf = await getCsrf(agent, '/admin/v1/setting')
        await agent.post('/admin/v1/setting/update?_method=PUT').type('form').send({
            theme: 'NotARealTheme', name: 'Test Admin', _csrf: csrf,
        })
        const s = await getSetting()
        expect(s?.theme).not.toBe('NotARealTheme')
    })
})
