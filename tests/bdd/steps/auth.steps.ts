import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { CustomWorld, ADMIN, extractCsrf } from './world'

Given('saya di halaman login', async function (this: CustomWorld) {
    this.response = await this.agent.get('/auth/login')
    this.csrf = extractCsrf(this.response.text)
    assert.strictEqual(this.response.status, 200)
})

When('saya login sebagai admin dengan password benar', async function (this: CustomWorld) {
    this.response = await this.agent.post('/auth/login').type('form')
        .send({ email: ADMIN.email, password: ADMIN.password, _csrf: this.csrf })
})

When('saya login sebagai admin dengan password salah', async function (this: CustomWorld) {
    this.response = await this.agent.post('/auth/login').type('form')
        .send({ email: ADMIN.email, password: 'salah', _csrf: this.csrf })
})

When('saya membuka {string} tanpa login', async function (this: CustomWorld, url: string) {
    this.response = await this.agent.get(url)
})

Then('saya diarahkan ke dashboard', function (this: CustomWorld) {
    assert.strictEqual(this.response.status, 302)
    assert.ok(this.response.headers.location.includes('/admin/v1/dashboard'))
})

Then('saya tetap diarahkan ke halaman login', function (this: CustomWorld) {
    assert.strictEqual(this.response.status, 302)
    assert.ok(this.response.headers.location.includes('/auth/login'))
})

Then('saya diarahkan ke halaman login', function (this: CustomWorld) {
    assert.strictEqual(this.response.status, 302)
    assert.ok(this.response.headers.location.includes('/auth/login'))
})
