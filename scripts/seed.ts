import dayjs from 'dayjs';

import prisma from '../src/services/Prisma';
import AdminGenerator from '../tests/utils/AdminGenerator';
import UserGenerator from '../tests/utils/UserGenerator';

const timeFrom = dayjs().subtract(20, 'days')
const timeTo = dayjs().add(20, 'days')

const seedGrain = 10

async function seed() {
    const users = [];
    const admins = [];

    // Generate plain objects
    for (let i = 0; i < seedGrain; i++) {
        users.push(UserGenerator.generateData({ password: 'TestUser.123' }));
        admins.push(AdminGenerator.generateData({ password: 'TestAdmin.123' }));
    }

    const promises: Promise<any>[] = [];
    const seededTables: string[] = [];

    if ((await prisma.user.count()) === 0) {
        promises.push(prisma.user.createMany({
            data: users,
            skipDuplicates: true
        }));
        seededTables.push('users');
    }

    if ((await prisma.admin.count()) === 0) {
        promises.push(prisma.admin.createMany({
            data: admins,
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