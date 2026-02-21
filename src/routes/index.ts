import { Router } from 'express'

import adminAuthorizationRouter from './b2b/AdminAuthorizationRouter'
import adminRouter from './b2b/AdminRouter'
import adminBookingRouter from './b2b/BookingRouter'
import dashboardRouter from './b2b/DashboardRouter'
import adminRestaurantRouter from './b2b/RestaurantRouter'
import userBookingRouter from './b2c/BookingRouter'
import userRestaurantRouter from './b2c/RestaurantRouter'
import userAuthorizationRouter from './b2c/UserAuthorizationRouter'
import userRouter from './b2c/UserRouter'
import { FileUpload } from '../controllers/FileUpload';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import validationMiddleware from '../middlewares/validationMiddleware';
import logger from '../services/Logger'
import { PassportStrategy } from '../utils/enums';

const router = Router()
const fileUpload = new FileUpload()

export default function authorizeRouters() {
    // B2B
    router.use('/b2b/v1/authorization', adminAuthorizationRouter())
    router.use('/b2b/v1/admin', adminRouter())
    router.use('/b2b/v1/restaurant', adminRestaurantRouter())
    router.use('/b2b/v1/booking', adminBookingRouter())
    router.use('/b2b/v1/dashboard', dashboardRouter())
    // B2C
    router.use('/b2c/v1/authorization',userAuthorizationRouter())
    router.use('/b2c/v1/user', userRouter())
    router.use('/b2c/v1/restaurant', userRestaurantRouter())
    router.use('/b2c/v1/booking', userBookingRouter())

    // Other
    router.put(
        /*
            #swagger.tags = ['File-Upload']
            #swagger.description = 'Upload a file.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1PutFileReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1PutFileRes" },
            }
        */
        '/upload-url',
        validationMiddleware(FileUpload.schemas.request.putFile),
        authorizationMiddleware([PassportStrategy.jwtB2b, PassportStrategy.jwtB2c, PassportStrategy.google]),
        fileUpload.putFile
    )

    logger.info('Application routes were initialized.')

    return router
}