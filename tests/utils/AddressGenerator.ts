import { faker } from '@faker-js/faker'
import { Address } from '@prisma/client'
import dayjs from 'dayjs'
import { Decimal } from '@prisma/client/runtime/library'

import prisma from '../../src/services/Prisma'

export default class AddressGenerator {
    public static createOne(addressData: Partial<Address> = {}): Promise<Address> {
        return prisma.address.create({
            data: AddressGenerator.generateData(addressData)
        })
    }

    public static generateData(addressData: Partial<Address> = {}): Address {
        return {
            id: addressData.id ?? faker.string.uuid(),
            building: addressData.building ?? faker.location.buildingNumber(),
            street: addressData.street ?? faker.location.street(),
            city: addressData.city ?? faker.location.city(),
            postcode: addressData.postcode ?? faker.location.zipCode(),
            country: addressData.country ?? faker.location.country(),
            latitude: addressData.latitude ?? new Decimal(faker.location.latitude()),
            longitude: addressData.longitude ?? new Decimal(faker.location.longitude()),
            createdAt: addressData.createdAt as Date ?? new Date(dayjs().toISOString()),
            updatedAt: addressData.updatedAt as Date ?? new Date(dayjs().toISOString()),
            deletedAt: addressData.deletedAt ?? null
        }
    }
}
