import RoleService from '../../src/modules/access/http/services/v1/RoleService'
import PermissionService from '../../src/modules/access/http/services/v1/PermissionService'
import { resetDb } from '../setup/jest.setup'
import AppDataSource from '../../src/config/ormconfig'
import { Role } from '../../src/modules/access/models/role.entity'

const roleSvc = new RoleService()
const permSvc = new PermissionService()

async function makePermissions(n: number): Promise<string[]> {
    const ids: string[] = []
    for (let i = 0; i < n; i++) {
        const p: any = await permSvc.store({ name: `perm${i}`, method: 'GET', status: 'Active' })
        ids.push(p.id)
    }
    return ids
}

describe('RoleService (integration, sqlite)', () => {
    beforeEach(async () => { await resetDb() })

    it('store membuat role', async () => {
        const res: any = await roleSvc.store({ name: 'Editor', status: 'Active', desc: 'x' })
        expect(res.name).toBe('Editor')
    })

    it('store gagal bila nama duplikat', async () => {
        await roleSvc.store({ name: 'Dup', status: 'Active' })
        await expect(roleSvc.store({ name: 'Dup', status: 'Active' })).rejects.toThrow()
    })

    it('permission_assign_selected menyimpan SEMUA permission (regресi bug forEach async)', async () => {
        const role: any = await roleSvc.store({ name: 'WithPerms', status: 'Active' })
        const permIds = await makePermissions(3)
        await roleSvc.permission_assign_selected(role.id, permIds)

        // verifikasi 3 permission benar-benar tersimpan (bug lama: 0/race)
        const reloaded = await AppDataSource.getRepository(Role).findOne({
            where: { id: role.id }, relations: ['permissions'],
        })
        expect(reloaded?.permissions.length).toBe(3)
    })

    it('permission_unassign_selected menghapus permission terpilih', async () => {
        const role: any = await roleSvc.store({ name: 'R2', status: 'Active' })
        const permIds = await makePermissions(3)
        await roleSvc.permission_assign_selected(role.id, permIds)
        await roleSvc.permission_unassign_selected(role.id, [permIds[0], permIds[1]])
        const reloaded = await AppDataSource.getRepository(Role).findOne({
            where: { id: role.id }, relations: ['permissions'],
        })
        expect(reloaded?.permissions.length).toBe(1)
    })
})
