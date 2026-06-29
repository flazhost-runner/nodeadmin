import type { FeTemplate } from '../../../../../config/feTemplates'
import type { PaginateResult } from '@flazhost-nodeadmin/core'

/** Kontrak FeCatalogService — katalog 640 landing opentailwind (server-side). */
export interface IFeCatalogService {
    /** Seluruh katalog (fetch GitHub tree sekali, lalu cache memori + disk). */
    list(): Promise<FeTemplate[]>
    /** Daftar kategori unik (untuk dropdown filter). */
    categories(): Promise<string[]>
    /** Hasil paginasi + filter (q_name / q_category). pinSlug → ke halaman 1. */
    paginate(filter: any, pinSlug?: string): Promise<PaginateResult<FeTemplate>>
    /** True bila slug ada di katalog (whitelist anti-SSRF). */
    has(slug: string): Promise<boolean>
    /** HTML mentah 1 template (on-demand, tanpa tulis disk). */
    previewHtml(slug: string): Promise<string>
}
