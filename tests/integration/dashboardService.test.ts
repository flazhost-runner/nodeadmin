import DashboardService from '../../src/modules/dashboard/http/services/v1/DashboardService'
import { resetDb } from '../setup/jest.setup'

const svc = new DashboardService()

describe('DashboardService (integration, sqlite)', () => {
    beforeEach(async () => { await resetDb() })

    it('stats mengembalikan jumlah user/role/permission', async () => {
        const s = await svc.stats()
        expect(s).toHaveProperty('users')
        expect(s).toHaveProperty('roles')
        expect(s).toHaveProperty('permissions')
        // seed resetDb: 2 user, 2 role
        expect(s.users).toBeGreaterThanOrEqual(2)
        expect(s.roles).toBeGreaterThanOrEqual(2)
        expect(typeof s.permissions).toBe('number')
    })
})
