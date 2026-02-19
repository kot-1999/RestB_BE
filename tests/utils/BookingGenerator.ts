import { faker } from '@faker-js/faker'
import { Booking, BookingStatus } from '@prisma/client'
import dayjs from 'dayjs'

import prisma from '../../src/services/Prisma'

export default class BookingGenerator {
    /**
     * Create a booking with required restaurant
     * @param restaurantID - Required: ID of the restaurant
     * @param userID - Optional: ID of the user making the booking
     * @param bookingData - Optional partial booking data
     */
    public static createOne(
        restaurantID: string,
        userID?: string | null,
        bookingData: Partial<Booking> = {}
    ): Promise<Booking> {
        return prisma.booking.create({
            data: BookingGenerator.generateData(restaurantID, userID, bookingData)
        })
    }

    public static generateData(
        restaurantID: string,
        userID?: string | null,
        bookingData: Partial<Booking> = {}
    ): Booking {
        return {
            id: bookingData.id ?? faker.string.uuid(),
            guestsNumber: bookingData.guestsNumber ?? faker.number.int({
                min: 1,
                max: 20 
            }),
            bookingTime: bookingData.bookingTime ?? new Date(dayjs().add(1, 'day')
                .toISOString()),
            status: bookingData.status ?? BookingStatus.Pending,
            discussion: bookingData.discussion ?? null,
            userID: userID ?? null,
            restaurantID: restaurantID,
            createdAt: bookingData.createdAt as Date ?? new Date(dayjs().toISOString()),
            updatedAt: bookingData.updatedAt as Date ?? new Date(dayjs().toISOString()),
            deletedAt: bookingData.deletedAt ?? null
        }
    }
}
