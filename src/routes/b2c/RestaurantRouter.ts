import { Router } from 'express'

import { RestaurantController } from '../../controllers/b2c/v1/restaurant/RestaurantController';
import validationMiddleware from '../../middlewares/validationMiddleware'

// Init router and controller
const router = Router()
const restaurantController = new RestaurantController()

export default function RestaurantRouter() {
    // List endpoints
    router.get(
        /*
            #swagger.tags = ['b2c-v1-Restaurant']
            #swagger.description = 'Get Restaurant details',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2cV1GetRestaurantReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2cV1GetRestaurantRes" },
            }
        */
        '/:restaurantID',
        validationMiddleware(RestaurantController.schemas.request.getRestaurant),
        restaurantController.getRestaurant
    )

    router.get(
        /*
            #swagger.tags = ['b2c-v1-Restaurant']
            #swagger.description = 'Get RestaurantList details',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2cV1GetRestaurantListReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2cV1GetRestaurantListRes" },
            }
        */
        '/',
        validationMiddleware(RestaurantController.schemas.request.getRestaurantList),
        restaurantController.getRestaurantList
    )
    return router
}
