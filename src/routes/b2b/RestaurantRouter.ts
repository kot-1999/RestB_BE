import { AdminRole } from '@prisma/client';
import { Router } from 'express'

import { RestaurantController } from '../../controllers/b2b/v1/RestaurantController';
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import permissionMiddleware from '../../middlewares/permissionMiddleware';
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
            #swagger.description = 'Detailed List of restaurants.',
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
        authorizationMiddleware([PassportStrategy.jwtB2b]),
        validationMiddleware(RestaurantController.schemas.request.getRestaurantList),
        restaurantController.getRestaurantList
    )

    router.put(
        /*
            #swagger.tags = ['b2b-v1-Restaurant']
            #swagger.description = 'Create new restaurant.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1PutRestaurantReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1PutRestaurantRes" },
            }
        */
        '/',
        authorizationMiddleware([PassportStrategy.jwtB2b]),
        permissionMiddleware([AdminRole.Admin]),
        validationMiddleware(RestaurantController.schemas.request.putRestaurant),
        restaurantController.putRestaurant
    )

    return router
}
