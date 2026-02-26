import { BookingStatus, Prisma, Restaurant, RestaurantCategories } from '@prisma/client';
import dayjs from 'dayjs';
import {Response, NextFunction, Request} from 'express'
import Joi from 'joi'

import { OpenStreetMapService } from '../../../services/OpenStreetMapService';
import prisma from '../../../services/Prisma';
import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'
import { IError } from '../../../utils/IError';

export class RestaurantController extends AbstractController {
    public static readonly schemas = {
        request: {
            getRestaurant: JoiCommon.object.request.keys({
                params: Joi.object({
                    restaurantID: JoiCommon.string.id
                }).required(),
                query: Joi.object({
                    date: Joi.date().iso()
                        .default(() => dayjs().toISOString())
                }).required()
            }).required(),
            getRestaurantList: JoiCommon.object.request.keys({
                query: Joi.object({
                    search: Joi.string().min(2)
                        .optional(),
                    radius: Joi.number().integer()
                        .min(1)
                        .max(100)
                        .default(20),
                    brandID: JoiCommon.string.id.optional(),
                    date: Joi.date().default(() => dayjs().toISOString()),
                    categories: Joi.array().items(Joi.string().valid(...Object.values(RestaurantCategories)))
                        .optional(),
                    page: Joi.number().positive()
                        .default(1),
                    limit: Joi.number().positive()
                        .default(20)
                }).required()
            })
        },
        response: {
            getRestaurant: JoiCommon.object.restaurant.keys({
                brand: JoiCommon.object.brand.required(),
                address: JoiCommon.object.address.required(),
                availability: Joi.object({
                    date: Joi.date().iso()
                        .required(),
                    autoConfirmGuestsLimit: Joi.number().integer()
                        .required() // How many more gusts can be confirmed automatically
                }).required()
            }).required(),
            getRestaurantList: Joi.object({
                restaurants: Joi.array().items(JoiCommon.object.restaurant.keys({
                    brand: JoiCommon.object.brand.required(),
                    address: JoiCommon.object.address.required(),
                    availability: Joi.object({
                        date: Joi.date().iso()
                            .required(),
                        autoConfirmGuestsLimit: Joi.number().integer()
                            .required() // How many more gusts can be confirmed automatically
                    }).required()
                }).required())
                    .min(0)
                    .required(),
                pagination: JoiCommon.object.pagination.required()
            }).required()
        }
    }

    constructor() {
        super()
    }

    private GetRestaurantReqType: Joi.extractType<typeof RestaurantController.schemas.request.getRestaurant>
    private GetRestaurantResType: Joi.extractType<typeof RestaurantController.schemas.response.getRestaurant>
    public async getRestaurant(
        req: Request & typeof this.GetRestaurantReqType,
        res: Response<typeof this.GetRestaurantResType>,
        next: NextFunction
    ) {
        try {
            const { params, query } = req

            const [restaurant, booking] = await Promise.all([
                prisma.restaurant.findByID(params.restaurantID, {
                    id: true,
                    name: true,
                    description: true,
                    bannerURL: true,
                    photosURL: true,
                    timeFrom: true,
                    timeTo: true,
                    categories: true,
                    autoApprovedBookingsNum: true,
                    brand: {
                        select: {
                            id: true,
                            name: true,
                            logoURL: true
                        }
                    },
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
                }),
                prisma.booking.aggregate({
                    _sum: {
                        guestsNumber: true
                    },
                    where: {
                        bookingTime: {
                            gte: dayjs(query.date).startOf('day'),
                            lt: dayjs(query.date).endOf('day')
                        },
                        restaurantID: params.restaurantID,
                        status: BookingStatus.Approved
                    }
                })
            ])

            if (!restaurant) {
                throw new IError(404, 'Restaurant was not found')
            }

            return res.status(200).json({
                ...restaurant,
                booking: {
                    autoConfirmGuestsLimit: restaurant.autoApprovedBookingsNum - booking._sum.guestsNumber,
                    date: query.date
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private GetRestaurantListReqType: Joi.extractType<typeof RestaurantController.schemas.request.getRestaurantList>
    private GetRestaurantListResType: Joi.extractType<typeof RestaurantController.schemas.response.getRestaurantList>
    public async getRestaurantList(
        req: Request & typeof this.GetRestaurantListReqType,
        res: Response<typeof this.GetRestaurantListResType>,
        next: NextFunction
    ) {
        try {
            const { query } = req

            const where: { AND: Prisma.RestaurantWhereInput[] } = { AND: [] }
            const skip = (query.page - 1) * query.limit;

            // Geo Search
            if (query.search) {
                const coord = await OpenStreetMapService.search(query.search)

                if (!coord) {
                    throw new IError(404, 'Could not find restaurants in given area')
                }

                const earthRadiusKmPerDegree = 111

                const latDelta = query.radius / earthRadiusKmPerDegree

                const lngDelta
                    = query.radius
                    / (earthRadiusKmPerDegree
                        * Math.cos(Number(coord.lat) * Math.PI / 180))

                where.AND.push({
                    address: {
                        is: {
                            latitude: {
                                gte: Number(coord.lat) - latDelta,
                                lte: Number(coord.lat) + latDelta
                            },
                            longitude: {
                                gte: Number(coord.lon) - lngDelta,
                                lte: Number(coord.lon) + lngDelta
                            }
                        }
                    }
                })
            }

            if (query.brandID) {
                const brand = await prisma.brand.findByID(
                    query.brandID,
                    { id: true }
                )

                if (!brand) {
                    throw new IError(404, "Brand doesn't exist")
                }

                where.AND.push({
                    brandID: query.brandID
                })
            }

            if (query.categories?.length) {
                where.AND.push({
                    AND: query.categories.map((cat) => ({
                        categories: {
                            path: '$[*]',
                            array_contains: cat // or any string value
                        }
                    }))
                })
            }
            const [count, restaurants] = await Promise.all([
                prisma.restaurant.count({
                    where
                }),
                prisma.restaurant.findMany({
                    skip,
                    take: query.limit,
                    where,
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        bannerURL: true,
                        photosURL: true,
                        timeFrom: true,
                        timeTo: true,
                        categories: true,
                        autoApprovedBookingsNum: true,
                        brand: {
                            select: {
                                id: true,
                                name: true,
                                logoURL: true
                            }
                        },
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
                        staff: {
                            select: {
                                adminID: true,
                                admin: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        role: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        name: 'asc' // optional
                    }
                })
            ])

            const bookingSums = await prisma.booking.groupBy({
                by: ['restaurantID'],       // group by restaurant
                _sum: { guestsNumber: true }, // sum guests per restaurant
                where: {
                    restaurantID: { in: restaurants.map((rest: Restaurant) => rest.id) }, // array of restaurant IDs
                    status: BookingStatus.Approved,
                    bookingTime: {
                        gte: dayjs(query.date).startOf('day')
                            .toDate(),
                        lt: dayjs(query.date).endOf('day')
                            .toDate()
                    }
                }
            });

            return res.status(200).json({
                restaurants: restaurants.map((restaurant: any) => {
                    const bookingSum = bookingSums.find((booking: any) => booking.restaurantID === restaurant.id)

                    return {
                        ...restaurant,
                        availability: {
                            autoConfirmGuestsLimit: 
                                bookingSum
                                    ? restaurant.autoConfirmGuestsLimit - bookingSum._sum.guestsNumber 
                                    : restaurant.autoConfirmGuestsLimit,
                            date: query.date
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
}