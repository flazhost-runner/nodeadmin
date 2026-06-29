import AppDataSource from '../config/ormconfig'
import { Setting } from '../modules/setting/models/setting.entity'

/**
 * Cache in-memory untuk row Setting tunggal.
 * Setting dibaca di SETIAP request (globalFunctions) untuk logo/nama/tema.
 * Tanpa cache → 1 query DB per request. Dengan TTL pendek + invalidasi saat
 * update, query DB turun drastis tanpa mengorbankan kesegaran data.
 */

let cached: Setting | null = null
let expiresAt = 0
const TTL_MS = 60 * 1000 // 60 detik

export async function getSetting(): Promise<Setting | null> {
    const now = Date.now()
    if (cached && now < expiresAt) return cached
    const rows = await AppDataSource.getRepository(Setting).find({ take: 1 })
    cached = rows[0] || null
    expiresAt = now + TTL_MS
    return cached
}

/** Panggil setelah Setting diperbarui agar perubahan langsung terlihat. */
export function invalidateSetting(): void {
    cached = null
    expiresAt = 0
}
