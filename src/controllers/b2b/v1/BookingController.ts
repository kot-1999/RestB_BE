import { BookingStatus, Restaurant } from '@prisma/client';
import dayjs from 'dayjs';
import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import prisma from '../../../services/Prisma';
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
                        .default([BookingStatus.Completed, BookingStatus.Pending]),
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
            const { query, user } = req
            const skip = (query.page - 1) * query.limit

            const where = {
                brandID: user.brandID
            }

            const [brand, count, restaurants] = await Promise.all([
                prisma.brand.findByID(user.brandID, {
                    id: true,
                    name: true,
                    logoURL: true
                }),
                prisma.restaurant.count({
                    where
                }),
                prisma.restaurant.findMany({
                    skip,
                    take: query.limit,
                    orderBy: {
                        name: 'asc'
                    },
                    where,
                    select: {
                        id: true,
                        name: true,
                        bannerURL: true,
                        address: {
                            select: {
                                building: true,
                                street: true,
                                city: true,
                                postcode: true,
                                country: true,
                                latitude: true,
                                longitude: true
                            }
                        }
                    }
                })
            ])

            const today = dayjs()
            const bookingStats = (await prisma.booking.groupBy({
                by: ['restaurantID', 'status'],
                where: {
                    status: {
                        in: [BookingStatus.Pending, BookingStatus.Approved, BookingStatus.Completed]
                    },
                    restaurantID: { in: restaurants.map((rest: Restaurant) => rest.id) },
                    bookingTime: {
                        gte: today.startOf('day')
                            .toISOString(),
                        lt: today.endOf('day')
                            .toISOString()
                    }
                },
                _count: true,
                _sum: {
                    guestsNumber: true
                }
            })) as {
                _count: number,
                _sum: {
                    guestsNumber: number
                },
                restaurantID: string,
                status: BookingStatus
            }[]

            return res.status(200).json({
                brand,
                restaurants: restaurants.map((restaurant: Restaurant) => {
                    const restaurantStats = bookingStats.filter((bStat) => bStat.restaurantID === restaurant.id)

                    let totalApprovedAndConfirmedBookings = 0
                    let totalPendingBookings = 0
                    let totalGuests = 0

                    restaurantStats.forEach((rStat) => {
                        if (rStat.status === BookingStatus.Pending) {
                            totalPendingBookings += rStat._count
                        } else {
                            totalApprovedAndConfirmedBookings += rStat._count
                            totalGuests += rStat._sum.guestsNumber
                        }
                    })

                    return {
                        ...restaurant,
                        bookingsDailySummaries: {
                            today: today.toISOString(),
                            totalApprovedAndConfirmedBookings,
                            totalPendingBookings,
                            totalGuests
                        }
                    }
                }),
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total: count
                }
            })
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