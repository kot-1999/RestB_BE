// @ts-nocheck

import dayjs from 'dayjs';
import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'

export class DashboardController extends AbstractController {
    public static readonly schemas = {
        request: {
            getDashboard: JoiCommon.object.request.keys({
                query: Joi.object({
                    timeFrom: Joi.date()
                        .iso()
                        .default(() => dayjs().toISOString()),

                    timeTo: Joi.date()
                        .iso()
                        .greater(Joi.ref('timeFrom'))
                        .default(() => dayjs().add(7, 'days')
                            .toISOString())
                }).required()
            })
        },
        response: {
            getDashboard: Joi.object({
                brand: JoiCommon.object.brand.required(),
                data: Joi.array()
                    .items(Joi.object({
                        restaurant: Joi.object({
                            id: JoiCommon.string.id,
                            name: JoiCommon.string.name.required()
                        }).required(),

                        summaries: Joi.array()
                            .items(JoiCommon.object.bookingDailySummary.required())
                            .min(1)
                            .required()
                    }).required())
                    .min(1)
                    .required(),

                range: Joi.object({
                    timeFrom: Joi.date().iso()
                        .required(),
                    timeTo: Joi.date().iso()
                        .required()
                }).required()
            }).required()
        }
    }

    constructor() {
        super()
    }

    private GetDashboardReqType: Joi.extractType<typeof DashboardController.schemas.request.getDashboard>
    private GetDashboardResType: Joi.extractType<typeof DashboardController.schemas.response.getDashboard>
    public async getDashboard(
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