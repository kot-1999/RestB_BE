import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../../../types/AbstractController'
import { JoiCommon } from '../../../../types/JoiCommon'

export class DashboardController extends AbstractController {
    public static readonly schemas = {
        request: {
            getDashboard: JoiCommon.object.request.keys({})
        },
        response: {
            getDashboard: Joi.object({

            })
        }
    }

    constructor() {
        super()
    }

    private GetDashboardReqType: Joi.extractType<typeof DashboardController.schemas.request.getDashboard>
    private GetDashboardResType: Joi.extractType<typeof DashboardController.schemas.response.getDashboard>
    async getDashboard(
        req: AuthAdminRequest & typeof this.GetDashboardReqType,
        res: Response<typeof this.GetDashboardResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({ message: 'Response from a backend template' })
        } catch (err) {
            return next(err)
        }
    }
}