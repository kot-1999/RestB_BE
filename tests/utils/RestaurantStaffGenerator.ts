import { RestaurantStaff } from '@prisma/client'

import prisma from '../../src/services/Prisma'

export default class RestaurantStaffGenerator {
    /**
     * Create a restaurant staff relationship
     * @param adminID - Required: ID of the admin
     * @param restaurantID - Required: ID of the restaurant
     */
    public static createOne(adminID: string, restaurantID: string): Promise<RestaurantStaff> {
        return prisma.restaurantStaff.create({
            data: {
                adminID,
                restaurantID
            }
        })
    }

    public static generateData(adminID: string, restaurantID: string): RestaurantStaff {
        return {
            adminID,
            restaurantID
        }
    }
}
