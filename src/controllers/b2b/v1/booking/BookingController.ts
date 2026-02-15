import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../../../types/AbstractController'
import { JoiCommon } from '../../../../types/JoiCommon'

export class BookingController extends AbstractController {
    public static readonly schemas = {
        request: {
            getBooking: JoiCommon.object.request.keys({})
        },
        response: {
            getBooking: Joi.object({

            })
        }
    }

    constructor() {
        super()
    }

    private GetBookingReqType: Joi.extractType<typeof BookingController.schemas.request.getBooking>
    private GetBookingResType: Joi.extractType<typeof BookingController.schemas.response.getBooking>
    async getBooking(
        req: AuthAdminRequest & typeof this.GetBookingReqType,
        res: Response<typeof this.GetBookingResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({ message: 'Response from a backend template' })
        } catch (err) {
            return next(err)
        }
    }
}