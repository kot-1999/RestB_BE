import { Router } from 'express'

import { DashboardController } from '../../controllers/b2b/v1/DashboardController';
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware';
import { PassportStrategy } from '../../utils/enums'

// Init router and controller
const router = Router()
const dashboardController = new DashboardController()

export default function dashboardRouter() {
    // List endpoints

    router.get(
        /*
            #swagger.tags = ['b2b-v1-Dashboard']
            #swagger.description = '(Not Implemented) Get admin dashboard details.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1GetDashboardReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1GetDashboardRes" },
            }
        */
        '/',
        validationMiddleware(DashboardController.schemas.request.getDashboard),
        authorizationMiddleware([PassportStrategy.jwtB2b]),
        dashboardController.getDashboard
    )

    return router
}
