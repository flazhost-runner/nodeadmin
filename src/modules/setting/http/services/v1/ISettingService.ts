/** Kontrak SettingService (Dependency Inversion + Interface Segregation). */
export interface ISettingService {
    index(): Promise<any>
    update(request: any, files?: any): Promise<any>
}
