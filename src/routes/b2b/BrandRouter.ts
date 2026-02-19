import { Router } from 'express'

import { BrandController } from '../../controllers/b2b/v1/brand/BrandController';
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware';
import { PassportStrategy } from '../../utils/enums'

// Init router and controller
const router = Router()
const brandController = new BrandController()

export default function restaurantRouter() {
    // List endpoints

    router.get(
        /*
            #swagger.tags = ['b2b-v1-Brand']
            #swagger.description = '(Not Implemented) Update brand.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1UpdateBrandReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1UpdateBrandRes" },
            }
        */
        '/:brandID',
        validationMiddleware(BrandController.schemas.request.updateBrand),
        authorizationMiddleware([PassportStrategy.jwtB2b]),
        brandController.updateBrand
    )

    return router
}
