import { BookingStatus, Prisma } from '@prisma/client';

import prisma from '../../services/Prisma';

/**
 * getBookingStats uses BIGINT
 * Following code is needed to fix:
 * TypeError: Do not know how to serialize a BigInt
 * */
// @ts-ignore
BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this.toString());
    return int ?? this.toString();
};

export default class DashboardQueries {
    private statuses: BookingStatus[] = [
        BookingStatus.Cancelled,
        BookingStatus.Pending,
        BookingStatus.Completed,
        BookingStatus.Approved,
        BookingStatus.NoShow
    ]

    public getBookingStats(
        restaurantIDs: string[],
        from: Date,
        to: Date
    ) {
        // Ensure restaurantIDs is not empty
        if (restaurantIDs.length === 0) {
            return []
        }

        // $queryRaw with proper value injection
        return  prisma.$queryRaw<
            {
                restaurantID: string;
                date: string;
                st: string;
                count: number;
                totalGuests: number;
            }[]
        >`
          SELECT
            restaurantID,
            DATE(bookingTime) AS date,
            status,
            COUNT(*) AS count,
            SUM(guestsNumber) AS totalGuests
          FROM bookings
          WHERE
            bookingTime BETWEEN ${from} AND ${to}
            AND restaurantID IN (${Prisma.join(restaurantIDs)})
            AND status IN (${Prisma.join(this.statuses)})
          GROUP BY restaurantID, status, date
          ORDER BY date ASC
        `;
    }
}
