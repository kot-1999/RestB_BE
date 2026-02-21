import { Prisma, Brand, PrismaClient } from '@prisma/client'

import { BaseQueries } from './BaseQueries';

export default class BrandQueries extends BaseQueries<
    Brand,
    Prisma.BrandWhereInput,
    Prisma.BrandSelect,
    Prisma.BrandCreateInput,
    Prisma.BrandUpdateInput> {

    constructor(prismaClient: PrismaClient) {
        super(prismaClient.brand)
        this.findOne = this.findOne.bind(this)
        this.softDelete = this.softDelete.bind(this)
        this.findByID = this.findByID.bind(this)
        this.createOne = this.createOne.bind(this)
        this.updateOne = this.updateOne.bind(this)
    }
}
