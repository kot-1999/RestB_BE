import { Admin, AdminRole } from '@prisma/client'
import { expect } from 'chai'
import supertest from 'supertest'

import app from '../../../../../src/app'
import { RestaurantController as AdminRestaurantController } from '../../../../../src/controllers/b2b/v1/RestaurantController'
import { JwtService } from '../../../../../src/services/Jwt'
import prisma from '../../../../../src/services/Prisma'
import { JwtAudience } from '../../../../../src/utils/enums'
import RestaurantGenerator from '../../../../utils/RestaurantGenerator'
import {faker} from "@faker-js/faker";

const endpoint = (val: string = '') => '/api/b2b/v1/restaurant/' + val

describe('GET ' + endpoint(''), () => {
    let admin: Admin

    beforeEach(async () => {
        admin = await prisma.admin.findOne({
            id: true
        }, {
            role: AdminRole.Admin
        })
    })
    
    it('List of restaurants (200)', async () => {
        const res = await supertest(app)
            .get(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })}`)
        
        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = AdminRestaurantController.schemas.response.getRestaurantList.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })
})

describe('PUT ' + endpoint(':restaurantID'), () => {
    let admin: Admin
    let restaurantID: string
    beforeEach(async () => {
        admin = await prisma.admin.findOne({
            id: true
        }, {
            role: AdminRole.Admin
        })
    })

    it('Create restaurant (200)', async () => {

        const restaurantData = RestaurantGenerator.generateData()

        const restaurantsCount = await prisma.restaurant.count()
        const res = await supertest(app)
            .put(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })}`)
            .send({
                name: restaurantData.name,
                description: restaurantData.description,
                bannerURL: restaurantData.bannerURL,
                photosURL: restaurantData.photosURL,
                categories: restaurantData.categories,
                autoApprovedBookingsNum: restaurantData.autoApprovedBookingsNum,
                timeFrom: restaurantData.timeFrom,
                timeTo: restaurantData.timeTo,
                address: {
                    building: '123',
                    street: 'Cumberland',
                    city: 'London',
                    postcode: 'SW30',
                    country: 'United Kingdom'
                }
            })
        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        expect(await prisma.restaurant.count()).to.eq(restaurantsCount + 1)

        const validationResult = AdminRestaurantController.schemas.response.putRestaurant.validate(res.body)
        expect(validationResult.error).to.eq(undefined)

        restaurantID = res.body.restaurant.id
    })

    it('Update restaurant (200)', async () => {

        const restaurantData = RestaurantGenerator.generateData()

        const restaurantsCount = await prisma.restaurant.count()
        const res = await supertest(app)
            .put(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })}`)
            .send({
                restaurantID: restaurantID,
                name: restaurantData.name,
                description: restaurantData.description,
                bannerURL: restaurantData.bannerURL,
                photosURL: restaurantData.photosURL,
                categories: restaurantData.categories,
                autoApprovedBookingsNum: restaurantData.autoApprovedBookingsNum,
                timeFrom: restaurantData.timeFrom,
                timeTo: restaurantData.timeTo,
                address: {
                    building: '12',
                    street: 'Haydons rd',
                    city: 'London',
                    postcode: 'SW19',
                    country: 'United Kingdom'
                }
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')
        expect(await prisma.restaurant.count()).to.eq(restaurantsCount)

        const validationResult = AdminRestaurantController.schemas.response.putRestaurant.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('Restaurant not found (404)', async () => {

        const restaurantData = RestaurantGenerator.generateData()

        const res = await supertest(app)
            .put(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })}`)
            .send({
                restaurantID: faker.string.uuid(),
                name: restaurantData.name,
                description: restaurantData.description,
                bannerURL: restaurantData.bannerURL,
                photosURL: restaurantData.photosURL,
                categories: restaurantData.categories,
                autoApprovedBookingsNum: restaurantData.autoApprovedBookingsNum,
                timeFrom: restaurantData.timeFrom,
                timeTo: restaurantData.timeTo,
                address: {
                    building: '12',
                    street: 'Haydons rd',
                    city: 'London',
                    postcode: 'SW19',
                    country: 'United Kingdom'
                }
            })

        expect(res.statusCode).to.equal(404)
        expect(res.type).to.eq('application/json')
    })

    it('Incorrect address (400)', async () => {

        const restaurantData = RestaurantGenerator.generateData()

        const res = await supertest(app)
            .put(endpoint())
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })}`)
            .send({
                restaurantID: faker.string.uuid(),
                name: restaurantData.name,
                description: restaurantData.description,
                bannerURL: restaurantData.bannerURL,
                photosURL: restaurantData.photosURL,
                categories: restaurantData.categories,
                autoApprovedBookingsNum: restaurantData.autoApprovedBookingsNum,
                timeFrom: restaurantData.timeFrom,
                timeTo: restaurantData.timeTo,
                address: {
                    building: '123asfg',
                    street: ';sdlg  asd',
                    city: 'Londondodon',
                    postcode: 'SW19213sd2',
                    country: 'ZM'
                }
            })

        expect(res.statusCode).to.equal(400)
        expect(res.type).to.eq('application/json')
    })
})