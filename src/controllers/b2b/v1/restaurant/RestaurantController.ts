import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../../../types/AbstractController'
import { JoiCommon } from '../../../../types/JoiCommon'

export class RestaurantController extends AbstractController {
    public static readonly schemas = {
        request: {
            getRestaurant: JoiCommon.object.request.keys({})
        },
        response: {
            getRestaurant: Joi.object({

            })
        }
    }

    constructor() {
        super()
    }

    private GetRestaurantReqType: Joi.extractType<typeof RestaurantController.schemas.request.getRestaurant>
    private GetRestaurantResType: Joi.extractType<typeof RestaurantController.schemas.response.getRestaurant>
    async getRestaurant(
        req: AuthAdminRequest & typeof this.GetRestaurantReqType,
        res: Response<typeof this.GetRestaurantResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({ message: 'Response from a backend template' })
        } catch (err) {
            return next(err)
        }
    }
}