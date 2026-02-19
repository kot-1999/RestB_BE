import { Router } from 'express'

import { RestaurantController } from '../../controllers/b2b/v1/restaurant/RestaurantController';
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware';
import { PassportStrategy } from '../../utils/enums'

// Init router and controller
const router = Router()
const restaurantController = new RestaurantController()

export default function restaurantRouter() {
    // List endpoints

    router.get(
        /*
            #swagger.tags = ['b2b-v1-Restaurant']
            #swagger.description = '(Not Implemented) Detailed List of restaurants.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1GetRestaurantListReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1GetRestaurantListRes" },
            }
        */
        '/',
        validationMiddleware(RestaurantController.schemas.request.getRestaurantList),
        authorizationMiddleware([PassportStrategy.jwtB2b]),
        restaurantController.getRestaurantList
    )

    router.post(
        /*
            #swagger.tags = ['b2b-v1-Restaurant']
            #swagger.description = '(Not Implemented) Create new restaurant.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1PostRestaurantReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1PostRestaurantRes" },
            }
        */
        '/',
        validationMiddleware(RestaurantController.schemas.request.postRestaurant),
        authorizationMiddleware([PassportStrategy.jwtB2b]),
        restaurantController.postRestaurant
    )

    return router
}
