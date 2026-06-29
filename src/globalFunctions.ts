import { Request, Response, NextFunction } from 'express'
import fileService from './services/fileService'
import { User } from './modules/access/models/user.entity'
import { getTheme, DEFAULT_THEME, THEMES } from '@flazhost-nodeadmin/core'
import { DEFAULT_FE_TEMPLATE } from './config/feTemplates'
import { getSetting } from './services/settingCache'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import tz from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(tz)

export const globalFunctions = async (req: Request, res: Response, next: NextFunction) => {
	res.locals.getError = (key: string) => {
		if (!res.locals.errors) {
			return false
		}
		return res.locals.errors.find((error: { path: string }) => error.path === key)
	}

	res.locals.getFlashMessage = (key: string) => {
		if (!res.locals.flashMessage) {
			return false
		} else {
			if (res.locals.flashMessage.key == key) {
				return res.locals.flashMessage
			} else {
				return false
			}
		}
	}

	res.locals.getOld = (key: string) => {
		if (res.locals.old) {
			return res.locals.old[key]
		}
	}

	res.locals.fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl
	res.locals.queryParams = req.query

	res.locals.auth = req.user as User

	// Provide date helpers with user-specific timezone (default UTC)
	const userTz = (req.user as User)?.timezone || 'UTC'
	res.locals.userTimezone = userTz
	res.locals.formatDate = (date: string | Date | number, format = 'YYYY-MM-DD HH:mm:ss') => {
		if (!date) return ''
		return dayjs.utc(date).tz(userTz).format(format)
	}
	res.locals.now = (format = 'YYYY-MM-DD HH:mm:ss') => dayjs.utc().tz(userTz).format(format)

	const setting = await getSetting() // cached (TTL 60s) — bukan query tiap request
	res.locals.setting = setting

	// Tema aktif (template switcher) — tersedia di semua view via res.locals
	res.locals.themeName = setting?.theme || DEFAULT_THEME
	res.locals.theme = getTheme(setting?.theme)
	res.locals.themes = THEMES // seluruh palet untuk UI switcher

	// Template frontend (landing) aktif. Katalog (paginated) di-inject oleh
	// SettingController.index — bukan di sini agar tak fetch tiap request.
	res.locals.feTemplate = setting?.fe_template || DEFAULT_FE_TEMPLATE

	res.locals.addOrUpdateQueryParam = (fullUrl: string | URL, key: string, value: string) => {
		const parsedUrl = new URL(fullUrl)
		parsedUrl.searchParams.set(key, value)
		return parsedUrl.toString()
	}

	res.locals.getFile = (fileName: string) => {
		return fileService.getFile(fileName)
	}

	res.locals.hasAccess = (name: string, method: string) => {
		const user = req.user as User
		const admin = user?.roles.some((role: { name: string }) =>
			role.name === 'Administrator'
		)
		if (admin) return true
		const found = user?.roles.some((role: { permissions: { name: string, method: string }[] }) =>
            role.permissions.some((permission: { name: string, method: string }) =>
                permission.name === name && permission.method === method
            )
        )
		return (typeof found == undefined) ? false:found
	}

	res.locals.hasRole = (roleName: string) => {
		const user = req.user as User
    const found = user?.roles.some((role: { name: string }) =>
            role.name === roleName
        )
		return (typeof found == undefined) ? false:found
	}

	next()
}
