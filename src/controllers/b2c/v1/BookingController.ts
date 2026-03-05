import { Admin, Booking, BookingStatus, Restaurant, User } from '@prisma/client';
import dayjs from 'dayjs';
import { Response, NextFunction, AuthUserRequest } from 'express'
import Joi from 'joi'

import prisma from '../../../services/Prisma';
import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'
import { AuthorType } from '../../../utils/enums';
import { IError } from '../../../utils/IError';

const allowedStatuses: BookingStatus[]
    = [BookingStatus.Approved, BookingStatus.Pending, BookingStatus.NoShow, BookingStatus.Completed, BookingStatus.Cancelled]

export class BookingController extends AbstractController {
    public static readonly schemas = {
        request: {
            getBookingList: JoiCommon.object.request.keys({
                query: Joi.object({
                    dateFrom: Joi.date().iso()
                        .default(dayjs().toISOString()),

                    dateTo: Joi.date()
                        .iso()
                        .min(Joi.ref('dateFrom'))
                        .default(dayjs().add(7, 'days')
                            .toISOString()),

                    statuses: Joi.array()
                        .items(Joi.string().valid(...allowedStatuses as BookingStatus[]))
                        .default(() => allowedStatuses),

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
                        .min('now')
                        .required(),
                    message: Joi.string().trim()
                        .min(5)
                        .optional()
                }).required()
            })
        },
        response: {
            getBookingList: Joi.object({
                bookings: Joi.array().items(JoiCommon.object.booking.keys({
                    discussion: Joi.array().items(JoiCommon.object.discussionItem.keys({
                        firstName: JoiCommon.string.name.required(),
                        lastName: JoiCommon.string.name.required(),
                        avatarURL: Joi.string().uri()
                    })),
                    restaurant: Joi.object({
                        id: JoiCommon.string.id,
                        name: JoiCommon.string.companyName.required(),
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
            const { query, user } = req

            const timeFrom = dayjs(query.dateFrom).startOf('day')
                .toDate()

            const timeTo = dayjs(query.dateTo).endOf('day')
                .toDate()

            const skip = (query.page - 1) * query.limit;

            const bookings = await prisma.booking.findMany({
                skip,
                take: query.limit,
                where: {
                    AND: [
                        {
                            status: {
                                in: query.statuses
                            }
                        },
                        {
                            userID: user.id
                        },
                        {
                            bookingTime: {
                                gte: timeFrom,
                                lt: timeTo
                            }
                        }
                    ]
                },
                orderBy: {
                    bookingTime: 'asc' // optional
                },
                select: {
                    id: true,
                    guestsNumber: true,
                    bookingTime: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    discussion: true,
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            bannerURL: true,
                            brand: {
                                select: {
                                    id: true,
                                    name: true,
                                    logoURL: true
                                }
                            }
                        }
                    }
                }
            })

            const adminIDs: string[] = []

            for (let i = 0; i < bookings.length; i++) {
                if (bookings[i].discussion) {
                    bookings[i].discussion.forEach((discussion: { authorID: string, authorType: string}) => {
                        if (discussion.authorType === AuthorType.Admin) {
                            adminIDs.push(discussion.authorID)
                        }
                    })
                }
            }
            const admins: Admin[] = await prisma.admin.findMany({
                where: {
                    id: {
                        in: adminIDs
                    }
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarURL: true
                }
            })
            return res.status(200).json({
                bookings: bookings.map((booking: Booking & { restaurant: Restaurant}) => ({
                    id: booking.id,
                    guestsNumber: booking.guestsNumber,
                    bookingTime: booking.bookingTime,
                    status: booking.status,
                    createdAt: booking.createdAt,
                    updatedAt: booking.updatedAt,
                    discussion: booking.discussion ? (booking.discussion as any[]).map((discussion) => {
                        let author: Partial<Admin> | Partial<User> = user

                        if (discussion.authorType === AuthorType.Admin) {
                            const resultAdmin = admins.find((admin) => admin.id === discussion.authorID)
                            if (resultAdmin) {
                                author = resultAdmin
                            } else {
                                author = {
                                    firstName: 'Unknown',
                                    lastName: 'Administrator'
                                }
                            }
                        }

                        return {
                            authorID: discussion.authorID,
                            authorType: discussion.authorType,
                            message: discussion.message,
                            createAt: discussion.createAt,
                            firstName: author.firstName,
                            lastName: author.lastName,
                            avatarUrl: author?.avatarURL
                        }
                    }) : [],
                    restaurant: booking.restaurant
                }))
            })
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
            const { user, body } = req

            // Check if restaurant exists

            const [restaurant, bookingSum] = await Promise.all([
                prisma.restaurant.findByID(body.restaurantID, {
                    id: true,
                    timeFrom: true,
                    timeTo: true,
                    autoApprovedBookingsNum: true
                }) as Promise<Restaurant>,
                prisma.booking.groupBy({
                    by: ['restaurantID'],
                    _sum: { guestsNumber: true },
                    where: {
                        restaurantID: body.restaurantID,
                        status: {
                            in: [BookingStatus.Approved, BookingStatus.Completed]
                        },
                        bookingTime: {
                            gte: dayjs(body.bookingTime).startOf('day')
                                .toDate(),
                            lt: dayjs(body.bookingTime).endOf('day')
                                .toDate()
                        }
                    }
                })
            ])

            if (!restaurant) {
                throw new IError(404, 'Restaurant not found')
            }

            // Check if restaurant accepts booking at given time
            const bookingHHmm = dayjs(body.bookingTime).format('HH:mm')
            const { timeFrom, timeTo } = restaurant
            const inRange = timeFrom <= timeTo
                ? bookingHHmm >= timeFrom && bookingHHmm <= timeTo
                : bookingHHmm >= timeFrom || bookingHHmm <= timeTo

            if (!inRange) {
                throw new IError(400, `Booking must be between ${timeFrom} and ${timeTo}`)
            }

            const peopleTotallyBooked: number = bookingSum[0]?._sum.guestsNumber ?? 0
            const isAutoApproved = (restaurant.autoApprovedBookingsNum - (peopleTotallyBooked + body.guestsNumber)) >= 0

            const booking = await prisma.booking.createOne({
                guestsNumber: body.guestsNumber,
                bookingTime: body.bookingTime,
                status: isAutoApproved ?  BookingStatus.Approved : BookingStatus.Pending,
                discussion: body.message ? [{
                    authorID: user.id,
                    authorType: AuthorType.User,
                    message: body.message,


                    createdAt: dayjs().toISOString()
                }] : [],
                userID: user.id,
                restaurantID: body.restaurantID
            })

            return res.status(200).json({
                booking: {
                    id: booking.id
                },
                message: 'Response from a backend template'
            })
        } catch (err) {
            return next(err)
        }
    }
}