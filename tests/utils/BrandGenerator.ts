import { faker } from '@faker-js/faker'
import { Brand } from '@prisma/client'
import dayjs from 'dayjs'

import prisma from '../../src/services/Prisma'

export default class BrandGenerator {
    public static createOne(brandData: Partial<Brand> = {}): Promise<Brand> {
        return prisma.brand.create({
            data: BrandGenerator.generateData(brandData)
        })
    }

    public static generateData(brandData: Partial<Brand> = {}): Brand {
        const name = brandData.name ?? faker.company.name()
        return {
            id: brandData.id ?? faker.string.uuid(),
            name,
            logoURL: brandData.logoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=256&background=random`,
            createdAt: brandData.createdAt as Date ?? new Date(dayjs().toISOString()),
            updatedAt: brandData.updatedAt as Date ?? new Date(dayjs().toISOString()),
            deletedAt: brandData.deletedAt ?? null
        }
    }
}
