import { Request, Response, NextFunction } from 'express'
import Joi, { ObjectSchema } from 'joi'
import { ResponseHandler } from '@flazhost-nodeadmin/core'

// Reuse the same multer upload config from user update validator
export { upload } from '../../../access/http/validators/UserUpdateValidator'

const fileSchema = Joi.object({
  fieldname: Joi.string().optional(),
  encoding: Joi.string().optional(),
  buffer: Joi.optional(),
  originalname: Joi.string().required(),
  mimetype: Joi.string().valid('image/jpeg', 'image/jpg', 'image/png', 'image/webp').required(),
  size: Joi.number().max(2 * 1024 * 1024).required() // Max 2MB (aligned with app.max_photo_size usage)
})

const profileSchema: ObjectSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  phone: Joi.string().optional().allow(''),
  email: Joi.string().email().required(),
  status: Joi.string().required(),
  timezone: Joi.string().optional(),
  password: Joi.string().min(8).optional().allow(''),
  password_confirmation: Joi.string().valid(Joi.ref('password')).optional().allow('').messages({
    'any.only': 'Password & confirm password not match.'
  }),
})

export const ProfileUpdateValidator = (req: Request, res: Response, next: NextFunction): void => {
  const filesRaw = req.files as any
  const fileArray: Express.Multer.File[] = Array.isArray(filesRaw)
    ? (filesRaw as Express.Multer.File[])
    : filesRaw && typeof filesRaw === 'object'
      ? (Object.values(filesRaw).flat() as Express.Multer.File[])
      : []

  let errorTotal: any[] = []

  if (!fileArray || fileArray.length === 0) {
    delete (req.body as any).picture
  }

  const { error, value } = profileSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
  if (error) {
    const errors = error.details.map(detail => ({
      path: detail.context?.key,
      msg: detail.message,
    }))
    errorTotal = errors
  } else {
    req.body = value
  }

  if (fileArray.length > 0) {
    fileArray.map(file => {
      const errorImage = fileSchema.validate(file, { abortEarly: false }).error
      if (errorImage) {
        const errorsImage = errorImage.details.map(detail => ({
          path: file.fieldname,
          msg: detail.message,
        }))
        errorTotal = errorTotal.concat(errorsImage)
      }
    })
  }

  if (req.url.includes('/api/')) {
    if (errorTotal.length > 0) {
      req.session.errors = errorTotal
      req.session.old = req.body
      return ResponseHandler.validationError(res, errorTotal)
    }
  } else {
    if (errorTotal.length > 0) {
      req.session.errors = errorTotal
      req.session.old = req.body
      return res.redirect(req.get('Referrer') || '/')
    }
  }

  next()
}

