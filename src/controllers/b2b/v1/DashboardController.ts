import { AdminRole, BookingStatus, Restaurant } from '@prisma/client';
import dayjs from 'dayjs';
import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import prisma from '../../../services/Prisma';
import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'
import { IError } from '../../../utils/IError';

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
                        id: JoiCommon.string.id,
                        name: JoiCommon.string.companyName.required(),
                        bannerURL: Joi.string().uri(),
                        summaries: Joi.array()
                            .items(Joi.object({
                                date: Joi.date().iso()
                                    .required(),

                                totalApprovedAndConfirmedBookings: Joi.number()
                                    .integer()
                                    .min(0)
                                    .required(),

                                totalPendingBookings: Joi.number()
                                    .integer()
                                    .min(0)
                                    .required(),

                                totalCanceledBookings: Joi.number()
                                    .integer()
                                    .min(0)
                                    .required(),

                                totalApprovedAndConfirmedGuests: Joi.number()
                                    .integer()
                                    .min(0)
                                    .required(),

                                totalPendingGuests: Joi.number()
                                    .integer()
                                    .min(0)
                                    .required(),

                                totalCanceledGuests: Joi.number()
                                    .integer()
                                    .min(0)
                                    .required()
                            }))
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
            const { user, query } = req
            const restaurantIDs = []

            if (user.role === AdminRole.Admin) {
                const restaurants: Restaurant[] = await prisma.restaurant.findMany({
                    where: {
                        brandID: user.brandID
                    },
                    select: {
                        id: true
                    }
                })

                restaurants.forEach((restaurant) => restaurantIDs.push(restaurant.id))
            } else {
                const staff = await prisma.restaurantStaff.findFirst({
                    where: {
                        adminID: user.id
                    }
                })

                if (!staff) {
                    throw new IError(404, 'Staff not found')
                }

                restaurantIDs.push(staff.restaurantID)
            }

            const [brand, bookingStats, restaurants] = await Promise.all([
                prisma.brand.findByID(user.brandID, {
                    id: true,
                    name: true,
                    logoURL: true
                }),
                prisma.dashboard.getBookingStats(
                    restaurantIDs,
                    query.timeFrom,
                    query.timeTo
                ) as Promise<{
                    restaurantID: string,
                    date: string,
                    status: BookingStatus,
                    count: number,
                    totalGuests: number
                }[]>,
                prisma.restaurant.findMany({
                    select: {
                        id: true,
                        name: true,
                        bannerURL: true
                    },
                    where: {
                        id: {
                            in: restaurantIDs
                        }
                    }
                }) as Promise<{ id: string, name: string, bannerURL: string}[]>
            ])

            return res.status(200).json({
                range: {
                    timeFrom: query.timeFrom as Date,
                    timeTo: query.timeTo as Date
                },
                brand,
                data: restaurants.map((restaurant) => {
                    const restaurantStats = bookingStats
                        .filter((stat) => stat.restaurantID === restaurant.id)

                    const summariesMap = restaurantStats.reduce((acc: any, stat) => {
                        const date = stat.date

                        if (!acc[date]) {
                            acc[date] = {
                                date,
                                totalApprovedAndConfirmedBookings: 0,
                                totalPendingBookings: 0,
                                totalCanceledBookings: 0,
                                totalApprovedAndConfirmedGuests: 0,
                                totalPendingGuests: 0,
                                totalCanceledGuests: 0
                            }
                        }

                        const guests = Number(stat.totalGuests)
                        const count = Number(stat.count)

                        if (stat.status === BookingStatus.Approved || stat.status === BookingStatus.Completed) {
                            acc[date].totalApprovedAndConfirmedBookings += count
                            acc[date].totalApprovedAndConfirmedGuests += guests
                        }

                        if (stat.status === BookingStatus.Pending) {
                            acc[date].totalPendingBookings += count
                            acc[date].totalPendingGuests += guests
                        }

                        if (stat.status === BookingStatus.Cancelled) {
                            acc[date].totalCanceledBookings += count
                            acc[date].totalCanceledGuests += guests
                        }

                        return acc
                    }, {})

                    const summaries: {
                        date: Date,
                        totalApprovedAndConfirmedBookings: number,
                        totalPendingBookings: number,
                        totalCanceledBookings: number,
                        totalApprovedAndConfirmedGuests: number,
                        totalPendingGuests: number,
                        totalCanceledGuests: number
                    }[] = Object.values(summariesMap)

                    return {
                        ...restaurant,
                        summaries
                    }
                })
            })
        } catch (err) {
            return next(err)
        }
    }
}