import { AdminRole, BookingStatus, Prisma, RestaurantCategories } from '@prisma/client'
import dayjs from 'dayjs'
import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import { OpenStreetMapService } from '../../../services/OpenStreetMapService'
import prisma from '../../../services/Prisma'
import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'
import { IError } from '../../../utils/IError'

export class RestaurantController extends AbstractController {
    public static readonly schemas = {
        request: {
            getRestaurantList: JoiCommon.object.request.keys({
                query: Joi.object({
                    brandID: JoiCommon.string.id.optional(),
                    page: Joi.number().positive()
                        .default(1),
                    limit: Joi.number().positive()
                        .default(20)
                }).required()
            }),
            deleteRestaurant: JoiCommon.object.request.keys({
                params: Joi.object({
                    restaurantID: JoiCommon.string.id
                })
            }),
            putRestaurant: JoiCommon.object.request.keys({
                body: Joi.object({
                    restaurantID: Joi.string().optional(),
                    name: JoiCommon.string.companyName.required(),

                    description: Joi.string()
                        .min(20)
                        .optional(),

                    bannerURL: Joi.string()
                        .uri()
                        .required(),

                    photosURL: Joi.array()
                        .items(Joi.string())
                        .required(),

                    categories: Joi.array()
                        .items(Joi.string()
                            .valid(...Object.values(RestaurantCategories))
                            .required())
                        .min(1)
                        .max(5)
                        .required(),
                    autoApprovedBookingsNum: Joi.number().integer()
                        .default(0),
                    timeFrom: JoiCommon.string.time.required(),

                    timeTo: JoiCommon.string.time
                        .custom((value, helpers) => {
                            const { timeFrom } = helpers.state.ancestors[0];
                            const from = dayjs(timeFrom, 'HH:mm', true);
                            const to = dayjs(value, 'HH:mm', true);
                            if (!to.isAfter(from)) {
                                return helpers.error('any.invalid');
                            }

                            return value;
                        }, 'time comparison')
                        .required(),

                    address: JoiCommon.object.address.keys({
                        latitude: Joi.forbidden(),
                        longitude: Joi.forbidden()
                    }).required()
                }).required()
            })
        },
        response: {
            getRestaurantList: Joi.object({
                brand: JoiCommon.object.brand.required(),

                restaurants: Joi.array()
                    .items(JoiCommon.object.restaurant.keys({
                        autoApprovedBookingsNum: Joi.number().integer()
                            .required(),
                        address: JoiCommon.object.address.required(),
                        staff: Joi.array().items(Joi.object({
                            admin: Joi.object({
                                id: JoiCommon.string.id,
                                firstName: JoiCommon.string.name,
                                lastName: JoiCommon.string.name,
                                email: JoiCommon.string.email,
                                avatarURL: Joi.string().uri()
                                    .optional(),
                                phone: Joi.string().optional()
                            })
                        }))
                    }))
                    .min(0)
                    .required(),

                pagination: JoiCommon.object.pagination.required()
            }).required(),
            putRestaurant: Joi.object({
                restaurant: JoiCommon.object.restaurant.keys({
                    autoApprovedBookingsNum: Joi.number().integer()
                        .required(),
                    address: JoiCommon.object.address.required()
                }),
                message: Joi.string().required()
            }).required(),
            deleteRestaurant: Joi.object({
                restaurant: Joi.object({
                    id: JoiCommon.string.id
                }).required(),
                message: Joi.string().required()
            }).required()
        }
    }

    constructor() {
        super()
    }

    private GetRestaurantListReqType: Joi.extractType<typeof RestaurantController.schemas.request.getRestaurantList>
    private GetRestaurantListResType: Joi.extractType<typeof RestaurantController.schemas.response.getRestaurantList>
    public async getRestaurantList(
        req: AuthAdminRequest & typeof this.GetRestaurantListReqType,
        res: Response<typeof this.GetRestaurantListResType>,
        next: NextFunction
    ) {
        try {
            const { query, user } = req

            const skip = (query.page - 1) * query.limit;
            let where: Prisma.RestaurantWhereInput = {
                brandID: user.brandID
            }
            
            if (user.role === AdminRole.Employee) {
                where = {
                    ...where,
                    staff: {
                        some: {
                            adminID: user.id
                        }
                    }
                }
            }

            const [count, brand, restaurants] = await Promise.all([
                prisma.restaurant.count({
                    where
                }),
                prisma.brand.findByID(user.brandID, {
                    id: true,
                    name: true,
                    logoURL: true
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
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                })
            ])

            return res.status(200).json({
                brand,
                restaurants,
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

    private DeleteRestaurantReqType: Joi.extractType<typeof RestaurantController.schemas.request.deleteRestaurant>
    private DeleteRestaurantResType: Joi.extractType<typeof RestaurantController.schemas.response.deleteRestaurant>
    public async deleteRestaurant(
        req: AuthAdminRequest & typeof this.DeleteRestaurantReqType,
        res: Response<typeof this.DeleteRestaurantResType>,
        next: NextFunction
    ) {
        try {
            const { params, user } = req
            const [restaurant, restaurantStaff] = await Promise.all([
                prisma.restaurant.findByID(params.restaurantID, {
                    id: true,
                    brandID: true 
                }),
                prisma.restaurantStaff.findMany({
                    where: {
                        restaurantID: params.restaurantID
                    }
                })
            ])
            if (!restaurant) {
                throw new IError(404, 'Restaurant not found')
            }

            if (user.brandID !== restaurant.brandID) {
                throw new IError(403, 'Access forbidden')
            }
            
            const now = dayjs().toISOString()

            await prisma.$transaction(async (tx: any) => {
                if (restaurantStaff.length > 0) {
                    await Promise.all([tx.admin.updateMany({
                        where: {
                            id: {
                                in: restaurantStaff.map((staff: { adminID: string }) => staff.adminID)
                            }
                        },
                        data: {
                            deletedAt: now
                        }
                    }),
                    
                    tx.restaurant.updateOne(params.restaurantID, {
                        deletedAt: now
                    }),

                    tx.booking.updateMany({
                        where: {
                            AND: [
                                {
                                    restaurantID: params.restaurantID
                                },
                                { bookingTime: { gte: now } }
                            ]
                        },
                        data: {
                            status: BookingStatus.Cancelled
                        }
                    }) ])
                }
            })
            
            return res.status(200).json({
                restaurant: {
                    id: params.restaurantID
                },
                message: 'Restaurant was deleted successfully'
            })
        } catch (err) {
            return next(err)
        }
    }
    
    private PutRestaurantReqType: Joi.extractType<typeof RestaurantController.schemas.request.putRestaurant>
    private PutRestaurantResType: Joi.extractType<typeof RestaurantController.schemas.response.putRestaurant>
    public async putRestaurant(
        req: AuthAdminRequest & typeof this.PutRestaurantReqType,
        res: Response<typeof this.PutRestaurantResType>,
        next: NextFunction
    ) {
        try {
            const { body, user } = req

            const resAddress = await OpenStreetMapService.searchAddress(body.address)

            if (!resAddress) {
                throw new IError(400, 'Provided address was not recognized')
            }

            let restaurant

            if (body.restaurantID) {
                restaurant = await prisma.restaurant.findByID(body.restaurantID, {
                    id: true,
                    brandID: true 
                })

                if (!restaurant) {
                    throw new IError(404, 'Restaurant not found')
                }

                if (user.brandID !== restaurant.brandID) {
                    throw new IError(403, 'Not a restaurant owner')
                }
                
                restaurant = await prisma.restaurant.updateOne(body.restaurantID, {
                    name: req.body.name,
                    description: req.body.description,
                    bannerURL: req.body.bannerURL,
                    photosURL: req.body.photosURL,
                    categories: req.body.categories,
                    autoApprovedBookingsNum: req.body.autoApprovedBookingsNum,
                    timeFrom: req.body.timeFrom,
                    timeTo: req.body.timeTo,
                    address: {   // nested update
                        update: {
                            building: req.body.address.building,
                            street: req.body.address.street,
                            city: req.body.address.city,
                            postcode: req.body.address.postcode,
                            country: req.body.address.country,
                            latitude: resAddress.lat,
                            longitude: resAddress.lon
                        }
                    }
                })
            } else {
                restaurant = await prisma.restaurant.createOne({
                    name: req.body.name,
                    description: req.body.description,
                    bannerURL: req.body.bannerURL,
                    photosURL: req.body.photosURL,
                    categories: req.body.categories,
                    autoApprovedBookingsNum: req.body.autoApprovedBookingsNum,
                    timeFrom: req.body.timeFrom,
                    timeTo: req.body.timeTo,
                    address: {   // nested create
                        create: {
                            building: req.body.address.building,
                            street: req.body.address.street,
                            city: req.body.address.city,
                            postcode: req.body.address.postcode,
                            country: req.body.address.country,
                            latitude: resAddress.lat,
                            longitude: resAddress.lon
                        }
                    },
                    brand: { connect: { id: user.brandID } }
                })
            }

            restaurant = await prisma.restaurant.findByID(restaurant.id, {
                id: true,
                name: true,
                description: true,
                bannerURL: true,
                photosURL: true,
                timeFrom: true,
                timeTo: true,
                categories: true,
                autoApprovedBookingsNum: true,
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
            })

            return res.status(200).json({
                restaurant: restaurant,
                message: body.restaurantID ? 'Restaurant was updated successfully' : 'Restaurant was created successfully.'
            })
        } catch (err) {
            return next(err)
        }
    }
}