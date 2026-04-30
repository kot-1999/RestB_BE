import * as fs from 'node:fs';
import * as path from 'node:path';

import { faker } from '@faker-js/faker';
import { AdminRole, BookingStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto-js';
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat';

import s3Service from '../src/services/AwsS3';
import prisma from '../src/services/Prisma'
import { AuthorType } from '../src/utils/enums';
import AddressGenerator from '../tests/utils/AddressGenerator';
import AdminGenerator from '../tests/utils/AdminGenerator'
import BookingGenerator from '../tests/utils/BookingGenerator';
import BrandGenerator from '../tests/utils/BrandGenerator'
import RestaurantGenerator from '../tests/utils/RestaurantGenerator';
import UserGenerator from '../tests/utils/UserGenerator'

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

const GRAIN = 300

const restaurantImagesDir = path.join(__dirname, 'restaurantPictures')
const menuImagesDir = path.join(__dirname, 'menuPictures')

const restaurantImages = fs.readdirSync(restaurantImagesDir)
const menuImages = fs.readdirSync(menuImagesDir)

const genDiscussion = (
    status: BookingStatus,
    adminID: string,
    userID: string
) => {
    const now = dayjs()

    const msg = (authorID: string, authorType: AuthorType, m = 0) => ({
        authorID,
        authorType,
        message: faker.lorem.sentence(),
        createdAt: now.subtract(m, 'minute').toISOString()
    })

    if (status === BookingStatus.Pending) {
        return [msg(userID, AuthorType.User, 10)]
    }

    if (status === BookingStatus.Approved) {
        return [
            msg(userID, AuthorType.User, 10),
            msg(adminID, AuthorType.Admin, 5),
            ...(Math.random() > 0.5 ? [msg(userID, AuthorType.User)] : [])
        ]
    }

    if (status === BookingStatus.Cancelled) {
        const byAdmin = Math.random() > 0.5
        return [
            msg(userID, AuthorType.User, 10),
            msg(byAdmin ? adminID : userID, byAdmin ? AuthorType.Admin : AuthorType.User)
        ]
    }

    return []
}

async function seed() {
    const userData: any[] = []
    const adminData: any[] = []
    const brandData: any[] = []

    const addressData: any[] = []
    const restaurantData: any[] = []
    const bookingData: any[] = []

    const restaurantEmployees: {
        employees: any[]
        restaurantStaff: any[]
    } = {
        employees: [],
        restaurantStaff: []
    }

    const uploadedRestaurantImages: string[] = []
    const uploadedMenuImages: string[] = []

    if ((await prisma.restaurant.count()) === 0) {
        for (const file of restaurantImages) {
            const url = await s3Service.uploadFile(
                path.join(restaurantImagesDir, file),
                'banner'
            )
            uploadedRestaurantImages.push(url)
        }

        for (const file of menuImages) {
            const url = await s3Service.uploadFile(
                path.join(menuImagesDir, file),
                'menu'
            )
            uploadedMenuImages.push(url)
        }
    }

    // Generate plain objects
    // NOTE: Same order is used in creation
    for (let i = 0; i < GRAIN; i++) {
        const random = Math.floor(Math.random() * 10) + 1;

        brandData.push(BrandGenerator.generateData({
            id: faker.string.uuid()
        }))

        userData.push(UserGenerator.generateData({
            id: faker.string.uuid(),
            password: crypto.SHA256('test123').toString(),
            email: `user${i.toString()}@gmail.com` 
        }))

        adminData.push(AdminGenerator.generateData({
            id: faker.string.uuid(),
            password: crypto.SHA256('test123').toString(),
            email: `admin${i.toString()}@gmail.com`,
            brandID: brandData[i].id
        }))

        for (let ri = 0; ri < random; ri++) {
            addressData.push(AddressGenerator.generateData({
                longitude: new Decimal(faker.number.float({
                    min: GEO_BOX.minLng,
                    max: GEO_BOX.maxLng
                })),
                latitude: new Decimal(faker.number.float({
                    min: GEO_BOX.minLat,
                    max: GEO_BOX.maxLat
                })),
                country: 'United Kingdom',
                city: 'London'
            }))
            const restaurantID = faker.string.uuid()
            restaurantData.push(RestaurantGenerator.generateData({
                id: restaurantID,
                // eslint-disable-next-line max-len
                name: `${i.toString()}-${ri.toString()} ${faker.food.dish()} ${faker.helpers.arrayElement(['House', 'Restaurant', 'Kitchen', 'Bistro', 'Grill', 'Cafe'])}`,
                addressID: addressData[i + ri].id,
                brandID: brandData[i].id,
                bannerURL: uploadedRestaurantImages.length ? faker.helpers.arrayElement(uploadedRestaurantImages) : undefined,
                photosURL: uploadedMenuImages.length 
                    ? faker.helpers.arrayElements(uploadedMenuImages, faker.number.int({
                        min: 1,
                        max: 8 
                    })) 
                    : undefined
            }))
            const numOfEmployees = Math.floor(Math.random() * 5) + 1;
            for (let ei = 0; ei < numOfEmployees; ei++) {
                const adminID = faker.string.uuid()
                restaurantEmployees.employees.push(AdminGenerator.generateData({
                    id: adminID,
                    password: crypto.SHA256('test123').toString(),
                    email: `employee${i.toString()}-${ei.toString()}@gmail.com`,
                    brandID: brandData[i].id,
                    role: AdminRole.Employee
                }))

                restaurantEmployees.restaurantStaff.push({
                    restaurantID,
                    adminID
                })
            }
        }

        for (let bdi = 0; bdi < random; bdi++) {
            for (let bi = 0; bi < (GRAIN / 20) + 1; bi++) {
                const bookingTime = dayjs(faker.date.between({
                    from: timeFrom.toISOString(),
                    to: timeTo.toISOString()
                }))

                const before = [BookingStatus.Completed, BookingStatus.Cancelled, BookingStatus.NoShow]
                const after = [BookingStatus.Approved, BookingStatus.Cancelled, BookingStatus.Pending]

                let status
                if (dayjs().isBefore(dayjs())) {
                    status = before[Math.floor(Math.random() * before.length)]
                } else {
                    status = after[Math.floor(Math.random() * after.length)]
                }

                bookingData.push(BookingGenerator.generateData({
                    id: faker.string.uuid(),
                    restaurantID: restaurantData[i + bdi].id,
                    userID: userData[i].id,
                    bookingTime: bookingTime.toDate(),
                    status: status,
                    discussion: genDiscussion(status, adminData[i].id, userData[i].id)
                }))
            }
        }
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
            await Promise.all([
                tx.admin.createMany({
                    data: adminData,
                    skipDuplicates: true
                }),
                tx.admin.createMany({
                    data: restaurantEmployees.employees,
                    skipDuplicates: true
                })
            ])
            seededTables.push('admins');
        }

        if ((await tx.restaurant.count()) === 0) {
            await tx.restaurant.createMany({
                data: restaurantData,
                skipDuplicates: true

            });
            seededTables.push('restaurants');
        }

        if ((await tx.restaurantStaff.count()) === 0) {
            await tx.restaurantStaff.createMany({
                data: restaurantEmployees.restaurantStaff,
                skipDuplicates: true
            })
            seededTables.push('restaurantStaff');
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
    }, {
        timeout: 60000 // 60s
    })

}

seed().catch((error) => {
    // eslint-disable-next-line
    console.error('Seeding failed:', error);
    process.exit(1);
});

export default seed;