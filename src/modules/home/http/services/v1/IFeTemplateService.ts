/** Kontrak FeTemplateService (template frontend / landing switcher). */
export interface IFeTemplateService {
    /** Slug template aktif (dari setting; fallback default). */
    getActiveSlug(): Promise<string>
    /** True bila slug aktif = template default yang dirender via EJS (bukan raw HTML). */
    isDefaultEjs(slug: string): boolean
    /** HTML landing aktif (raw, untuk template non-default dari file lokal). */
    getActiveHtml(): Promise<string>
    /** Pastikan file template tersedia lokal — download dari opentailwind bila perlu. */
    ensure(slug: string): Promise<void>
    /** Apakah file template sudah ada di cache lokal. */
    isCached(slug: string): boolean
}
