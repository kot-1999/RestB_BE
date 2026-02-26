import { faker } from '@faker-js/faker'
import { Restaurant, RestaurantCategories } from '@prisma/client'
import { expect } from 'chai'
import dayjs from 'dayjs'
import supertest from 'supertest'

import app from '../../../../../src/app'
import { RestaurantController as UserRestaurantController } from '../../../../../src/controllers/b2c/v1/RestaurantController';
import prisma from '../../../../../src/services/Prisma'

const endpoint = (val: string = '') => '/api/b2c/v1/restaurant/' + val

describe('GET ' + endpoint(''), () => {
    it('List of restaurants (200)', async () => {
        const res = await supertest(app)
            .get(endpoint())
            .set('Content-Type', 'application/json')

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = UserRestaurantController.schemas.response.getRestaurantList.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('List of restaurants (200) - with search and radius', async () => {
        const res = await supertest(app)
            .get('/api/b2c/v1/restaurant/')
            .query({
                search: 'London Bridge',
                radius: 100
            })
            .set('Content-Type', 'application/json');

        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult = UserRestaurantController.schemas.response.getRestaurantList.validate(res.body);
        expect(validationResult.error).to.eq(undefined);
    });

    it('List of restaurants (200) - with categories', async () => {
        const res = await supertest(app)
            .get('/api/b2c/v1/restaurant/')
            .query({
                categories: [RestaurantCategories.Mediterranean, RestaurantCategories.Vegan] // inline categories
            })
            .set('Content-Type', 'application/json');

        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult = UserRestaurantController.schemas.response.getRestaurantList.validate(res.body);
        expect(validationResult.error).to.eq(undefined);
    });

    it('List of restaurants (200) - with pagination', async () => {
        const res = await supertest(app)
            .get('/api/b2c/v1/restaurant/')
            .query({
                page: 2,
                limit: 1
            })
            .set('Content-Type', 'application/json');

        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult = UserRestaurantController.schemas.response.getRestaurantList.validate(res.body);
        expect(validationResult.error).to.eq(undefined);
    });

    it('List of restaurants (200) - combined params', async () => {
        const res = await supertest(app)
            .get('/api/b2c/v1/restaurant/')
            .query({
                search: 'Central London',
                radius: 77,
                categories: [RestaurantCategories.Pizza, RestaurantCategories.FastFood],
                page: 1,
                limit: 30,
                date: dayjs().add(1, 'day')
                    .toISOString() // optional, defaults to now
            })
            .set('Content-Type', 'application/json');

        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult = UserRestaurantController.schemas.response.getRestaurantList.validate(res.body);
        expect(validationResult.error).to.eq(undefined);
    });
})

describe('GET ' + endpoint(':restaurantID'), () => {
    let restaurants: Restaurant[];

    beforeEach(async () => {
        restaurants = await prisma.restaurant.findMany({
            take: 10,
            select: {
                id: true
            }
        })
    })

    it('Details of restaurant (200)', async () => {
        const res = await supertest(app)
            .get(endpoint(restaurants[0].id))
            .set('Content-Type', 'application/json')

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = UserRestaurantController.schemas.response.getRestaurant.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('Details of restaurant - not found (404)', async () => {
        const res = await supertest(app)
            .get(endpoint(faker.string.uuid()))
            .set('Content-Type', 'application/json')

        expect(res.statusCode).to.equal(404)
        expect(res.type).to.eq('application/json')
    })

    it('Details of restaurant - invalid id (400)', async () => {
        const res = await supertest(app)
            .get(endpoint('invalid-id'))
            .set('Content-Type', 'application/json')

        expect(res.statusCode).to.equal(400)
        expect(res.type).to.eq('application/json')
    })
})