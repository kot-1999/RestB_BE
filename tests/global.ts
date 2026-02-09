import 'dotenv'

import seed from '../scripts/seed';
import prisma from '../src/services/Prisma'

// Function to truncate all tables except _prisma_migrations
export async function clearDatabase() {
    const tables: { TABLE_NAME: string }[] = await prisma.$queryRaw`
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE();
    `

    // Disable FK checks (MySQL equivalent of CASCADE)
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;')

    for (const { TABLE_NAME } of tables) {
        if (TABLE_NAME !== '_prisma_migrations') {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\`;`)
        }
    }

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;')
}

// Mocha hook executed before all tests
export const mochaHooks = async () => {
    await clearDatabase()
    
    await seed()
}

export function mochaGlobalSetup() {
}
