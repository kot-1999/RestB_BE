import { Response, NextFunction } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../../../types/AbstractController'
import { JoiCommon } from '../../../../types/JoiCommon'

export class RestaurantController extends AbstractController {
    public static readonly schemas = {
        request: {
            getRestaurant: JoiCommon.object.request.keys({
                params: Joi.object({
                    restaurantID: JoiCommon.string.id
                }).required()
            }),
            getRestaurantList: JoiCommon.object.request.keys({
                query: Joi.object({
                    search: Joi.string().min(2)
                        .optional(),
                    radius: Joi.number().integer()
                        .min(1)
                        .max(100)
                        .default(10),
                    brandID: JoiCommon.string.id.optional(),
                    date: Joi.date().default(() => new Date().toISOString()),
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
    async getRestaurant(
        req: Request & typeof this.GetRestaurantReqType,
        res: Response<typeof this.GetRestaurantResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({
                address: {},
                availability: undefined,
                bannerURL: "",
                brand: undefined,
                description: "",
                id: "",
                name: "",
                photosURL: [],
                timeFrom: undefined,
                timeTo: undefined
            })
        } catch (err) {
            return next(err)
        }
    }

    private GetRestaurantListReqType: Joi.extractType<typeof RestaurantController.schemas.request.getRestaurantList>
    private GetRestaurantListResType: Joi.extractType<typeof RestaurantController.schemas.response.getRestaurantList>
    getRestaurantList(
        req: Request & typeof this.GetRestaurantListReqType,
        res: Response<typeof this.GetRestaurantListResType>,
        next: NextFunction
    ) {
        try {

            return res.status(200).json({
                restaurants: [],
                pagination: undefined,
            })
        } catch (err) {
            return next(err)
        }
    }
}