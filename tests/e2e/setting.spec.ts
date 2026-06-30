import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { expectToast } from './helpers/ui'

test.describe('Setting', () => {
  test('halaman setting tampil dengan semua kartu konfigurasi', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/setting')
    await expect(page.locator('h1')).toContainText('Setting Management')
    // Kartu Admin Theme
    await expect(page.locator('h2:has-text("Admin Theme")')).toBeVisible()
    // Kartu Frontend Template
    await expect(page.locator('h2:has-text("Frontend Template")')).toBeVisible()
    // Tombol save
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('halaman setting menampilkan 9 swatch tema', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/setting')
    await expect(page.locator('input[name="theme"]')).toHaveCount(9)
    // Satu tema aktif
    await expect(page.locator('input[name="theme"]:checked')).toHaveCount(1)
  })

  test('memilih swatch tema mengubah pilihan aktif di UI (belum disimpan)', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/setting')
    await page.waitForLoadState('networkidle')

    // Klik swatch tema "Green"
    await page.locator('label:has(input[value="Green"])').click({ force: true })
    await expect(page.locator('input[name="theme"][value="Green"]')).toBeChecked()
  })

  test('simpan setting → toast sukses', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/setting')
    await page.waitForLoadState('networkidle')

    // Klik save tanpa mengubah apapun → tetap valid
    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL('**/admin/v1/setting')
    await expectToast(page, 'Save Setting Success.')
  })

  test('search frontend template catalog berfungsi', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/setting')

    // Isi form pencarian template
    await page.fill('input[name="q_name"]', 'agency')
    await page.locator('button:has-text("Cari")').click()

    await expect(page).toHaveURL(/q_name=agency/)
    // Tabel/grid template masih tampil
    await expect(page.locator('h2:has-text("Frontend Template")')).toBeVisible()
  })

  test('filter kategori template berfungsi', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/setting')

    // Pilih kategori dari dropdown jika ada pilihan
    const categorySelect = page.locator('select[name="q_category"]')
    const optionCount = await categorySelect.locator('option').count()
    if (optionCount > 1) {
      // Pilih opsi kedua (bukan "Semua kategori")
      const secondOption = await categorySelect.locator('option').nth(1).getAttribute('value')
      if (secondOption) {
        await categorySelect.selectOption(secondOption)
        await page.locator('button:has-text("Cari")').click()
        await expect(page).toHaveURL(new RegExp(`q_category=${encodeURIComponent(secondOption)}`))
      }
    }
  })
})
