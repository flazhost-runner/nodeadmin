# UI Components — Katalog & Snippet

Acuan komponen UI untuk membuat elemen yang konsisten. **Lihat langsung** di halaman `/admin/v1/components`; **salin snippet** dari sini.

Stack UI: EJS + Tailwind (Preflight ON) + komponen kelas via `@apply` di `be/default/head.ejs` (`form-control`, `btn`, `table`, `badge`, `pagination`, `dropdown`, dll) + Chart.js + Font Awesome 5. Warna aksen pakai CSS variable tema: `var(--primary)`, `var(--secondary)`, `var(--theme-light)`, `var(--theme-dark)` → otomatis ikut template switcher.

> Helper view yang tersedia: `route(name, params)`, `getError(field)`, `getOld(field)`, `getFlashMessage(key)`, `getFile(path)`, `addOrUpdateQueryParam(url, key, val)`, `now(fmt)`, `theme`/`themeName`/`themes`, `setting`, `auth`.

---

## 1. Stat Card + Counter
Kartu metrik dengan angka beranimasi (counter) + ikon + aksen warna.
```html
<div class="stat-card bg-white rounded-xl shadow-lg p-6 hover-scale" style="border-left:4px solid var(--primary)">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-gray-600 text-sm font-medium">Total Item</p>
      <p class="text-3xl font-bold text-gray-800 counter" data-target="<%= value %>">0</p>
    </div>
    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background:var(--theme-light)">
      <i class="fas fa-box text-xl" style="color:var(--primary)"></i>
    </div>
  </div>
</div>
```
Counter butuh script (lihat §Script): elemen `.counter` + atribut `data-target`.

## 2. Chart (Chart.js, themeable)
Canvas + script. Warna garis/segmen pakai `THEME.primary` agar ikut tema.
```html
<div class="bg-white rounded-xl shadow-lg p-6"><div class="h-64"><canvas id="myChart"></canvas></div></div>
```
```js
var THEME = <%- JSON.stringify(theme) %>;   // dari res.locals.theme
new Chart(document.getElementById('myChart').getContext('2d'), {
  type: 'line', // atau 'doughnut','bar'
  data: { labels:['Sen','Sel','Rab'], datasets:[{ data:[12,19,8], borderColor:THEME.primary, backgroundColor:'rgba(0,0,0,0.05)', borderWidth:3, fill:true, tension:0.4 }] },
  options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } }
});
```
Doughnut: `backgroundColor:[THEME.primary,'#10B981','#F59E0B','#EF4444']`.

## 3. Badge & Status
```html
<span class="badge text-bg-primary">Primary</span>
<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Delivered</span>
<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Processing</span>
```
Status ikon (dipakai di tabel — Font Awesome 5):
```html
<% if (data.status == 'Active') { %>
  <i class="fas fa-check-circle text-green-500 text-xl" title="Active"></i>
<% } else { %>
  <i class="fas fa-times-circle text-red-500 text-xl" title="Inactive"></i>
<% } %>
```

## 4. Alert (banner)
> **Flash message (sukses/error) di halaman admin TIDAK pakai banner ini.** Flash otomatis tampil sebagai **Toast global** (lihat §Popup → Flash → Toast). Jangan tambahkan banner flash per-view di halaman ber-layout `main` — duplikat dengan toast.
>
> Banner di bawah hanya untuk halaman **full-width tanpa layout `main`** (mis. auth: login/reset) yang tak punya toast global, atau untuk alert statis non-flash (info/highlight dalam konten).

```html
<% if(getFlashMessage('success')) { %>
  <div class="alert alert-success shadow-sm"><%= getFlashMessage('success').message %></div>
<% } %>
<% if(getFlashMessage('error')) { %>
  <div class="alert alert-danger shadow-sm"><%= getFlashMessage('error').message %></div>
<% } %>
```
Varian: `alert-success` (hijau), `alert-danger` (merah), `alert-info` (biru), `alert-warning` (kuning), dan **`alert-primary`** (beraksen tema — ikut template switcher, untuk info/highlight).

## 5. Button & Dropdown Action
```html
<button class="btn btn-primary-tw px-4 py-2"><i class="fas fa-save me-1"></i> Save</button>
<button class="btn btn-success btn-sm">Success</button>
<button class="btn btn-danger btn-sm">Danger</button>

<div class="btn-group">
  <button type="button" class="btn btn-sm btn-primary dropdown-toggle" data-toggle-dd aria-expanded="false">Action</button>
  <div class="dropdown-menu dropdown-menu-end">
    <a href="<%= route('admin.v1.x.edit', { id: data.id }) %>" class="dropdown-item"><i class="fas fa-pen fa-fw"></i> Edit</a>
    <div class="dropdown-divider"></div>
    <!-- Delete = DELETE (method-override): FORM POST + ?_method=DELETE, BUKAN <a href> GET -->
    <form method="post" action="<%= route('admin.v1.x.delete', { id: data.id }) %>?_method=DELETE" class="m-0">
      <button type="submit" data-confirm="Confirm Delete" class="dropdown-item danger"><i class="fas fa-trash fa-fw"></i> Delete</button>
    </form>
  </div>
</div>
```
Dropdown digerakkan vanilla JS global (`data-toggle-dd`) di `foot.ejs` — tak perlu script tambahan.

## Popup: Modal / Toast / Confirm
Helper global (didefinisikan di `foot.ejs`) — tersedia di semua halaman, vanilla JS, themeable.

**Toast** (notif pojok, auto-hilang):
```js
Toast('Tersimpan!', 'success')   // type: 'success' | 'error' | 'info'
```

**Modal** (dialog tengah):
```js
Modal.open({
  title: 'Judul',
  body: '<p>Isi HTML…</p>',
  buttons: [
    { label: 'Batal', class: 'btn btn-danger px-4 py-2 text-white' },
    { label: 'Simpan', class: 'btn btn-primary-tw px-4 py-2', onClick: function(){ /* aksi */ } },
  ],
})
Modal.close()
```

**Confirm dialog** (pengganti `confirm()` browser, bertema, Promise):
```js
confirmDialog('Yakin hapus?').then(function(ok){ if (ok) { /* lanjut */ } })
```

**Otomatis di form/tombol** — cukup atribut `data-confirm` (tanpa JS); handler konfirmasi lalu submit form induk (`el.form.submit()`):
```html
<!-- Delete single = method DELETE via override (FORM POST + ?_method=DELETE, BUKAN <a href> GET) -->
<form method="post" action="<%= route('admin.v1.x.delete', { id: data.id }) %>?_method=DELETE" class="m-0">
  <button type="submit" data-confirm="Confirm Delete" class="dropdown-item danger">Delete</button>
</form>
<button form="selection" formaction="..." data-confirm="Confirm Delete" class="btn btn-danger btn-sm">Delete Selected</button>
```
> CSRF: `foot.ejs` meng-inject `_csrf` ke semua form non-GET otomatis (Express parse body DELETE by Content-Type). Catatan port Go: `net/http` tak parse body form untuk DELETE → taruh `_csrf` di **query** (`&_csrf=…`) + middleware CSRF baca query. Lihat "Method-override + DELETE-delete" di PORTING_GUIDE.
→ confirm bertema muncul; jika OK, link diikuti / form di-submit otomatis. (Menggantikan `onclick="return confirm(...)"`.)

**Flash → Toast (global, otomatis di semua halaman admin).** Dipasang **sekali** di layout `main.ejs` (setelah include `foot.ejs`, agar `Toast()` sudah terdefinisi). Baca `res.locals.flashMessage` (`{ key, message }`) dan tampilkan sebagai toast — tak perlu kode per-view:
```ejs
<%- include('./foot.ejs') %>

<!-- Flash message → Toast (global, semua halaman admin) -->
<% if (typeof flashMessage !== 'undefined' && flashMessage && flashMessage.message) { %>
<script>
    (function () {
        var type = '<%= flashMessage.key %>' === 'success' ? 'success'
                 : '<%= flashMessage.key %>' === 'error' ? 'error' : 'info';
        Toast(<%- JSON.stringify(flashMessage.message) %>, type);
    })();
</script>
<% } %>
```
Konsekuensi saat porting: setelah wiring ini terpasang, **hapus banner flash per-view** di semua halaman ber-layout `main` (lihat §4). Halaman auth full-width tetap pakai banner.

## 6. Form (CRUD)
Token CSRF di-inject otomatis (foot.ejs). Untuk form upload pakai `enctype="multipart/form-data"`.
```html
<form method="POST" action="<%= route('admin.v1.x.store') %>">
  <div class="mb-3">
    <label class="form-label fw-semibold">Name</label>
    <input type="text" class="form-control <% if(getError('name')) { %>is-invalid<% } %>" name="name" value="<%= getOld('name') %>">
    <% if(getError('name')) { %><div class="invalid-feedback"><%= getError('name')['msg'] %></div><% } %>
  </div>
  <div class="mb-3">
    <label class="form-label fw-semibold">Status</label>
    <select name="status" class="form-control"><option>Active</option><option>Inactive</option></select>
  </div>
  <button type="submit" class="btn btn-primary-tw px-4 py-2"><i class="fas fa-save me-1"></i> Save</button>
</form>
```
Edit (PUT via method-override): `action="<%= route('admin.v1.x.update', { id: data.id }) %>?_method=PUT"`.

### Rich Text Editor (Trumbowyg + File Manager OSS)
Textarea biasa jadi rich editor: tambah class **`trumbowyg-editor`** (bukan `.trumbowyg` polos). Otomatis di-init `foot.ejs` dengan toolbar lengkap + tombol **File Manager** (unggah/sisip/hapus gambar ke OSS).

```html
<!-- Textarea biasa (plain) -->
<textarea class="form-control" name="note"></textarea>

<!-- Rich editor + file manager -->
<textarea class="trumbowyg-editor form-control" name="description"><%- data.description || '' %></textarea>
```

- Render konten tersimpan pakai `<%- %>` (HTML mentah) agar editor ter-init dengan isi.
- **Wajib sanitasi server-side** sebelum simpan (`helpers/sanitizeHtml.ts` → `cleanRichText()`) — cegah XSS, karena Joi tak mem-filter HTML. Contoh di `SettingService.update`.
- Saat submit, `foot.ejs` otomatis sync HTML editor → textarea sumber.

**File Manager** (modal): tombol ikon gambar di toolbar → browse gambar (`GET /admin/v1/media/list`), upload (`POST .../upload`), hapus (`POST .../delete`), klik thumbnail = sisip `<img>`. Backend = modul `media` (web, session + CSRF via header `x-csrf-token`). Folder OSS: `modules/media/editor/`. Tanpa OSS dikonfigurasi → list kosong (graceful, tak crash). Aset: `public/be/default/vendor/trumbowyg/filemanager.js`.

## 7. Data Table + Pagination
```html
<div class="tw-card p-0 overflow-hidden">
  <div class="px-6 py-4 border-b flex items-center justify-between">
    <h2 class="text-lg font-bold" style="color:var(--primary)">List</h2>
    <a href="<%= route('admin.v1.x.create') %>" class="btn btn-success btn-sm"><i class="fas fa-fw fa-plus"></i> Add Data</a>
  </div>
  <div class="p-4" style="overflow-x:auto">
    <table class="table table-bordered table-hover align-middle">
      <thead><tr><th width="5%">No</th><th>Name</th><th width="15%">Status</th><th width="10%">Action</th></tr></thead>
      <tbody>
        <% datas.forEach((data,i) => { %>
        <tr>
          <td><%= (i+1)+(paginate_data.page_size*(paginate_data.current_page-1)) %></td>
          <td><%= data.name %></td>
          <td class="text-left"><!-- status icon §3 --></td>
          <td class="text-center"><!-- dropdown action §5 --></td>
        </tr>
        <% }); %>
      </tbody>
    </table>
    <div class="d-flex justify-content-end mt-4">
      <nav><ul class="pagination">
        <% if(paginate_data.current_page != 1) { %>
        <li class="page-item"><a class="page-link" href="<%= addOrUpdateQueryParam(fullUrl, 'q_page', paginate_data.current_page-1) %>">Previous</a></li>
        <% } %>
        <% for(let index = 1; index <= paginate_data.total_page; index++) { %>
        <li class="page-item <%= (index==paginate_data.current_page)?'active':'' %>"><a class="page-link" href="<%= addOrUpdateQueryParam(fullUrl, 'q_page', index) %>"><%= index %></a></li>
        <% } %>
        <% if(paginate_data.current_page != paginate_data.total_page && paginate_data.total_page!=0) { %>
        <li class="page-item"><a class="page-link" href="<%= addOrUpdateQueryParam(fullUrl, 'q_page', paginate_data.current_page+1) %>">Next</a></li>
        <% } %>
      </ul></nav>
    </div>
  </div>
</div>
```

## Script umum (counter)
Taruh di akhir view:
```js
document.querySelectorAll('.counter').forEach(function(el){
  var target = parseInt(el.getAttribute('data-target')), dur = 1200, step = target/(dur/16), cur = 0;
  var t = setInterval(function(){ cur += step; if(cur>=target){cur=target; clearInterval(t);} el.textContent = Math.floor(cur).toLocaleString(); }, 16);
});
```

---

## Catatan
- Aksen warna: pakai `var(--primary)`/`var(--theme-light)`/dll → ikut **template switcher** otomatis. Hindari warna primary hardcode.
- Kelas komponen (`form-control`/`btn`/`table`/`badge`/`pagination`/`dropdown`) didefinisikan di `src/resources/layouts/be/default/head.ejs` (`@layer components`) — ubah di sana untuk styling global.
- Ikon: **Font Awesome 5** (`fa-check-circle`, bukan `fa-circle-check` FA6).
- Live preview semua komponen: **`/admin/v1/components`**.
