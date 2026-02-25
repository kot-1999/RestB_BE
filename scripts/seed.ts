import dayjs from 'dayjs'

import prisma from '../src/services/Prisma'
import AdminGenerator from '../tests/utils/AdminGenerator'
import BrandGenerator from '../tests/utils/BrandGenerator'
import UserGenerator from '../tests/utils/UserGenerator'

const timeFrom = dayjs().subtract(20, 'days')
const timeTo = dayjs().add(20, 'days')

const seedGrain = 10

async function seed() {
    const userData = [];
    const adminData = [];
    const brandData = []
    // Generate plain objects
    for (let i = 0; i < seedGrain; i++) {
        userData.push(UserGenerator.generateData({
            password: 'test123',
            email: `user${i.toString()}@gmail.com` 
        }));
        adminData.push(AdminGenerator.generateData({
            password: 'test123',
            email: `admin${i.toString()}@gmail.com`  
        }));
        brandData.push(BrandGenerator.generateData())
    }

    const promises: Promise<any>[] = [];
    const seededTables: string[] = [];

    let brands: any[]
    if ((await prisma.brand.count()) === 0) {
        brands = await prisma.brand.createMany({
            data: brandData,
            skipDuplicates: true
        });
        seededTables.push('brands');
    } else {
        brands = await prisma.brand.findMany()
    }

    if ((await prisma.user.count()) === 0) {
        promises.push(prisma.user.createMany({
            data: userData,
            skipDuplicates: true
        }));
        seededTables.push('users');
    }

    if ((await prisma.admin.count()) === 0) {
        promises.push(prisma.admin.createMany({
            data: adminData.map((value, index) => {
                return {
                    ...value,
                    brandID: brands[index].id
                }
            }),
            skipDuplicates: true
        }));
        seededTables.push('admins');
    }
    
    await Promise.all(promises);

    // eslint-disable-next-line
    console.info(`Database was seeded with ${seededTables.length} table(s)${seededTables.length > 0 ? ': ' + seededTables.join(', ') : '.'}`);
}

seed().catch((error) => {
    // eslint-disable-next-line
    console.error('Seeding failed:', error);
    process.exit(1);
});

export default seed;