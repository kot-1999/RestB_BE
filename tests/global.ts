import 'dotenv'

import seed from '../scripts/seed';
import prisma from '../src/services/Prisma'

// Function to truncate all tables except _prisma_migrations
export async function clearDatabase() {
    const tables: Array<{ TABLE_NAME: string }> = await prisma.$queryRawUnsafe(`
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME != '_prisma_migrations';
    `);

    await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);

        for (const { TABLE_NAME } of tables) {
            await tx.$executeRawUnsafe(`DELETE FROM \`${TABLE_NAME}\``);
            await tx.$executeRawUnsafe(`ALTER TABLE \`${TABLE_NAME}\` AUTO_INCREMENT = 1`);
        }

        await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);
    });
}

// Mocha hook executed before all tests
export const mochaHooks = async () => {
    await clearDatabase()
    
    await seed()
}

export function mochaGlobalSetup() {
}
