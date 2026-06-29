/** Kontrak RoleService (Dependency Inversion + Interface Segregation). */
export interface IRoleService {
    index(filter: any): Promise<any>
    store(request: any): Promise<any>
    edit(id: string): Promise<any>
    update(id: string, request: any): Promise<any>
    delete(id: string): Promise<any>
    permission(role_id: string, filter: any): Promise<any>
    permission_assign(role_id: string, permission_id: string): Promise<any>
    permission_assign_selected(role_id: string, permissions: string[]): Promise<any>
    permission_unassign(role_id: string, permission_id: string): Promise<any>
    permission_unassign_selected(role_id: string, permissions: string[]): Promise<any>
}
