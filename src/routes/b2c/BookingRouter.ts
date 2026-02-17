import { Router } from 'express'

import { BookingController } from '../../controllers/b2b/v1/booking/BookingController';
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

// Init router and controller
const router = Router()
const bookingController = new BookingController()

export default function bookingRouter() {
    // List endpoints
    router.get(
        /*
            #swagger.tags = ['b2c-v1-Booking']
            #swagger.description = 'Get Booking details',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2cV1GetBookingReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2cV1GetBookingRes" },
            }
        */
        '/:bookingID',
        validationMiddleware(BookingController.schemas.request.getBooking),
        authorizationMiddleware([PassportStrategy.jwtB2c, PassportStrategy.google]),
        bookingController.getBooking
    )

    router.get(
        /*
            #swagger.tags = ['b2c-v1-Booking']
            #swagger.description = 'Get BookingList details',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2cV1GetBookingListReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2cV1GetBookingListRes" },
            }
        */
        '/',
        validationMiddleware(BookingController.schemas.request.getBookingList),
        authorizationMiddleware([PassportStrategy.jwtB2c, PassportStrategy.google]),
        bookingController.getBookingList
    )

    router.post(
        /*
            #swagger.tags = ['b2c-v1-Booking']
            #swagger.description = 'Post Booking',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2cV1PostBookingReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2cV1PostBookingRes" },
            }
        */
        '/',
        validationMiddleware(BookingController.schemas.request.postBooking),
        authorizationMiddleware([PassportStrategy.jwtB2c, PassportStrategy.google]),
        bookingController.postBooking
    )
    return router
}
