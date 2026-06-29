import { test, expect } from '@playwright/test'

const ADMIN = { email: 'admin@admin.com', password: '12345678' }

async function login(page: any) {
    await page.goto('/auth/login')
    await page.fill('#email', ADMIN.email)
    await page.fill('#password', ADMIN.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/v1/dashboard')
}

test.describe('Theme switcher E2E', () => {
    test('halaman setting menampilkan 9 swatch tema', async ({ page }) => {
        await login(page)
        await page.goto('/admin/v1/setting')
        // 9 opsi tema tersedia
        await expect(page.locator('input[name="theme"]')).toHaveCount(9)
        // satu tema aktif (checked)
        await expect(page.locator('input[name="theme"]:checked')).toHaveCount(1)
    })

    test('memilih swatch mengubah pilihan aktif (UI)', async ({ page }) => {
        await login(page)
        await page.goto('/admin/v1/setting')
        await page.waitForLoadState('networkidle')
        // klik swatch Green → script menandai aktif
        await page.locator('label:has(input[value="Green"])').click({ force: true })
        await expect(page.locator('input[name="theme"][value="Green"]')).toBeChecked()
    })
})
