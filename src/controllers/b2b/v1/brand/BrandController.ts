import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../../../types/AbstractController'
import { JoiCommon } from '../../../../types/JoiCommon'

export class BrandController extends AbstractController {
    public static readonly schemas = {
        request: {
            getBrand: JoiCommon.object.request.keys({})
        },
        response: {
            getBrand: Joi.object({

            })
        }
    }

    constructor() {
        super()
    }

    private GetBrandReqType: Joi.extractType<typeof BrandController.schemas.request.getBrand>
    private GetBrandResType: Joi.extractType<typeof BrandController.schemas.response.getBrand>
    async getBrand(
        req: AuthAdminRequest & typeof this.GetBrandReqType,
        res: Response<typeof this.GetBrandResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({ message: 'Response from a backend template' })
        } catch (err) {
            return next(err)
        }
    }
}