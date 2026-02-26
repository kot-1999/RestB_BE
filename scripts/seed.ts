import { faker } from '@faker-js/faker';
import { Decimal } from '@prisma/client/runtime/library';
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat';

import prisma from '../src/services/Prisma'
import AddressGenerator from '../tests/utils/AddressGenerator';
import AdminGenerator from '../tests/utils/AdminGenerator'
import BookingGenerator from '../tests/utils/BookingGenerator';
import BrandGenerator from '../tests/utils/BrandGenerator'
import RestaurantGenerator from '../tests/utils/RestaurantGenerator';
import UserGenerator from '../tests/utils/UserGenerator'
import crypto from "crypto-js";

const timeFrom = dayjs().subtract(20, 'days')
const timeTo = dayjs().add(20, 'days')
dayjs.extend(customParseFormat);

// London coordinates and sub areas
const GEO_BOX = {
    minLat: 51.00,
    maxLat: 52.00,
    minLng: -0.7,
    maxLng: 0.7
};

const GRAIN = 500

async function seed() {
    const userData: any[] = []
    const adminData: any[] = []
    const brandData: any[] = []

    const addressData: any[] = []
    const restaurantData: any[] = []
    const bookingData: any[] = []

    // Generate plain objects
    // NOTE: Same order is used in creation
    for (let i = 0; i < GRAIN; i++) {
        brandData.push(BrandGenerator.generateData({
            id: faker.string.uuid()
        }))
        userData.push(UserGenerator.generateData({
            id: faker.string.uuid(),
            password: crypto.SHA256('test123').toString(),
            email: `user${i.toString()}@gmail.com` 
        }))
        addressData.push(AddressGenerator.generateData({
            longitude: new Decimal(faker.number.float({
                min: GEO_BOX.minLng,
                max: GEO_BOX.maxLng
            })),
            latitude: new Decimal(faker.number.float({
                min: GEO_BOX.minLat,
                max: GEO_BOX.maxLat
            }))
        }))
        adminData.push(AdminGenerator.generateData({
            id: faker.string.uuid(),
            password: crypto.SHA256('test123').toString(),
            email: `admin${i.toString()}@gmail.com`,
            brandID: brandData[i].id
        }))
        restaurantData.push(RestaurantGenerator.generateData({
            id: faker.string.uuid(),
            name: `${i.toString()} ${faker.food.dish()} ${faker.helpers.arrayElement(['House', 'Restaurant', 'Kitchen', 'Bistro', 'Grill', 'Cafe'])}`,
            addressID: addressData[i].id,
            brandID: brandData[i].id
        }))
        bookingData.push(BookingGenerator.generateData({
            id: faker.string.uuid(),
            restaurantID: restaurantData[i].id,
            userID: userData[i].id,
            bookingTime: dayjs(faker.date.between({
                from: timeFrom.toISOString(),
                to: timeTo.toISOString()
            })).toDate()
        }))
    }

    await prisma.$transaction(async (tx: any) => {
        // Promises here
        // let promises: Promise<any>[] = [];
        const seededTables: string[] = [];

        if ((await tx.brand.count()) === 0) {
            await tx.brand.createMany({
                data: brandData,
                skipDuplicates: true
            });
            seededTables.push('brands');
        }

        if ((await tx.user.count()) === 0) {
            await tx.user.createMany({
                data: userData,
                skipDuplicates: true
            });
            seededTables.push('users');
        }

        if ((await tx.address.count()) === 0) {
            await tx.address.createMany({
                data: addressData,
                skipDuplicates: true
            });
            seededTables.push('addresses');
        }

        // await Promise.all(promises);
        // promises = []

        if ((await tx.admin.count()) === 0) {
            await tx.admin.createMany({
                data: adminData,
                skipDuplicates: true
            });
            seededTables.push('admins');
        }

        if ((await tx.restaurant.count()) === 0) {
            await tx.restaurant.createMany({
                data: restaurantData,
                skipDuplicates: true

            });
            seededTables.push('restaurants');
        }

        if ((await tx.booking.count()) === 0) {
            await tx.booking.createMany({
                data: bookingData,
                skipDuplicates: true

            });
            seededTables.push('bookings');
        }

        // await Promise.all(promises);

        // eslint-disable-next-line
        console.info(`Database was seeded with ${seededTables.length} table(s)${seededTables.length > 0 ? ': ' + seededTables.join(', ') : '.'}`);
    })

}

seed().catch((error) => {
    // eslint-disable-next-line
    console.error('Seeding failed:', error);
    process.exit(1);
});

export default seed;