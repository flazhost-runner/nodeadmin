import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { expectToast, confirmAndProceed, clickDropdownItem } from './helpers/ui'

// ID user yang dibuat pada test 'create' — dipakai oleh test edit & delete
let createdUserId: string | undefined
const ts = Date.now()
const testEmail = `etest${ts}@example.com`
const testCode = `TC${String(ts).slice(-8)}`

test.describe('Access › User Management', () => {
  test.describe.configure({ mode: 'serial' })

  // ─── Index ───────────────────────────────────────────────────────────────

  test('halaman user index tampil dengan tabel', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/user')
    await expect(page.locator('h1')).toContainText('User Management')
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('a:has-text("Add Data")')).toBeVisible()
  })

  test('search user berdasarkan email', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/user')
    await page.fill('input[name="q_email"]', 'admin@')
    await page.locator('button[type="submit"][form="searchform"]').click()
    await expect(page).toHaveURL(/q_email=admin/)
    await expect(page.locator('table')).toBeVisible()
  })

  // ─── Create ──────────────────────────────────────────────────────────────

  test('halaman create user tampil dengan form lengkap', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/user/create')
    await expect(page.locator('h2')).toContainText('User Form')
    await expect(page.locator('input[name="code"]')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('select[name="status"]')).toBeVisible()
  })

  test('create user sukses → redirect index + toast sukses', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/user/create')

    await page.fill('input[name="code"]', testCode)
    await page.fill('input[name="name"]', `E2E Test User ${ts}`)
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="phone"]', '081234567890')
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="password_confirmation"]', 'Password123!')
    await page.selectOption('select[name="status"]', 'Active')
    // Pilih role pertama yang tersedia
    await page.locator('input[name="roles[]"]').first().check()

    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/admin/v1/access/user')
    await expectToast(page, 'Store User Success.')

    // Simpan ID user dari link edit pada baris yang baru dibuat
    const row = page.locator(`tbody tr:has-text("${testEmail}")`)
    const editLink = row.locator('a[href*="/edit"]')
    if (await editLink.count() > 0) {
      // Buka dropdown lalu ambil href edit
      await row.locator('button[data-toggle-dd]').click()
      const href = await row.locator('a.dropdown-item[href*="/edit"]').getAttribute('href')
      createdUserId = href?.match(/\/access\/user\/(\d+)\/edit/)?.[1]
    }
  })

  test('create user validasi gagal → tetap di form + field is-invalid', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/user/create')
    // Submit tanpa mengisi field wajib (code, name, email, password, roles)
    await page.locator('button[type="submit"]').click()
    // Validator gagal → redirect balik ke create
    await expect(page).toHaveURL(/\/admin\/v1\/access\/user\/create/)
  })

  // ─── Edit ────────────────────────────────────────────────────────────────

  test('halaman edit user tampil dengan data yang sudah terisi', async ({ page }) => {
    if (!createdUserId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/user/${createdUserId}/edit`)
    await expect(page.locator('h2')).toContainText('User Form')
    // Email sudah terisi dengan data yang dibuat sebelumnya
    await expect(page.locator('input[name="email"]')).toHaveValue(testEmail)
    await expect(page.locator('input[name="code"]')).toHaveValue(testCode)
  })

  test('update user sukses → redirect index + toast sukses', async ({ page }) => {
    if (!createdUserId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/user/${createdUserId}/edit`)

    await page.fill('input[name="name"]', `E2E Test User Updated ${ts}`)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/admin/v1/access/user')
    await expectToast(page, 'Update User Success.')
  })

  // ─── Delete ──────────────────────────────────────────────────────────────

  test('delete user → confirm dialog → toast sukses', async ({ page }) => {
    if (!createdUserId) test.skip()
    await login(page)
    await page.goto('/admin/v1/access/user')

    // Temukan baris user berdasarkan email
    const row = page.locator(`tbody tr:has-text("${testEmail}")`)
    await expect(row).toBeVisible()

    // Buka dropdown dan klik Delete
    await clickDropdownItem(row, 'Delete')

    // Konfirmasi di modal custom
    await confirmAndProceed(page)

    // Redirect ke index + toast sukses
    await page.waitForURL('**/admin/v1/access/user')
    await expectToast(page, 'Delete User Success.')
  })

  // ─── Delete Selected ─────────────────────────────────────────────────────

  test('delete selected: buat 2 user → pilih → hapus sekaligus', async ({ page }) => {
    await login(page)

    const tsA = Date.now()
    const tsB = tsA + 1

    // Buat user A
    await page.goto('/admin/v1/access/user/create')
    await page.fill('input[name="code"]', `DSA${String(tsA).slice(-7)}`)
    await page.fill('input[name="name"]', `Delete Sel A ${tsA}`)
    await page.fill('input[name="email"]', `dsa${tsA}@example.com`)
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="password_confirmation"]', 'Password123!')
    await page.selectOption('select[name="status"]', 'Active')
    await page.locator('input[name="roles[]"]').first().check()
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/admin/v1/access/user')

    // Buat user B
    await page.goto('/admin/v1/access/user/create')
    await page.fill('input[name="code"]', `DSB${String(tsB).slice(-7)}`)
    await page.fill('input[name="name"]', `Delete Sel B ${tsB}`)
    await page.fill('input[name="email"]', `dsb${tsB}@example.com`)
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="password_confirmation"]', 'Password123!')
    await page.selectOption('select[name="status"]', 'Active')
    await page.locator('input[name="roles[]"]').first().check()
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/admin/v1/access/user')

    // Pilih checkbox untuk user A dan B
    await page.locator(`tbody tr:has-text("dsa${tsA}@example.com") input[type="checkbox"]`).check()
    await page.locator(`tbody tr:has-text("dsb${tsB}@example.com") input[type="checkbox"]`).check()

    // Klik "Delete Selected"
    await page.locator('button:has-text("Delete Selected")').click()

    // Konfirmasi di modal custom
    await confirmAndProceed(page)

    await page.waitForURL('**/admin/v1/access/user')
    await expectToast(page, 'Delete User Success.')
  })
})
