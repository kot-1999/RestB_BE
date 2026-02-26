import { faker } from '@faker-js/faker'
import { Restaurant, RestaurantCategories } from '@prisma/client'
import dayjs from 'dayjs'

import prisma from '../../src/services/Prisma'

export default class RestaurantGenerator {
    /**
     * Create a restaurant without required foreign keys
     * @param restaurantData - Optional partial restaurant data
     */
    public static createOne(restaurantData: Partial<Restaurant> = {}): Promise<Restaurant> {
        return prisma.restaurant.create({
            data: RestaurantGenerator.generateData(restaurantData)
        })
    }

    public static generateData(restaurantData: Partial<Restaurant> = {}): Restaurant {
        return {
            id: restaurantData.id ?? faker.string.uuid(),
            name: restaurantData.name ?? faker.company.name(),
            description: restaurantData.description ?? faker.lorem.paragraph(),
            bannerURL: restaurantData.bannerURL ?? faker.image.url(),
            photosURL: restaurantData.photosURL ?? [faker.image.url(), faker.image.url()],
            timeFrom: restaurantData.timeFrom ?? dayjs(faker.date.between({
                from: dayjs().startOf('day')
                    .add(5, 'hour')
                    .toDate(),
                to: dayjs().startOf('day')
                    .add(10, 'hour')
                    .toDate()
            })).format('HH.mm'),
            autoApprovedBookingsNum: restaurantData.autoApprovedBookingsNum ?? 0,
            categories: restaurantData.categories ?? [RestaurantCategories.BBQ],
            timeTo: restaurantData.timeTo ?? restaurantData.timeFrom ?? dayjs(faker.date.between({
                from: dayjs().startOf('day')
                    .add(14, 'hour')
                    .toDate(),
                to: dayjs().startOf('day')
                    .add(22, 'hour')
                    .toDate()
            })).format('HH.mm'),
            brandID: restaurantData.brandID ?? faker.string.uuid(),
            addressID: restaurantData.addressID ?? faker.string.uuid(),
            createdAt: restaurantData.createdAt as Date ?? new Date(dayjs().toISOString()),
            updatedAt: restaurantData.updatedAt as Date ?? new Date(dayjs().toISOString()),
            deletedAt: restaurantData.deletedAt ?? null
        }
    }
}
