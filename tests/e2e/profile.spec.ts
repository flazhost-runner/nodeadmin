import { test, expect } from '@playwright/test'
import { login, ADMIN } from './helpers/auth'
import { expectToast } from './helpers/ui'

test.describe('Profile', () => {
  test('halaman profile tampil dengan data user yang sedang login', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/profile')
    await expect(page.locator('h1')).toContainText('Profile')
    await expect(page.locator('h2')).toContainText('User Form')
    // Email field sudah terisi dengan email admin yang login
    await expect(page.locator('input[name="email"]')).toHaveValue(ADMIN.email)
    // Field penting lainnya terlihat
    await expect(page.locator('input[name="code"]')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('select[name="status"]')).toBeVisible()
  })

  test('update profile sukses → redirect dashboard + toast sukses', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/profile')

    // Update nama saja (field lain sudah terisi dari data server)
    const currentName = await page.locator('input[name="name"]').inputValue()
    await page.fill('input[name="name"]', currentName || 'Admin Updated')

    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/admin/v1/dashboard')
    await expectToast(page, 'Update Profile Success.')

    // Kembalikan nama ke semula
    await page.goto('/admin/v1/profile')
    if (currentName) {
      await page.fill('input[name="name"]', currentName)
      await page.locator('button[type="submit"]').click()
      await page.waitForURL('**/admin/v1/dashboard')
    }
  })

  test('form profile memiliki semua field yang diperlukan', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/profile')
    await expect(page.locator('input[name="code"]')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="phone"]')).toBeVisible()
    await expect(page.locator('select[name="timezone"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="picture"]')).toBeVisible()
  })
})
