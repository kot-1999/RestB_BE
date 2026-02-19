// @ts-nocheck
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
            #swagger.tags = ['b2b-v1-Booking']
            #swagger.description = '(Not Implemented) List restaurants with booking daily summary.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1GetBookingListReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1GetBookingListRes" },
            }
        */
        '/',
        validationMiddleware(BookingController.schemas.request.getBookingList),
        authorizationMiddleware([PassportStrategy.jwtB2b]),
        bookingController.getBookingList
    )

    router.get(
        /*
            #swagger.tags = ['b2b-v1-Booking']
            #swagger.description = '(Not Implemented) List restaurants with booking daily summary.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1GetBookingDetailsReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1GetBookingDetailsRes" },
            }
        */
        '/:restaurantID',
        validationMiddleware(BookingController.schemas.request.getBookingDetails),
        authorizationMiddleware([PassportStrategy.jwtB2b]),
        bookingController.getBookingDetails
    )

    router.patch(
        /*
            #swagger.tags = ['b2c-v1-Booking', 'b2b-v1-Booking']
            #swagger.description = '(Not Implemented) Update Booking',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1UpdateBookingReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1UpdateBookingRes" },
            }
        */
        '/:bookingID',
        validationMiddleware(BookingController.schemas.request.updateBooking),
        authorizationMiddleware([PassportStrategy.jwtB2c, PassportStrategy.google, PassportStrategy.jwtB2b]),
        bookingController.updateBooking
    )

    return router
}
