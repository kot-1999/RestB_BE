// @ts-nocheck

import { BookingStatus } from '@prisma/client';
import dayjs from 'dayjs';
import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'

export class BookingController extends AbstractController {
    public static readonly schemas = {
        request: {
            getBookingDetails: JoiCommon.object.request.keys({
                params: Joi.object({
                    restaurantID: JoiCommon.string.id
                }).required(),
                query: Joi.object({
                    status: Joi.string().valid(...Object.values(BookingStatus))
                        .default([BookingStatus.Confirmed, BookingStatus.Pending]),
                    dateFrom: Joi.date().iso()
                        .default(() => dayjs().toISOString()),

                    dateTo: Joi.date()
                        .iso()
                        .greater(Joi.ref('dateFrom'))
                        .default(() => dayjs().add(7, 'days')
                            .toISOString())
                }).required()
            }).required(),

            getBookingList: JoiCommon.object.request.keys({
                query: Joi.object({
                    brandID: JoiCommon.string.id.optional(),
                    statuses: Joi.array()
                        .items(Joi.string()
                            .valid(...Object.values(BookingStatus))
                            .required())
                        .default([]),

                    page: Joi.number()
                        .integer()
                        .positive()
                        .default(1),

                    limit: Joi.number()
                        .integer()
                        .positive()
                        .default(20)
                }).required()
            }).required(),

            updateBooking: JoiCommon.object.request.keys({
                params: Joi.object({
                    bookingID: JoiCommon.string.id
                }).required(),

                body: Joi.object({
                    status: Joi.string()
                        .valid(...Object.values(BookingStatus))
                        .required(),

                    discussion: JoiCommon.object.discussionItem.keys({
                        createdAt: Joi.forbidden()
                    }).optional()
                }).required()
            })
        },
        response: {
            getBookingDetails: Joi.object({
                restaurant: Joi.object({
                    id: JoiCommon.string.id,
                    name: JoiCommon.string.companyName.required(),
                    bannerURL: Joi.string().uri()
                        .required(),
                    address: JoiCommon.object.address.required(),
                    brand: JoiCommon.object.brand.required(),
                    staff: Joi.array()
                        .items({
                            
                        })
                        .min(0)
                        .required()
                }).required(),
                bookings: Joi.array()
                    .items(JoiCommon.object.booking.keys({
                        discussion: Joi.array().items(JoiCommon.object.discussionItem.keys({
                            avatarURL: Joi.string().required()
                        }))
                            .min(0)
                            .required(),
                        user: Joi.object({
                            id: JoiCommon.string.id,
                            firstName: JoiCommon.string.name.required(),
                            lastName: JoiCommon.string.name.required(),
                            email: JoiCommon.string.email.required()
                        }).required(),
                        createdAt: Joi.date().iso()
                            .required(),
                        updatedAt: Joi.date().iso()
                            .allow(null)
                            .required()
                    }).required())
                    .min(0)
                    .required()
            }).required(),

            getBookingList: Joi.object({
                brand: JoiCommon.object.brand.required(),

                restaurants: Joi.array()
                    .items(Joi.object({
                        id: JoiCommon.string.id,
                        name: JoiCommon.string.companyName.required(),
                        bannerURL: Joi.string().uri()
                            .required(),
                        address: JoiCommon.object.address.required(),
                        bookingsDailySummaries: Joi.array().items(JoiCommon.object.bookingDailySummary.required())
                            .min(0)
                            .required()
                    }).required())
                    .min(0)
                    .required(),

                pagination: JoiCommon.object.pagination.required()
            }).required(),
            updateBooking: Joi.object({
                booking: Joi.object({
                    id: JoiCommon.string.id
                }),
                message: Joi.string().required()
            }).required()
        }
    }

    constructor() {
        super()
    }

    private GetBookingDetailsReqType: Joi.extractType<typeof BookingController.schemas.request.getBookingDetails>
    private GetBookingDetailsResType: Joi.extractType<typeof BookingController.schemas.response.getBookingDetails>
    public async getBookingDetails(
        req: AuthAdminRequest & typeof this.GetBookingDetailsReqType,
        res: Response<typeof this.GetBookingDetailsResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({ message: 'Response from a backend template' })
        } catch (err) {
            return next(err)
        }
    }

    private GetBookingListReqType: Joi.extractType<typeof BookingController.schemas.request.getBookingList>
    private GetBookingListResType: Joi.extractType<typeof BookingController.schemas.response.getBookingList>
    public async getBookingList(
        req: AuthAdminRequest & typeof this.GetBookingListReqType,
        res: Response<typeof this.GetBookingListResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({ message: 'Response from a backend template' })
        } catch (err) {
            return next(err)
        }
    }

    private UpdateBookingReqType: Joi.extractType<typeof BookingController.schemas.request.updateBooking>
    private UpdateBookingResType: Joi.extractType<typeof BookingController.schemas.response.updateBooking>
    public async updateBooking(
        req: AuthAdminRequest & typeof this.UpdateBookingReqType,
        res: Response<typeof this.UpdateBookingResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({ message: 'Response from a backend template' })
        } catch (err) {
            return next(err)
        }
    }
}