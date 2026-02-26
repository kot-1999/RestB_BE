import { AdminRole, Prisma, RestaurantCategories } from '@prisma/client'
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
                        staff: Joi.array()
                            .items(Joi.object({
                                id: JoiCommon.string.id,
                                firstName: JoiCommon.string.name.required(),
                                lastName: JoiCommon.string.name.required(),
                                email: JoiCommon.string.email.required(),

                                role: Joi.string()
                                    .valid(...Object.values(AdminRole))
                                    .required()
                            }))
                            .min(0)
                            .required()
                    }))
                    .min(0)
                    .required(),

                pagination: JoiCommon.object.pagination.required()
            }).required(),
            putRestaurant: Joi.object({
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
                restaurant = await prisma.restaurant.findByID(body.restaurantID, { id: true })

                if (!restaurant) {
                    throw new IError(404, 'Restaurant not found')
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

            return res.status(200).json({
                restaurant: {
                    id: restaurant.id
                },
                message: body.restaurantID ? 'Restaurant was updated successfully' : 'Restaurant was created successfully.'
            })
        } catch (err) {
            return next(err)
        }
    }
}