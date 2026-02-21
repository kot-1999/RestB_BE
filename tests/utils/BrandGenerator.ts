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
        return {
            id: brandData.id ?? faker.string.uuid(),
            name: brandData.name ?? faker.company.name(),
            logoURL: brandData.logoURL ?? faker.image.url(),
            createdAt: brandData.createdAt as Date ?? new Date(dayjs().toISOString()),
            updatedAt: brandData.updatedAt as Date ?? new Date(dayjs().toISOString()),
            deletedAt: brandData.deletedAt ?? null
        }
    }
}
