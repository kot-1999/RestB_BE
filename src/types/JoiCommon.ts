import Joi from 'joi'

import { Constants } from '../utils/Constants'

const discussionItem = Joi.object({
    authorID: Joi.string().required(),

    authorType: Joi.string()
        .valid('user', 'admin')
        .required(),

    message: Joi.string().trim()
        .min(1)
        .required(),

    createdAt: Joi.date().iso()
        .required()
})

export class JoiCommon {
    static readonly string = {
        id: Joi.string().uuid()
            .required(),
        name: Joi.string().trim()
            .alphanum()
            .allow('\'', '-')
            .min(Constants.number.MIN_NAME_LENGTH)
            .max(Constants.number.MAX_STRING_LENGTH),
        email: Joi.string().email()
            .trim()
            .case('lower'),
        token: Joi.string()
    }

    static readonly number = {

    }

    static readonly object = {
        request: Joi.object({
            query: Joi.object(),
            body: Joi.object(),
            params: Joi.object(),
            headers: Joi.object()
        }),

        restaurant: Joi.object({
            id: JoiCommon.string.id,
            name: JoiCommon.string.name.required(),
            description: Joi.string().min(20)
                .optional(),
            bannerURL: Joi.string().uri()
                .required(),
            photosURL: Joi.array()
                .items(Joi
                    .string()
                    .uri()
                    .required())
                .required(),
            timeFrom: Joi.date().required(),
            timeTo: Joi.date().greater(Joi.ref('timeFrom'))
                .required()
        }),

        brand: Joi.object({
            id: JoiCommon.string.id,
            name: JoiCommon.string.name.required(),
            logoURL: Joi.string().uri()
                .optional()
        }),

        address: Joi.object({
            building: Joi.string().trim()
                .min(1)
                .required(),

            street: Joi.string().trim()
                .min(1)
                .required(),

            city: Joi.string().trim()
                .min(1)
                .required(),

            postcode: Joi.string().trim()
                .min(1)
                .required(),

            country: Joi.string().trim()
                .min(1)
                .required(),

            latitude: Joi.number()
                .min(-90)
                .max(90)
                .precision(6)
                .required(),

            longitude: Joi.number()
                .min(-180)
                .max(180)
                .precision(6)
                .required()
        }),

        discussionItem,
        
        booking: Joi.object({
            id: Joi.string().required(),

            guestsNumber: Joi.number().integer()
                .min(1)
                .required(),

            bookingTime: Joi.date().iso()
                .required(),

            status: Joi.string().required(),

            discussion: Joi.array().items(discussionItem)
                .min(0)
                .required()
        }),
        
        bookingDailySummary: Joi.object({
            date: Joi.date().iso()
                .required(),

            totalApprovedBookings: Joi.number()
                .integer()
                .min(0)
                .required(),

            totalPendingBookings: Joi.number()
                .integer()
                .min(0)
                .required(),

            totalGuests: Joi.number()
                .integer()
                .min(0)
                .required(),

            autoConfirmGuestsLimit: Joi.number()
                .integer()
                .min(0)
                .required()
        }),

        pagination: Joi.object({
            page: Joi.number()
                .integer()
                .min(1)
                .required(),

            limit: Joi.number()
                .integer()
                .min(1)
                .max(100)
                .required(),

            total: Joi.number()
                .integer()
                .min(0)
                .required()
        })
    }
}