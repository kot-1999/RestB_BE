import { faker } from '@faker-js/faker'
import {Restaurant, RestaurantCategories} from '@prisma/client'
import dayjs from 'dayjs'

import prisma from '../../src/services/Prisma'

export default class RestaurantGenerator {
    /**
     * Create a restaurant with required foreign keys
     * @param brandID - Required: ID of the brand this restaurant belongs to
     * @param addressID - Required: ID of the address for this restaurant
     * @param restaurantData - Optional partial restaurant data
     */
    public static createOne(
        brandID: string,
        addressID: string,
        restaurantData: Partial<Restaurant> = {}
    ): Promise<Restaurant> {
        return prisma.restaurant.create({
            data: RestaurantGenerator.generateData(brandID, addressID, restaurantData)
        })
    }

    public static generateData(
        brandID: string,
        addressID: string,
        restaurantData: Partial<Restaurant> = {}
    ): Restaurant {
        return {
            id: restaurantData.id ?? faker.string.uuid(),
            name: restaurantData.name ?? faker.company.name(),
            description: restaurantData.description ?? faker.lorem.paragraph(),
            bannerURL: restaurantData.bannerURL ?? faker.image.url(),
            photosURL: restaurantData.photosURL ?? [faker.image.url(), faker.image.url()],
            timeFrom: restaurantData.timeFrom ?? new Date('1970-01-01T09:00:00Z'),
            autoApprovedBookingsNum: restaurantData.autoApprovedBookingsNum ?? 0,
            categories: restaurantData.categories ?? [RestaurantCategories.BBQ],
            timeTo: restaurantData.timeTo ?? new Date('1970-01-01T23:00:00Z'),
            brandID: brandID,
            addressID: addressID,
            createdAt: restaurantData.createdAt as Date ?? new Date(dayjs().toISOString()),
            updatedAt: restaurantData.updatedAt as Date ?? new Date(dayjs().toISOString()),
            deletedAt: restaurantData.deletedAt ?? null
        }
    }
}
