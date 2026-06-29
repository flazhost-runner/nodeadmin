import { Request, Response, NextFunction } from 'express';
import Joi, { ObjectSchema } from 'joi';
import multer, { FileFilterCallback } from 'multer';
import app from '../../../../config/app';
import { ResponseHandler } from '@flazhost-nodeadmin/core';

const fileSchema = Joi.object({
    fieldname: Joi.string().optional(),
    encoding: Joi.string().optional(),
    buffer: Joi.optional(),
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid('image/jpeg', 'image/jpg', 'image/png', 'image/webp').required(),
    size: Joi.number().max(app.max_photo_size).required() // Maksimum ukuran file 2MB
});

const userSchema: ObjectSchema = Joi.object({
    code: Joi.string().required(),
    name: Joi.string().required(),
    phone: Joi.string().optional(),
    email: Joi.string().email().required(),
    roles: Joi.array().required(),
    status: Joi.string().required(),
    blocked: Joi.optional(),
    blocked_reason: Joi.when('blocked', {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    timezone: Joi.string().optional(),
    password: Joi.string().min(8).required(),
    password_confirmation: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Password & confirm password not match.'
    }),
});

const UserCreateValidator = (req: Request, res: Response, next: NextFunction): void => {
    const files: { [fieldname: string]: Express.Multer.File[] } = req.files as { [fieldname: string]: Express.Multer.File[] };
    let fileArray: Express.Multer.File[] = []
    if (files !== undefined && files !== null) {
        fileArray = Object.values(files).flat();
    }
    let errorTotal: any[] = []

    if (typeof files == 'undefined') {
        delete req.body.picture
    }

    const { error, value } = userSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        const errors = error.details.map(detail => ({
            path: detail.context?.key,
            msg: detail.message,
        }));
        errorTotal = errors
    } else {
        // Cegah mass-assignment: hanya field tervalidasi yang diteruskan ke service
        req.body = value
    }

    if (typeof files != 'undefined') {
        if (fileArray.length > 0) {
            fileArray.map(file => {
                const errorImage  = fileSchema.validate(file, { abortEarly: false }).error;
                if (errorImage) {
                    const errorsImage = errorImage.details.map(detail => ({
                        path: file.fieldname,
                        msg: detail.message,
                    }));
                    errorTotal = errorTotal.concat(errorsImage)
                }
            })
        }
    }

    if (req.url.includes('/api/')) {
        if (errorTotal.length > 0) {
            return ResponseHandler.validationError(res, errorTotal)
        }
    } else {
        if (errorTotal.length > 0) {
            req.session.errors = errorTotal
            req.session.old = req.body
            return res.redirect(req.get('Referrer') || '/')
        }
    }

    next();
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('File harus berupa gambar'));
        }
    }
});

export { upload, UserCreateValidator };
