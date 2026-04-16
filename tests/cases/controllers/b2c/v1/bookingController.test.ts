import { faker } from '@faker-js/faker';
import { BookingStatus, Restaurant, User } from '@prisma/client'
import { expect } from 'chai'
import dayjs from 'dayjs';
import supertest from 'supertest'

import app from '../../../../../src/app'
import { BookingController } from '../../../../../src/controllers/b2c/v1/BookingController'
import { JwtService } from '../../../../../src/services/Jwt'
import prisma from '../../../../../src/services/Prisma'
import { JwtAudience } from '../../../../../src/utils/enums'

const endpoint = (val: string = '') => '/api/b2c/v1/booking/' + val

describe('GET ' + endpoint(), () => {
    let user: User 
    
    before(async () => {
        user = await prisma.user.findOne()
    })
    
    it('List of bookings (200)', async () => {
        const res = await supertest(app)
            .get(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: user.id,
                aud: JwtAudience.b2c
            })}`)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')
        
        const validationResult = BookingController.schemas.response.getBookingList.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('List of bookings with query params (200)', async () => {
        const res = await supertest(app)
            .get(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: user.id,
                aud: JwtAudience.b2c
            })}`)
            .query({
                page: 2,
                limit: 3,
                statuses: [BookingStatus.Approved, BookingStatus.Pending, BookingStatus.Completed],
                dateFrom: dayjs().subtract(20, 'days')
                    .toISOString(),
                dateTo: dayjs().add(20, 'days')
                    .toISOString()
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BookingController.schemas.response.getBookingList.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('Date from must be lover than dateTo (200)', async () => {
        const res = await supertest(app)
            .get(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: user.id,
                aud: JwtAudience.b2c
            })}`)
            .query({
                page: 2,
                limit: 3,
                statuses: [BookingStatus.Approved, BookingStatus.Pending, BookingStatus.Completed],
                dateFrom: dayjs().toISOString(),
                dateTo: dayjs().subtract(1, 'minute')
                    .toISOString()
            })

        expect(res.statusCode).to.equal(400)
        expect(res.type).to.eq('application/json')
    })
})

describe('POST ' + endpoint(), () => {
    let user: User
    let restaurant: Restaurant

    before(async () => {
        [user, restaurant] = await Promise.all([
            prisma.user.findOne(),
            prisma.restaurant.findOne()
        ])

        await prisma.restaurant.updateOne(restaurant.id, {
            timeFrom: '10:00',
            timeTo: '20:00'
        })
    })

    it('Create booking (200)', async () => {
        const res = await supertest(app)
            .post(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: user.id,
                aud: JwtAudience.b2c
            })}`)
            .send({
                restaurantID: restaurant.id,
                guestsNumber: 3,
                bookingTime: dayjs('13:00', 'HH:mm').add(1, 'day')
                    .toISOString()
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BookingController.schemas.response.postBooking.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('Create booking (200) - with message', async () => {
        const res = await supertest(app)
            .post(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: user.id,
                aud: JwtAudience.b2c
            })}`)
            .send({
                restaurantID: restaurant.id,
                guestsNumber: 3,
                bookingTime: dayjs('14:00', 'HH:mm').add(1, 'day')
                    .toISOString(),
                message: 'Can we have three bottles of red wine served on arrival'
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BookingController.schemas.response.postBooking.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('Create booking (400) - in the past', async () => {
        const res = await supertest(app)
            .post(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: user.id,
                aud: JwtAudience.b2c
            })}`)
            .send({
                restaurantID: restaurant.id,
                guestsNumber: 3,
                bookingTime: dayjs('14:00', 'HH:mm').subtract(1, 'day')
                    .toISOString(),
                message: 'Can we have three bottles of red wine served on arrival'
            })

        expect(res.statusCode).to.equal(400)
        expect(res.type).to.eq('application/json')
    })

    it('Create bbooking (400) - out of restaurant opening hours', async () => {
        const res = await supertest(app)
            .post(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: user.id,
                aud: JwtAudience.b2c
            })}`)
            .send({
                restaurantID: restaurant.id,
                bookingTime: dayjs('21:00', 'HH:mm').add(1, 'day')
                    .toISOString()
            })

        expect(res.statusCode).to.equal(400)
        expect(res.type).to.eq('application/json')
    })

    it('Create Booking (404) - restaurant does not exist', async () => {
        const res = await supertest(app)
            .post(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: user.id,
                aud: JwtAudience.b2c
            })}`)
            .send({
                restaurantID: faker.string.uuid(),
                guestsNumber: 3,
                bookingTime: dayjs('21:00', 'HH:mm').add(1, 'day')
                    .toISOString()
            })

        expect(res.statusCode).to.equal(404)
        expect(res.type).to.eq('application/json')
    })
})