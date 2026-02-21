import { faker } from '@faker-js/faker'
import { BookingsDailySummary } from '@prisma/client'
import dayjs from 'dayjs'

import prisma from '../../src/services/Prisma'

export default class BookingsDailySummaryGenerator {
    /**
     * Create a bookings daily summary with required restaurant
     * @param restaurantID - Required: ID of the restaurant
     * @param summaryData - Optional partial summary data
     */
    public static createOne(
        restaurantID: string,
        summaryData: Partial<BookingsDailySummary> = {}
    ): Promise<BookingsDailySummary> {
        return prisma.bookingsDailySummary.create({
            data: BookingsDailySummaryGenerator.generateData(restaurantID, summaryData)
        })
    }

    public static generateData(
        restaurantID: string,
        summaryData: Partial<BookingsDailySummary> = {}
    ): BookingsDailySummary {
        return {
            id: summaryData.id ?? faker.string.uuid(),
            totalApprovedBookings: summaryData.totalApprovedBookings ?? faker.number.int({ min: 0, max: 50 }),
            totalPendingBookings: summaryData.totalPendingBookings ?? faker.number.int({ min: 0, max: 30 }),
            totalCanceledByUserBookings: summaryData.totalCanceledByUserBookings ?? faker.number.int({ min: 0, max: 10 }),
            totalCanceledByAdminBookings: summaryData.totalCanceledByAdminBookings ?? faker.number.int({ min: 0, max: 10 }),
            totalGuests: summaryData.totalGuests ?? faker.number.int({ min: 0, max: 200 }),
            restaurantID: restaurantID,
            createdAt: summaryData.createdAt as Date ?? new Date(dayjs().toISOString()),
            updatedAt: summaryData.updatedAt as Date ?? new Date(dayjs().toISOString()),
            deletedAt: summaryData.deletedAt ?? null
        }
    }
}
