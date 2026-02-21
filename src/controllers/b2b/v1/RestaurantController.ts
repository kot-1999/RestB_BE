import { AdminRole, RestaurantCategories } from '@prisma/client';
import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'

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
            postRestaurant: JoiCommon.object.request.keys({
                body: Joi.object({
                    name: JoiCommon.string.name.required(),

                    description: Joi.string()
                        .min(20)
                        .optional(),

                    bannerURL: Joi.string()
                        .required(),

                    photosURL: Joi.array()
                        .items(Joi.string()
                            .required())
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
                    timeFrom: Joi.date().required(),

                    timeTo: Joi.date()
                        .greater(Joi.ref('timeFrom'))
                        .required(),

                    address: JoiCommon.object.address.required()
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
                            }).required())
                            .min(0)
                            .required()
                    }).required())
                    .min(0)
                    .required(),

                pagination: JoiCommon.object.pagination.required()
            }).required(),
            postRestaurant: Joi.object({
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

            return res.status(200).json({
                brand: {
                    id: 'asdasd',
                    name: 'asdasd'
                },
                restaurants: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private PostRestaurantReqType: Joi.extractType<typeof RestaurantController.schemas.request.postRestaurant>
    private PostRestaurantResType: Joi.extractType<typeof RestaurantController.schemas.response.postRestaurant>
    public async postRestaurant(
        req: AuthAdminRequest & typeof this.PostRestaurantReqType,
        res: Response<typeof this.PostRestaurantResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({
                restaurant: {
                    id: 'asd'
                },
                message: 'asd'
            })
        } catch (err) {
            return next(err)
        }
    }
}