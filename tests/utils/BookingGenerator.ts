import { faker } from '@faker-js/faker'
import { Booking, BookingStatus } from '@prisma/client'
import dayjs from 'dayjs'

import prisma from '../../src/services/Prisma'

export default class BookingGenerator {
    /**
     * Create a booking with required restaurant
     */
    public static createOne(bookingData: Partial<Booking> = {}): Promise<Booking> {
        return prisma.booking.create({
            data: BookingGenerator.generateData( bookingData)
        })
    }

    public static generateData(bookingData: Partial<Booking> = {}): Booking {
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
            userID: bookingData.userID ?? faker.string.uuid(),
            restaurantID: bookingData.restaurantID ?? faker.string.uuid(),
            createdAt: bookingData.createdAt as Date ?? new Date(dayjs().toISOString()),
            updatedAt: bookingData.updatedAt as Date ?? new Date(dayjs().toISOString()),
            deletedAt: bookingData.deletedAt ?? null
        }
    }
}
