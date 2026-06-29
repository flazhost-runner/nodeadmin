import { Router } from 'express'
import { namedRoutes as named } from '@flazhost-nodeadmin/core'
import HomeController from '../http/controllers/web/v1/HomeController'
import { handler } from '@flazhost-nodeadmin/core'

const router = Router()
const homeRoute = named.extendRouter(Router())

// Home publik (tanpa auth). Root '/' merender langsung di sini (URL bersih,
// tanpa redirect); '/home' = alias eksplisit yang dapat di-link.
// Catatan: route '/' didaftar di module (bukan rootHandler core) agar terkena
// expressLayouts → layout fe/default penuh ikut ter-render.
homeRoute.get('web.home.root', '/', handler(HomeController, 'index'))
homeRoute.get('web.home.index', '/home', handler(HomeController, 'index'))

router.use(homeRoute)

export default router
