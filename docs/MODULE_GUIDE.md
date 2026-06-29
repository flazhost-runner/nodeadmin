# Panduan Membuat Modul Baru

Langkah konkret + template untuk menambah modul agar **otomatis sejalan** dengan pola, prinsip, security, testing, dan dokumentasi yang ada. Contoh: modul **Product** (`name`, `price`, `status`). Ganti `Product`/`product` sesuai kebutuhan.

> Setelah selesai, WAJIB: `npm run lint:conventions` → `npx tsc --noEmit` → `npm test` (semua lolos). Aturan: lihat `AGENTS.md`.

Struktur target:
```
src/modules/product/
├── Module.ts
├── models/product.entity.ts
├── migrations/<ts>-CreateProductTable.ts
├── http/
│   ├── services/v1/IProductService.ts
│   ├── services/v1/ProductService.ts
│   ├── controllers/web/v1/ProductController.ts
│   ├── controllers/api/v1/ProductController.ts   (opsional)
│   └── validators/ProductValidator.ts
├── routes/web.ts
├── routes/api.ts                                  (opsional)
└── views/be/default/product/{index,create,edit}.ejs
```

---

## 1. Module.ts
```ts
export default class Module {
    public static path: string = __dirname
    public static filePath: string = 'modules/product/'
}
```

## 2. Entity — tipe portabel
```ts
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'

enum StatusEnum { ACTIVE = 'Active', INACTIVE = 'Inactive' }

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 100 })
  @Index('products__name')
  name!: string

  @Column({ type: 'int', default: 0 })
  price!: number

  @Column({ type: 'varchar', length: 20, default: StatusEnum.ACTIVE })
  status!: StatusEnum

  @Column({ type: 'text', nullable: true })   // ✅ 'text', BUKAN 'longtext'
  description?: string

  @CreateDateColumn()   // ✅ tanpa { type }
  created_at!: Date
  @UpdateDateColumn()
  updated_at!: Date
}
```

## 3. Migration
```bash
npm run migration:create   # nama: CreateProductTable, modul: product
```
Isi pakai TypeORM `Table` API (portabel) — JANGAN raw SQL vendor. Contoh tipe: `uuid`/`varchar`/`int`/`text`/`timestamp`. Lihat `modules/access/migrations/*CreateRoleTable.ts` sebagai acuan.

## 4. Interface service
```ts
// http/services/v1/IProductService.ts
export interface IProductService {
  index(filter: any): Promise<any>
  store(request: any): Promise<any>
  edit(id: string): Promise<any>
  update(id: string, request: any): Promise<any>
  delete(id: string): Promise<any>
}
```

## 5. Service — @injectable, dual-mode, throw, pakai helper
```ts
import { Repository } from 'typeorm'
import { injectable, inject } from 'tsyringe'
import AppDataSource from '../../../../../config/ormconfig'
import { Product } from '../../../models/product.entity'
import functions, { removePrefix, ciLike, paginate } from '../../../../../helpers/functions'
import { IProductService } from './IProductService'
import { TOKENS } from '../../../../../tokens'
import { NotFoundError, ConflictError, AppError } from '../../../../../errors/AppError'

@injectable()
export default class ProductService implements IProductService {
  constructor(
    @inject(TOKENS.ProductRepository) private repo: Repository<Product> = AppDataSource.getRepository(Product),
  ) {}

  async index(filter: any) {
    const c = removePrefix(filter, 'q_')
    let query = this.repo.createQueryBuilder('products')
    if (c.name) query = query.andWhere(...ciLike('products.name', 'name', c.name))
    if (c.status) query = query.andWhere('products.status = :status', { status: c.status })
    return paginate(query, c)
  }

  async store(request: any) {
    const exists = await this.repo.findOne({ where: { name: request.name } })
    if (exists) throw new ConflictError('Product Already Exists')
    request = functions.removeEmptyFields(request)
    const result = await this.repo.save(this.repo.create({ ...request }))
    if (!result) throw new AppError('Store Product Fail', 500)
    return result
  }

  async edit(id: string) {
    return this.repo.findOne({ where: { id } })
  }

  async update(id: string, request: any) {
    const item = await this.repo.findOne({ where: { id } })
    if (!item) throw new NotFoundError('Product not found')
    request = functions.removeEmptyFields(request)
    return this.repo.save(this.repo.merge(item, { ...request }))
  }

  async delete(id: string) {
    const item = await this.repo.findOne({ where: { id } })
    if (!item) throw new NotFoundError('Product not found')
    return this.repo.remove(item)
  }
}
```

## 6. Token + registrasi
`src/tokens.ts` — tambah:
```ts
ProductRepository: Symbol('ProductRepository'),
IProductService: Symbol('IProductService'),
```
`src/container.ts` — tambah:
```ts
import { Product } from './modules/product/models/product.entity'
container.register(TOKENS.ProductRepository, { useFactory: () => { assertInit(); return AppDataSource.getRepository(Product) } })
import ProductService from './modules/product/http/services/v1/ProductService'
container.register(TOKENS.IProductService, { useClass: ProductService })
```

## 7. Controller (web)
```ts
import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import Module from '../../../../Module'
import { IProductService } from '../../../services/v1/IProductService'
import { TOKENS } from '../../../../../../tokens'
import { renderView } from '../../../../../../utils/view'

@injectable()
export default class ProductController {
  constructor(@inject(TOKENS.IProductService) private productService: IProductService) {}

  async index(req: Request, res: Response) {
    const filter = req.query
    const { datas, paginate_data } = await this.productService.index(filter)
    renderView(res, Module.path, 'product/index', { datas, filter, paginate_data })
  }
  async create(req: Request, res: Response) {
    renderView(res, Module.path, 'product/create')
  }
  async store(req: Request, res: Response) {
    await this.productService.store(req.body)   // error otomatis ke errorHandler
    req.session.flashMessage = { key: 'success', message: 'Store Product Success.' }
    res.redirect('/admin/v1/product')
  }
  async edit(req: Request, res: Response) {
    const data = await this.productService.edit(req.params.id)
    renderView(res, Module.path, 'product/edit', { data })
  }
  async update(req: Request, res: Response) {
    await this.productService.update(req.params.id, req.body)
    req.session.flashMessage = { key: 'success', message: 'Update Product Success.' }
    res.redirect('/admin/v1/product')
  }
  async delete(req: Request, res: Response) {
    await this.productService.delete(req.params.id)
    req.session.flashMessage = { key: 'success', message: 'Delete Product Success.' }
    res.redirect('/admin/v1/product')
  }
}
```
**Controller API** (opsional): sama, tapi `return ResponseHandler.success(res, 'Success', data)` alih-alih render.

## 8. Validator (Joi + stripUnknown)
```ts
import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

const schema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().min(0).optional(),
  status: Joi.string().valid('Active', 'Inactive').optional(),
  description: Joi.string().allow('').optional(),
})

export const ProductValidator = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true })
  if (error) {
    req.session.errors = error.details.map(d => ({ path: d.context?.key, msg: d.message }))
    req.session.old = req.body
    return res.redirect('back') as any
  }
  req.body = value   // cegah mass-assignment
  next()
}
```

## 9. Routes (web) — handler() + urutan middleware
```ts
import { Router } from 'express'
import named from '../../../utils/namedRoutes'
import ProductController from '../http/controllers/web/v1/ProductController'
import { ensureAuthenticated } from '../../auth/http/middleware/authMiddleware'
import AccessMiddleware from '../../access/http/middleware/AccessMiddleware'
import { ProductValidator } from '../http/validators/ProductValidator'
import { handler } from '../../../utils/routeBinding'

const router = Router()
const r = named.extendRouter(Router())

r.get('admin.v1.product.index', '/admin/v1/product', ensureAuthenticated, AccessMiddleware, handler(ProductController, 'index'))
r.get('admin.v1.product.create', '/admin/v1/product/create', ensureAuthenticated, AccessMiddleware, handler(ProductController, 'create'))
r.post('admin.v1.product.store', '/admin/v1/product/store', ensureAuthenticated, AccessMiddleware, ProductValidator, handler(ProductController, 'store'))
r.get('admin.v1.product.edit', '/admin/v1/product/:id/edit', ensureAuthenticated, AccessMiddleware, handler(ProductController, 'edit'))
r.put('admin.v1.product.update', '/admin/v1/product/:id/update', ensureAuthenticated, AccessMiddleware, ProductValidator, handler(ProductController, 'update'))
r.delete('admin.v1.product.delete', '/admin/v1/product/:id/delete', ensureAuthenticated, AccessMiddleware, handler(ProductController, 'delete'))

router.use(r)
export default router
```
Modul dimuat otomatis oleh `loadRoutes` (tak perlu daftar manual di index.ts).

> **Method update/delete (WAJIB):** `update = PUT`, `delete = DELETE`. Form HTML hanya GET/POST → picu lewat method-override `action=".../update?_method=PUT"` / `action=".../delete?_method=DELETE"`. Tombol delete di view index = **form** `<form method="post" action=".../delete?_method=DELETE">` + `<button data-confirm>`, BUKAN `<a href>` (lihat `UI_COMPONENTS.md` + "Method-override" di PORTING_GUIDE).

> **RBAC route-driven:** `AccessMiddleware` dipasang **tanpa argumen** — ia menurunkan `(nama-route, method)` dari request lalu mencocokkan permission `name`+`method` milik role user (Administrator bypass). Permission **di-scan otomatis dari route bernama** (bukan daftar subject hardcoded). Karena itu cukup pasang `AccessMiddleware` di chain; granularitas mengikuti named-route. Lihat **"RBAC (Route-Driven)"** di `ARCHITECTURE.md`.

## 10. Views (`views/be/default/product/`)
Salin pola dari `modules/access/views/be/default/users/` (index = tabel + search + pagination `mt-4`; create/edit = form). Form mutasi: token CSRF di-inject otomatis (foot.ejs). Status pakai ikon FontAwesome (`fa-check-circle`/`fa-times-circle`).

## 11. Test (wajib)
- **Integration** `tests/integration/productService.test.ts`:
  ```ts
  import ProductService from '../../src/modules/product/http/services/v1/ProductService'
  import { resetDb } from '../setup/jest.setup'
  const svc = new ProductService()   // dual-mode → pakai default repo
  describe('ProductService', () => {
    beforeEach(async () => { await resetDb() })
    it('store + reject duplikat', async () => {
      const p: any = await svc.store({ name: 'A', status: 'Active' })
      expect(p.name).toBe('A')
      await expect(svc.store({ name: 'A' })).rejects.toThrow()
    })
  })
  ```
  (Catatan: `resetDb()` perlu menambah `Product` ke daftar `clear()` di `tests/setup/jest.setup.ts` bila tabelnya ikut entities.)
- **API** `tests/api/product.test.ts`: pakai `loginWeb()` + `getCsrf()` dari `tests/setup/helpers.ts`.
- **BDD** (jika user-facing): tambah `.feature` + steps.

## 12. Dokumentasi
- `README.md` → tambah fitur Product.
- `docs/API.md` → tambah endpoint bila ada API.

## 13. Verifikasi akhir
```bash
npm run lint:conventions   # harus lolos
npx tsc --noEmit           # 0 error
npm test                   # hijau (termasuk test Product baru)
```
