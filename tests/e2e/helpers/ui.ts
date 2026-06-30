import { Page, Locator, expect } from '@playwright/test'

// Flash message di halaman admin (main layout) ditampilkan sebagai Toast
export async function expectToast(page: Page, message: string, type: 'success' | 'error' | 'info' = 'success') {
  await expect(
    page.locator(`.toast.${type}.show span`).filter({ hasText: message })
  ).toBeVisible({ timeout: 5000 })
}

// Flash message di halaman full-width (login/register/reset) ditampilkan sebagai .alert-*
export async function expectAlertSuccess(page: Page, text: string) {
  await expect(page.locator('.alert-success').filter({ hasText: text })).toBeVisible()
}

export async function expectAlertError(page: Page) {
  await expect(page.locator('.alert-danger')).toBeVisible()
}

// Tunggu custom confirmDialog modal muncul lalu klik "Ya"
export async function confirmAndProceed(page: Page) {
  await expect(page.locator('#tw-modal.show')).toBeVisible({ timeout: 5000 })
  await page.locator('#tw-modal-footer .btn-primary-tw').click()
}

// Buka dropdown "Action" di row tabel lalu klik item berdasarkan teks
export async function clickDropdownItem(row: Locator, itemText: string) {
  await row.locator('button[data-toggle-dd]').click()
  await row.locator('.dropdown-item', { hasText: itemText }).click()
}

// Logout programatik (submit hidden form #logout-form)
export async function logout(page: Page) {
  await page.evaluate(() => (document.getElementById('logout-form') as HTMLFormElement)?.submit())
  await page.waitForURL('**/auth/login')
}
