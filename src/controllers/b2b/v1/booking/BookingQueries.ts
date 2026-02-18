import { Prisma, Booking, PrismaClient } from '@prisma/client'

import { BaseQueries } from '../../../../utils/BaseQueries';

export default class BookingQueries extends BaseQueries<
    Booking,
    Prisma.BookingWhereInput,
    Prisma.BookingSelect,
    Prisma.BookingCreateInput,
    Prisma.BookingUpdateInput> {

    constructor(prismaClient: PrismaClient) {
        super(prismaClient.booking)
        this.findOne = this.findOne.bind(this)
        this.softDelete = this.softDelete.bind(this)
        this.findByID = this.findByID.bind(this)
        this.createOne = this.createOne.bind(this)
        this.updateOne = this.updateOne.bind(this)
    }
}
