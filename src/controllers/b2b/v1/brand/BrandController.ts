import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../../../types/AbstractController'
import { JoiCommon } from '../../../../types/JoiCommon'

export class BrandController extends AbstractController {
    public static readonly schemas = {
        request: {
            updateBrand: JoiCommon.object.request.keys({
                params: Joi.object({
                    brandID: JoiCommon.string.id
                }).required(),

                body: Joi.object({
                    name: JoiCommon.string.name.optional(),

                    logoURL: Joi.string()
                        .allow(null, undefined)
                        .optional()
                })
                    .min(1) // at least one field must be updated
                    .required()
            })
        },
        response: {
            updateBrand: Joi.object({
                brand: Joi.object({
                    id: JoiCommon.string.id
                }).required(),
                message: Joi.string().required()
            }).required()
        }
    }

    constructor() {
        super()
    }

    private UpdateBrandReqType: Joi.extractType<typeof BrandController.schemas.request.updateBrand>
    private UpdateBrandResType: Joi.extractType<typeof BrandController.schemas.response.updateBrand>
    public async updateBrand(
        req: AuthAdminRequest & typeof this.UpdateBrandReqType,
        res: Response<typeof this.UpdateBrandResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({
                brand: { id: 'asd' },
                message: 'Brand was successfully updated'
            })
        } catch (err) {
            return next(err)
        }
    }
}