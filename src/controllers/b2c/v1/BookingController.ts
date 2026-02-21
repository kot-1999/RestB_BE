// @ts-nocheck

import { BookingStatus } from '@prisma/client';
import { Response, NextFunction, AuthUserRequest } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'

export class BookingController extends AbstractController {
    public static readonly schemas = {
        request: {
            getBookingList: JoiCommon.object.request.keys({
                query: Joi.object({
                    dateFrom: Joi.date().iso(),

                    dateTo: Joi.date()
                        .iso()
                        .min(Joi.ref('dateFrom')),

                    statuses: Joi.array().items(Joi.string().valid(...Object.values(BookingStatus))),

                    page: Joi.number()
                        .integer()
                        .min(1)
                        .default(1),

                    limit: Joi.number()
                        .integer()
                        .min(1)
                        .max(100)
                        .default(10)
                }).required()
            }),
            postBooking: JoiCommon.object.request.keys({
                body: Joi.object({
                    restaurantID: JoiCommon.string.id,
                    guestsNumber: Joi.number().min(1)
                        .integer()
                        .required(),
                    bookingTime: Joi.date().iso()
                        .required(),
                    discussion: JoiCommon.object.discussionItem.keys({
                        createdAt: Joi.forbidden()
                    }).optional()
                }).required()
            })
        },
        response: {
            getBookingList: Joi.object({
                bookings: Joi.array().items(JoiCommon.object.booking.keys({
                    restaurant: Joi.object({
                        id: JoiCommon.string.id,
                        name: JoiCommon.string.name.required(),
                        description: Joi.string().min(20)
                            .optional(),
                        bannerURL: Joi.string().uri()
                            .required(),
                        brand: JoiCommon.object.brand.required()
                    }).required(),
                    createdAt: Joi.date().iso()
                        .required(),
                    updatedAt: Joi.date().iso()
                        .allow(null)
                }).required())
                    .required()
            }).required(),
            postBooking: Joi.object({
                booking: Joi.object({
                    id: JoiCommon.string.id
                }).required(),
                message: Joi.string().required()
            })
        }
    }

    constructor() {
        super()
    }

    private GetBookingListReqType: Joi.extractType<typeof BookingController.schemas.request.getBookingList>
    private GetBookingListResType: Joi.extractType<typeof BookingController.schemas.response.getBookingList>
    public async getBookingList(
        req: AuthUserRequest & typeof this.GetBookingListReqType,
        res: Response<typeof this.GetBookingListResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({ message: 'Response from a backend template' })
        } catch (err) {
            return next(err)
        }
    }

    private PostBookingReqType: Joi.extractType<typeof BookingController.schemas.request.postBooking>
    private PostBookingResType: Joi.extractType<typeof BookingController.schemas.response.postBooking>
    public async postBooking(
        req: AuthUserRequest & typeof this.PostBookingReqType,
        res: Response<typeof this.PostBookingResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({
                booking: {
                    id: '123'
                },
                message: 'Response from a backend template' 
            })
        } catch (err) {
            return next(err)
        }
    }
}