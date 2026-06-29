import SettingService from '../../src/modules/setting/http/services/v1/SettingService'
import { getSetting } from '../../src/services/settingCache'
import { resetDb } from '../setup/jest.setup'

const svc = new SettingService()

describe('SettingService (integration, sqlite)', () => {
    beforeEach(async () => { await resetDb() })

    it('index mengembalikan row setting', async () => {
        const res = await svc.index()
        expect(res.data).toBeTruthy()
    })

    it('update mengubah theme + invalidasi cache', async () => {
        // panaskan cache
        const before = await getSetting()
        expect(before?.theme).toBe('Blue')

        await svc.update({ theme: 'Red', name: 'Test Admin' })

        // cache harus ter-invalidate → baca nilai baru
        const after = await getSetting()
        expect(after?.theme).toBe('Red')
    })
})
