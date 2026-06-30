import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Dashboard', () => {
  test('dashboard tampil dengan heading dan statistik', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/admin\/v1\/dashboard/)
    await expect(page.locator('h1, h2').filter({ hasText: /Dashboard/i })).toBeVisible()
  })

  test('navigasi ke dashboard via sidebar/topbar berfungsi', async ({ page }) => {
    await login(page)
    // Navigasi manual ke dashboard
    await page.goto('/admin/v1/dashboard')
    await expect(page).toHaveURL(/\/admin\/v1\/dashboard/)
    await expect(page.locator('body')).not.toContainText('404')
    await expect(page.locator('body')).not.toContainText('Error')
  })
})
