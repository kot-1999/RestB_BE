import { Prisma, Restaurant, PrismaClient } from '@prisma/client'

import { BaseQueries } from './BaseQueries';

export default class RestaurantQueries extends BaseQueries<
    Restaurant,
    Prisma.RestaurantWhereInput,
    Prisma.RestaurantSelect,
    Prisma.RestaurantCreateInput,
    Prisma.RestaurantUpdateInput> {

    constructor(prismaClient: PrismaClient) {
        super(prismaClient.restaurant)
        this.findOne = this.findOne.bind(this)
        this.softDelete = this.softDelete.bind(this)
        this.findByID = this.findByID.bind(this)
        this.createOne = this.createOne.bind(this)
        this.updateOne = this.updateOne.bind(this)
    }
}
