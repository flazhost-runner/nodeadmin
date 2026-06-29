/** Kontrak DashboardService. */
export interface IDashboardService {
    stats(): Promise<{ users: number; roles: number; permissions: number }>
}
