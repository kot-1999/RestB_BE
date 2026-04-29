import { Admin, AdminRole, Booking, BookingStatus, Restaurant, User } from '@prisma/client';
import dayjs from 'dayjs';
import { AuthAdminRequest, NextFunction, Response } from 'express'
import Joi from 'joi'

import emailService from '../../../services/Email';
import prisma from '../../../services/Prisma';
import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'
import { AuthorType, EmailType } from '../../../utils/enums';
import { IError } from '../../../utils/IError';

export class BookingController extends AbstractController {
    public static readonly schemas = {
        request: {
            getBookingDetails: JoiCommon.object.request.keys({
                params: Joi.object({
                    restaurantID: JoiCommon.string.id
                }).required(),
                query: Joi.object({
                    statuses: Joi.array().items(Joi.string().valid(...Object.values(BookingStatus)))
                        .default([BookingStatus.Completed, BookingStatus.Pending]),
                    dateFrom: Joi.date().iso()
                        .default(() => dayjs().toISOString()),

                    dateTo: Joi.date()
                        .iso()
                        .greater(Joi.ref('dateFrom'))
                        .default(() => dayjs().add(4, 'days')
                            .toISOString()),
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
                    status: Joi.string().valid(...Object.values(BookingStatus)),

                    message: Joi.string()
                        .trim()
                        .min(5)
                        .allow(null)
                }).or('status', 'message')
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
                            admin: Joi.object({
                                id: JoiCommon.string.id,
                                firstName: JoiCommon.string.name.required(),
                                lastName: JoiCommon.string.name.required(),
                                email: JoiCommon.string.email.required(),
                                avatarURL: Joi.string().uri()
                            })
                        })
                        .min(0)
                        .required()
                }).required(),
                bookings: Joi.array()
                    .items(JoiCommon.object.booking.keys({
                        discussion: Joi.array().items(JoiCommon.object.discussionItem.keys({
                            firstName: JoiCommon.string.name.required(),
                            lastName: JoiCommon.string.name.required(),
                            avatarURL: Joi.string().uri()
                        }))
                            .min(0)
                            .required(),
                        user: Joi.object({
                            id: JoiCommon.string.id,
                            firstName: JoiCommon.string.name.required(),
                            lastName: JoiCommon.string.name.required(),
                            email: JoiCommon.string.email.required(),
                            avatarURL: Joi.string().uri()
                        }).required(),
                        createdAt: Joi.date().iso()
                            .required(),
                        updatedAt: Joi.date().iso()
                            .allow(null)
                            .required()
                    }).required())
                    .min(0)
                    .required(),
                pagination: JoiCommon.object.pagination.required()
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
                booking: JoiCommon.object.booking.keys({
                    discussion: Joi.array().items(JoiCommon.object.discussionItem.keys({
                        firstName: JoiCommon.string.name.required(),
                        lastName: JoiCommon.string.name.required(),
                        avatarURL: Joi.string().uri()
                    }))
                        .min(0)
                        .required(),
                    user: Joi.object({
                        id: JoiCommon.string.id,
                        firstName: JoiCommon.string.name.required(),
                        lastName: JoiCommon.string.name.required(),
                        email: JoiCommon.string.email.required(),
                        avatarURL: Joi.string().uri()
                    }).required(),
                    createdAt: Joi.date().iso()
                        .required(),
                    updatedAt: Joi.date().iso()
                        .allow(null)
                        .required()
                }).required(),
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
            const { params, query, user } = req
            const skip = (query.page - 1) * query.limit;

            const timeFrom = dayjs(query.dateFrom).startOf('day')
                .toDate()
            const timeTo = dayjs(query.dateTo).endOf('day')
                .toDate()

            const where = {
                AND: [
                    {
                        restaurantID: params.restaurantID
                    },
                    {
                        status: {
                            in: query.statuses
                        }
                    },
                    {
                        bookingTime: {
                            gte: timeFrom,
                            lt: timeTo
                        }
                    }
                ]
            }

            const [restaurant, count, bookings] = await Promise.all([
                prisma.restaurant.findByID(params.restaurantID, {
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
                    },
                    brand: {
                        select: {
                            id: true,
                            name: true,
                            logoURL: true
                        }
                    },
                    staff: {
                        select: {
                            admin: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    avatarURL: true,
                                    phone: true
                                }
                            }
                        }
                    }
                }),
                prisma.booking.count({
                    where
                }),
                prisma.booking.findMany({
                    skip,
                    take: query.limit,
                    where,
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
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatarURL: true,
                                phone: true
                            }
                        }
                    }
                })
            ])

            if (!restaurant) {
                throw new IError(404, 'Restaurant not found');
            }

            if (user.role !== AdminRole.Admin) {
                const staffMember = restaurant.staff.find((staff: { admin: { id: string }}) => staff.admin.id === user.id)
                if (!staffMember) {
                    throw new IError(403, 'Employee has no permission to view this restaurant');
                }
            }

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
                restaurant,
                bookings: bookings.map((booking: Booking & { user: User }) => ({
                    id: booking.id,
                    guestsNumber: booking.guestsNumber,
                    bookingTime: booking.bookingTime,
                    status: booking.status,
                    createdAt: booking.createdAt,
                    updatedAt: booking.updatedAt,
                    user: booking.user,
                    discussion: booking.discussion ? (booking.discussion as any[]).map((discussion) => {
                        let author: Partial<Admin> | Partial<User> = booking.user
                        
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
                    }) : []
                })),
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

            let where = {}

            if (user.role === AdminRole.Admin) {
                where = { brandID: user.brandID }
            } else {
                const restaurantStaff = await prisma.restaurantStaff.findFirst({
                    where: {
                        AND: [{ adminID: user.id }, { deletedAt: null }]
                    }
                })

                if (restaurantStaff) {
                    where = {
                        AND: [{ id: restaurantStaff.restaurantID }, { deletedAt: null }]
                    }
                }
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
            const { user, params, body } = req

            const booking = await prisma.booking.findByID(params.bookingID, {
                id: true,
                discussion: true,
                status: true,
                bookingTime: true,
                guestsNumber: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        brandID: true
                    }
                }
            })

            if (!booking) {
                throw new IError(404, 'Booking not found')
            }

            const nonUpgradableStates = [BookingStatus.NoShow, BookingStatus.Cancelled, BookingStatus.Completed, BookingStatus.Deleted]
            const pendingUpdate: BookingStatus[] = [BookingStatus.Approved, BookingStatus.Cancelled]
            const approvedUpdate: BookingStatus[] = [BookingStatus.NoShow, BookingStatus.Cancelled, BookingStatus.Completed]
            const afterBooking: BookingStatus[] = [BookingStatus.Completed, BookingStatus.NoShow]
            const isAdmin: boolean = !!user.role
            const isAfter = dayjs().isAfter(booking.bookingTime)

            if (isAdmin && user.brandID !== booking.restaurant.brandID) {
                throw new IError(403, 'User not authorized')
            }

            if (body.status && body.status !== booking.status) {
                if (nonUpgradableStates.includes(booking.status)) {
                    throw new IError(403, `Booking can not be updated from ${booking.status} status to ${body.status}`)
                }

                // Handle PENDING state
                if (isAfter) {
                    throw new IError(403, 'Pending booking can not be updated after booking time')
                }

                if (booking.status === BookingStatus.Pending && !pendingUpdate.includes(body.status)) {
                    throw new IError(403, `Booking can not be moved from ${BookingStatus.Pending} to ${body.status}`)
                }

                if (booking.status === BookingStatus.Pending && body.status === BookingStatus.Approved && !isAdmin) {
                    throw new IError(403, 'User can not Approve booking')
                }

                // Handle APPROVED state
                if (booking.status === BookingStatus.Approved && !approvedUpdate.includes(body.status)) {
                    throw new IError(403, `Booking can not be updated from ${booking.status} status to ${body.status}`)
                }

                if (booking.status === BookingStatus.Approved && body.status !== BookingStatus.Cancelled && !isAdmin) {
                    throw new IError(403, `User can not move Approved booking to ${body.status}`)
                }

                if (booking.status === BookingStatus.Approved && body.status === BookingStatus.Cancelled && isAfter) {
                    throw new IError(403, 'Booking can not be canceled after it\'s booking time')
                }

                if (afterBooking.includes(body.status) && !isAfter) {
                    throw new IError(403, `Booking can not be moved to ${body.status} before booking time`)
                }
            }
            const discussion = booking.discussion ?? []

            if (body.message) {
                discussion.push({
                    authorID: user.id,
                    authorType: isAdmin ? AuthorType.Admin : AuthorType.User,
                    message: body.message,
                    createdAt: dayjs().toISOString()
                })
            }

            await prisma.booking.updateOne(booking.id, {
                status: body.status ?? booking.status,
                discussion: discussion
            })

            const emailStatuses: BookingStatus[] = [BookingStatus.Approved, BookingStatus.Cancelled]

            if (body.status && emailStatuses.includes(body.status) && isAdmin) {
                await emailService.sendEmail(EmailType.bookingUpdated, {
                    email: booking.user.email,
                    firstName: booking.user.firstName,
                    lastName: booking.user.email,
                    restaurantName: booking.restaurant.name,
                    bookingDate: booking.bookingTime,
                    guestsNumber: booking.guestsNumber,
                    newStatus: body.status,
                    updatedAt: dayjs().toISOString(),
                    message: body.message ?? undefined
                })
            }

            const resultBooking = await prisma.booking.findByID(booking.id, {
                id: true,
                guestsNumber: true,
                bookingTime: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                discussion: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarURL: true
                    }
                }
            })

            const adminIDs: string[] = []

            if (resultBooking.discussion) {
                resultBooking.discussion.forEach((discussion: { authorID: string, authorType: string}) => {
                    if (discussion.authorType === AuthorType.Admin) {
                        adminIDs.push(discussion.authorID)
                    }
                })
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
                booking: {
                    id: resultBooking.id,
                    guestsNumber: resultBooking.guestsNumber,
                    bookingTime: resultBooking.bookingTime,
                    status: resultBooking.status,
                    createdAt: resultBooking.createdAt,
                    updatedAt: resultBooking.updatedAt,
                    user: resultBooking.user,
                    discussion: resultBooking.discussion ? (resultBooking.discussion as any[]).map((discussion) => {
                        let author: Partial<Admin> | Partial<User> = resultBooking.user

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
                    }) as any[] : []
                },
                message: body.status ? `Booking was moved to ${body.status} state` : 'Message was sent'
            })
        } catch (err) {
            return next(err)
        }
    }
}