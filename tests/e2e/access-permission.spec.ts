import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { expectToast, confirmAndProceed, clickDropdownItem } from './helpers/ui'

let createdPermissionId: string | undefined
const ts = Date.now()
const permName = `e2e.permission.${ts}`

test.describe('Access › Permission Management', () => {
  test.describe.configure({ mode: 'serial' })

  // ─── Index ───────────────────────────────────────────────────────────────

  test('halaman permission index tampil dengan tabel', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/permission')
    await expect(page.locator('h1')).toContainText('Permission Management')
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('a:has-text("Add Data")')).toBeVisible()
  })

  test('search permission berdasarkan nama', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/permission')
    await page.fill('input[name="q_name"]', 'admin')
    await page.locator('button[type="submit"][form="searchform"]').click()
    await expect(page).toHaveURL(/q_name=admin/)
    await expect(page.locator('table')).toBeVisible()
  })

  test('filter permission berdasarkan guard', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/permission')
    await page.selectOption('select[name="q_guard"]', 'web')
    await page.locator('button[type="submit"][form="searchform"]').click()
    await expect(page).toHaveURL(/q_guard=web/)
  })

  // ─── Create ──────────────────────────────────────────────────────────────

  test('halaman create permission tampil dengan form', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/permission/create')
    await expect(page.locator('h2')).toContainText('Permission Form')
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="method"]')).toBeVisible()
    await expect(page.locator('select[name="guard_name"]')).toBeVisible()
    await expect(page.locator('select[name="status"]')).toBeVisible()
  })

  test('create permission sukses → redirect index + toast sukses', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/permission/create')

    await page.fill('input[name="name"]', permName)
    await page.selectOption('select[name="guard_name"]', 'web')
    await page.fill('input[name="method"]', 'GET')
    await page.fill('input[name="desc"]', `E2E test permission ${ts}`)
    await page.selectOption('select[name="status"]', 'Active')

    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/admin/v1/access/permission')
    await expectToast(page, 'Store Permission Success.')

    // Ambil ID dari link edit pada baris yang baru dibuat
    const row = page.locator(`tbody tr:has-text("${permName}")`)
    await row.locator('button[data-toggle-dd]').click()
    const href = await row.locator('a.dropdown-item[href*="/edit"]').getAttribute('href')
    createdPermissionId = href?.match(/\/access\/permission\/(\d+)\/edit/)?.[1]
  })

  test('create permission validasi gagal (name kosong) → tetap di form + is-invalid', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/permission/create')
    // Submit tanpa mengisi name dan method
    await page.selectOption('select[name="status"]', 'Active')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/admin\/v1\/access\/permission\/create/)
    await expect(page.locator('.is-invalid')).toBeVisible()
  })

  // ─── Edit ────────────────────────────────────────────────────────────────

  test('halaman edit permission tampil dengan data yang sudah terisi', async ({ page }) => {
    if (!createdPermissionId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/permission/${createdPermissionId}/edit`)
    await expect(page.locator('h2')).toContainText('Permission Form')
    await expect(page.locator('input[name="name"]')).toHaveValue(permName)
    await expect(page.locator('input[name="method"]')).toHaveValue('GET')
  })

  test('update permission sukses → redirect index + toast sukses', async ({ page }) => {
    if (!createdPermissionId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/permission/${createdPermissionId}/edit`)

    await page.fill('input[name="desc"]', `Updated desc ${ts}`)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/admin/v1/access/permission')
    await expectToast(page, 'Update Permission Success.')
  })

  // ─── Delete ──────────────────────────────────────────────────────────────

  test('delete permission → confirm dialog → toast sukses', async ({ page }) => {
    if (!createdPermissionId) test.skip()
    await login(page)
    await page.goto('/admin/v1/access/permission')

    const row = page.locator(`tbody tr:has-text("${permName}")`)
    await expect(row).toBeVisible()

    await clickDropdownItem(row, 'Delete')
    await confirmAndProceed(page)

    await page.waitForURL('**/admin/v1/access/permission')
    await expectToast(page, 'Delete Permission Success.')
  })

  // ─── Delete Selected ─────────────────────────────────────────────────────

  test('delete selected: buat 2 permission → pilih → hapus sekaligus', async ({ page }) => {
    await login(page)

    const tsA = Date.now()
    const tsB = tsA + 1
    const nameA = `e2e.del.a.${tsA}`
    const nameB = `e2e.del.b.${tsB}`

    for (const [name] of [[nameA], [nameB]]) {
      await page.goto('/admin/v1/access/permission/create')
      await page.fill('input[name="name"]', name)
      await page.selectOption('select[name="guard_name"]', 'web')
      await page.fill('input[name="method"]', 'GET')
      await page.selectOption('select[name="status"]', 'Active')
      await page.locator('button[type="submit"]').click()
      await page.waitForURL('**/admin/v1/access/permission')
    }

    // Pilih kedua permission yang baru dibuat
    await page.locator(`tbody tr:has-text("${nameA}") input[type="checkbox"]`).check()
    await page.locator(`tbody tr:has-text("${nameB}") input[type="checkbox"]`).check()

    await page.locator('button:has-text("Delete Selected")').click()
    await confirmAndProceed(page)

    await page.waitForURL('**/admin/v1/access/permission')
    await expectToast(page, 'Delete Permission Success.')
  })
})
