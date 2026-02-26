import { Prisma, Address, PrismaClient } from '@prisma/client'

import { BaseQueries } from './BaseQueries';

export default class AddressQueries extends BaseQueries<
    Address,
    Prisma.AddressWhereInput,
    Prisma.AddressSelect,
    Prisma.AddressCreateInput,
    Prisma.AddressUpdateInput> {

    constructor(prismaClient: PrismaClient) {
        super(prismaClient.address)
        this.findOne = this.findOne.bind(this)
        this.softDelete = this.softDelete.bind(this)
        this.findByID = this.findByID.bind(this)
        this.createOne = this.createOne.bind(this)
        this.updateOne = this.updateOne.bind(this)
    }
}
